"use client";

import type { CSSProperties } from "react";

export type HumanoidState = "idle" | "listening" | "thinking" | "speaking";

const ASSETS = "https://raw.githubusercontent.com/HeshamZegoo/apex-humanoid-assets/main";

const STATE_IMAGES: Record<HumanoidState, string> = {
  idle: `${ASSETS}/apex-idle-v1.webp`,
  listening: `${ASSETS}/apex-listening-v1.webp`,
  thinking: `${ASSETS}/apex-thinking-v1.webp`,
  speaking: `${ASSETS}/apex-speaking-v1.webp`,
};

const LABELS: Record<HumanoidState, string> = {
  idle: "STANDBY",
  listening: "LISTENING",
  thinking: "PROCESSING",
  speaking: "SPEAKING",
};

export default function ApexHumanoid({
  state = "idle",
  onActivate,
}: {
  state?: HumanoidState;
  onActivate?: () => void;
}) {
  const style: CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    isolation: "isolate",
    cursor: onActivate ? "pointer" : "default",
  };

  return (
    <div
      className={`apex-humanoid apex-humanoid--${state}`}
      style={style}
      onClick={onActivate}
      role={onActivate ? "button" : undefined}
      tabIndex={onActivate ? 0 : undefined}
      onKeyDown={onActivate ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate();
        }
      } : undefined}
      aria-label={onActivate ? "Activate Apex humanoid" : "Apex humanoid"}
    >
      <img
        className="apex-humanoid__backdrop"
        src={`${ASSETS}/backdrop-v1.webp`}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <div className="apex-humanoid__aura" aria-hidden="true" />
      <img
        key={state}
        className="apex-humanoid__figure"
        src={STATE_IMAGES[state]}
        alt={`Apex humanoid — ${LABELS[state].toLowerCase()}`}
        draggable={false}
      />
      <div className="apex-humanoid__readout" aria-live="polite">
        <span className="apex-humanoid__readout-dot" />
        {LABELS[state]}
      </div>
    </div>
  );
}
