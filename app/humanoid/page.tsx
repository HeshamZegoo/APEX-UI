import OriginalExperience from "@/components/humanoid/OriginalExperience";

export default function HumanoidPage() {
  return (
    <>
      <OriginalExperience />
      <a
        href="/"
        aria-label="Back to APEX home"
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 300,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 14px",
          border: "1px solid rgba(34,211,238,.35)",
          borderRadius: 999,
          background: "rgba(0,0,0,.72)",
          color: "#22d3ee",
          fontFamily: '"Share Tech Mono", monospace',
          fontSize: 11,
          letterSpacing: ".12em",
          textDecoration: "none",
          backdropFilter: "blur(12px)",
        }}
      >
        ← APEX HOME
      </a>
    </>
  );
}
