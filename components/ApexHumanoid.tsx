"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { PointerEvent } from "react";
import { Canvas } from "@react-three/fiber";
import FaceParticles from "./humanoid/components/FaceParticles";
import { useFaceAnimation } from "./humanoid/hooks/useFaceAnimation";
import type { FaceState } from "./humanoid/constants";

const STATE_INDEX: Record<FaceState, number> = {
  idle: 0,
  listening: 1,
  thinking: 2,
  speaking: 3,
};

const STATE_LABEL: Record<FaceState, string> = {
  idle: "STANDBY",
  listening: "LISTENING",
  thinking: "PROCESSING",
  speaking: "SPEAKING",
};

function FaceStage({ state }: { state: FaceState }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onAssemblyComplete = useCallback(() => {}, []);
  const animation = useFaceAnimation({
    initialState: state,
    onAssemblyComplete,
  });

  useEffect(() => {
    animation.setState(state);
  }, [state, animation.setState]);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    animation.setMousePosition(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    );
  };

  const uniforms = useMemo(() => ({
    uTime: performance.now() / 1000,
    uState: STATE_INDEX[animation.currentState],
    uAudioLevel: state === "speaking" ? 0.22 + Math.sin(performance.now() * 0.008) * 0.12 : 0,
    uAssemblyProgress: animation.assemblyProgress,
    uBreathingPhase: animation.breathingPhase,
    uHeadRotation: animation.headRotation,
    uMouseInfluence: animation.mouseInfluence,
    uPixelRatio: Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1.5),
    uSizeK: 1,
  }), [
    state,
    animation.currentState,
    animation.assemblyProgress,
    animation.breathingPhase,
    animation.headRotation,
    animation.mouseInfluence,
  ]);

  return (
    <div
      ref={hostRef}
      className={`apex-humanoid apex-humanoid--${state}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => animation.setMousePosition(0, 0)}
      onDoubleClick={() => animation.replayAssembly()}
      aria-label={`APEX humanoid, ${STATE_LABEL[state]}`}
    >
      <div className="apex-humanoid__backdrop" aria-hidden="true" />
      <div className="apex-humanoid__aura" aria-hidden="true" />
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 3.65], fov: 45, near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        frameloop="always"
        fallback={<div className="apex-humanoid__loading">WEBGL NOT AVAILABLE</div>}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}
      >
        <FaceParticles uniforms={uniforms} cameraPosition={[0, 0, 3.65]} />
      </Canvas>
      <div className="apex-humanoid__readout" aria-live="polite">
        <span className="apex-humanoid__readout-dot" />
        {STATE_LABEL[state]} · 60K GPU PARTICLES
      </div>
    </div>
  );
}

export default function ApexHumanoid({
  state = "idle",
  onActivate,
}: {
  state?: FaceState;
  onActivate?: () => void;
}) {
  return (
    <div
      className="apex-humanoid-interaction"
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
      <FaceStage state={state} />
    </div>
  );
}
