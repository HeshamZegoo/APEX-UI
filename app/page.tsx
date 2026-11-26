import ApexWorld from "@/components/ApexWorld";
import ApexOverviewPanel from "@/components/ApexOverviewPanel";

const navLinkStyle = {
  position: "absolute" as const,
  top: 16,
  zIndex: 40,
  fontFamily: "var(--font-mono)",
  fontSize: "0.66rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: "rgba(34,211,238,0.92)",
  textDecoration: "none",
  border: "1px solid rgba(34,211,238,0.35)",
  borderRadius: 20,
  padding: "8px 15px",
  background: "rgba(4,8,15,0.72)",
  backdropFilter: "blur(10px)",
};

export default function Home() {
  return (
    <main
      id="main"
      style={{ background: "#04080f", color: "#f0ede8", position: "relative", overflow: "hidden" }}
    >
      <ApexOverviewPanel />

      <section style={{ position: "relative", height: "100vh", minHeight: 620 }}>
        <ApexWorld />
      </section>

      {/* Direct connection to the original, full-screen Humanoid experience. */}
      <a href="/humanoid" style={{ ...navLinkStyle, right: "clamp(150px, 16vw, 220px)" }}>
        Open Humanoid ↗
      </a>

      <a
        href="https://github.com/RubenM1990/APEX-UI"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          ...navLinkStyle,
          right: "clamp(16px,3vw,40px)",
          color: "rgba(240,237,232,0.7)",
          borderColor: "rgba(240,237,232,0.2)",
        }}
      >
        View on GitHub ↗
      </a>
    </main>
  );
}
