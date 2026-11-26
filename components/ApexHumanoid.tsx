"use client";

import { useEffect, useRef, useState } from "react";

export type HumanoidState = "idle" | "listening" | "thinking" | "speaking";

const ASSETS = "https://raw.githubusercontent.com/HeshamZegoo/apex-humanoid-assets/main";
const SOURCES: Record<string, string> = {
  assembly25: `${ASSETS}/apex-assembly-25-v1.webp`,
  assembly60: `${ASSETS}/apex-assembly-60-v1.webp`,
  idle: `${ASSETS}/apex-idle-v1.webp`,
  listening: `${ASSETS}/apex-listening-v1.webp`,
  thinking: `${ASSETS}/apex-thinking-v1.webp`,
  speaking: `${ASSETS}/apex-speaking-v1.webp`,
  speakingStrong: `${ASSETS}/apex-speaking-strong-v1.webp`,
  backdrop: `${ASSETS}/backdrop-v1.webp`,
};

const LABELS: Record<HumanoidState, string> = {
  idle: "STANDBY",
  listening: "LISTENING",
  thinking: "PROCESSING",
  speaking: "SPEAKING",
};

type Dot = { x: number; y: number; r: number; color: string; alpha: number; phase: number; speed: number };
type Frame = { dots: Dot[]; width: number; height: number };

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function sampleFrame(image: HTMLImageElement): Frame {
  const width = 420;
  const height = 520;
  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { dots: [], width, height };
  ctx.clearRect(0, 0, width, height);

  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const dots: Dot[] = [];
  const step = 4;

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const i = (y * width + x) * 4;
      const a = pixels[i + 3] / 255;
      if (a < 0.12) continue;
      const red = pixels[i], green = pixels[i + 1], blue = pixels[i + 2];
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      if (luminance < 18) continue;
      const alpha = Math.min(1, a * (0.38 + luminance / 360));
      const radius = 0.48 + Math.min(1.15, luminance / 180) * 0.58;
      dots.push({
        x: x + (Math.random() - 0.5) * 0.7,
        y: y + (Math.random() - 0.5) * 0.7,
        r: radius,
        color: `rgb(${red},${green},${blue})`,
        alpha,
        phase: Math.random() * Math.PI * 2,
        speed: 0.55 + Math.random() * 1.15,
      });
    }
  }
  return { dots, width, height };
}

export default function ApexHumanoid({
  state = "idle",
  onActivate,
}: {
  state?: HumanoidState;
  onActivate?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef<Record<string, Frame>>({});
  const pointerRef = useRef({ x: 0, y: 0 });
  const stateRef = useRef<HumanoidState>(state);
  const previousRef = useRef<HumanoidState>(state);
  const transitionRef = useRef(0);
  const birthStartRef = useRef(0);
  const [loaded, setLoaded] = useState(false);
  const [birthDone, setBirthDone] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const keys = Object.keys(SOURCES);
    Promise.all(keys.map(async (key) => {
      const image = await loadImage(SOURCES[key]);
      return [key, sampleFrame(image)] as const;
    })).then((entries) => {
      if (cancelled) return;
      framesRef.current = Object.fromEntries(entries);
      setLoaded(true);
    }).catch((error) => {
      console.error("[APEX] Humanoid artwork failed to load", error);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loaded || birthDone) return;
    if (reducedMotion) {
      setBirthDone(true);
      return;
    }
    let cancelled = false;
    birthStartRef.current = performance.now();
    const timer1 = window.setTimeout(() => {
      if (cancelled) return;
      previousRef.current = "idle";
      transitionRef.current = performance.now();
    }, 1050);
    const timer2 = window.setTimeout(() => {
      if (!cancelled) setBirthDone(true);
    }, 2450);
    return () => {
      cancelled = true;
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [loaded, birthDone, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    let raf = 0;
    let lastPaint = 0;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let lastState = stateRef.current;
    const resize = () => {
      const rect = host.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      if (!loaded || now - lastPaint < 32) return;
      lastPaint = now;
      const frames = framesRef.current;
      const active = stateRef.current;
      if (active !== lastState) {
        previousRef.current = lastState;
        lastState = active;
        transitionRef.current = now;
      }

      ctx.clearRect(0, 0, width, height);
      const scale = Math.min(width / 420, height / 520);
      const drawW = 420 * scale;
      const drawH = 520 * scale;
      const left = (width - drawW) / 2;
      const top = (height - drawH) / 2;
      const seconds = now * 0.001;
      const centerX = left + drawW * 0.5;
      const centerY = top + drawH * 0.34;

      const aura = ctx.createRadialGradient(centerX, centerY + drawH * 0.08, 2, centerX, centerY + drawH * 0.08, drawW * 0.58);
      aura.addColorStop(0, active === "speaking" ? "rgba(0,224,255,.23)" : "rgba(0,190,255,.15)");
      aura.addColorStop(0.52, "rgba(0,130,220,.07)");
      aura.addColorStop(1, "rgba(0,70,140,0)");
      ctx.fillStyle = aura;
      ctx.fillRect(left - 30, top - 20, drawW + 60, drawH + 40);

      const drawFrame = (frame: Frame | undefined, reveal = 1, seed = 0) => {
        if (!frame) return;
        ctx.save();
        if (reveal < 1) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.max(2, reveal * Math.max(width, height) * 0.85), 0, Math.PI * 2);
          ctx.clip();
        }
        const breath = reducedMotion ? 0 : Math.sin(seconds * 1.15) * 1.35;
        const headTurn = reducedMotion ? 0 : pointerRef.current.x * 0.055;
        const headLift = reducedMotion ? 0 : pointerRef.current.y * 0.008;
        for (let i = 0; i < frame.dots.length; i++) {
          const dot = frame.dots[i];
          const isHead = dot.y < 205;
          const movement = reducedMotion ? 0 : Math.sin(seconds * dot.speed + dot.phase + seed) * (0.24 + (active === "speaking" ? 0.65 : 0.2));
          const headOffset = (dot.x - 210) / 210;
          const x = left + (dot.x - 210) * scale * (isHead ? 1 - Math.abs(headOffset) * Math.abs(headTurn) * 0.24 : 1) + (isHead ? headTurn * 13 * scale : 0);
          const y = top + (dot.y - 260) * scale + (dot.y > 300 ? breath : isHead ? headLift + headOffset * headTurn * 5 * scale : 0) + movement * scale;
          const pulse = reducedMotion ? 1 : 0.78 + 0.22 * Math.sin(seconds * (active === "speaking" ? 5.2 : 2.1) + dot.phase);
          ctx.globalAlpha = dot.alpha * pulse;
          ctx.fillStyle = dot.color;
          ctx.beginPath();
          ctx.arc(x, y, dot.r * scale * (active === "speaking" ? 1.08 : 1), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      };

      if (!birthDone) {
        const phase = Math.max(0, Math.min(1, (now - birthStartRef.current) / 2450));
        const a = frames.assembly25;
        const b = frames.assembly60;
        const idle = frames.idle;
        if (a && b && idle) {
          drawFrame(a, Math.min(1, phase * 2.2), 0.5);
          if (phase > 0.35) drawFrame(b, Math.min(1, (phase - 0.35) * 2.1), 1.4);
          if (phase > 0.72) drawFrame(idle, Math.min(1, (phase - 0.72) * 3.6), 2.1);
          const wave = Math.max(0, Math.min(1, (phase - 0.78) / 0.22));
          if (wave > 0 && wave < 1) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, wave * drawW * 0.7, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(80,230,255,${(1 - wave) * 0.5})`;
            ctx.lineWidth = 2 + (1 - wave) * 5;
            ctx.shadowColor = "#00dfff";
            ctx.shadowBlur = 24;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }
      } else {
        const from = frames[previousRef.current] || frames.idle;
        const to = (active === "speaking" ? frames.speakingStrong : frames[active]) || frames[active] || frames.idle;
        const progress = reducedMotion ? 1 : Math.min(1, (now - transitionRef.current) / 980);
        if (progress >= 1) {
          drawFrame(to);
        } else {
          drawFrame(from);
          drawFrame(to, progress * progress * (3 - 2 * progress), 1.7);
        }
      }
    };
    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [loaded, birthDone, reducedMotion]);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRef.current = {
      x: Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)),
      y: Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1)),
    };
  };

  return (
    <div
      ref={hostRef}
      className={`apex-humanoid apex-humanoid--${state}`}
      onPointerMove={onPointerMove}
      onPointerLeave={() => { pointerRef.current = { x: 0, y: 0 }; }}
      onClick={onActivate}
      role={onActivate ? "button" : undefined}
      tabIndex={onActivate ? 0 : undefined}
      onKeyDown={onActivate ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate();
        }
      } : undefined}
      aria-label={onActivate ? "Activate APEX humanoid" : "APEX humanoid"}
    >
      <img className="apex-humanoid__backdrop" src={SOURCES.backdrop} alt="" aria-hidden="true" draggable={false} />
      <div className="apex-humanoid__aura" aria-hidden="true" />
      <canvas ref={canvasRef} className="apex-humanoid__canvas" aria-hidden="true" />
      <div className="apex-humanoid__readout" aria-live="polite">
        <span className="apex-humanoid__readout-dot" />
        {LABELS[state]}
      </div>
      {!loaded && <div className="apex-humanoid__loading">INITIALIZING VISUAL CORE</div>}
    </div>
  );
}
