// Phase 0 placeholder — Dashboard content will be built in Phase 3
export default function V2DashboardPage() {
  return (
    <div style={{ color: "var(--txt-primary)", fontFamily: "var(--font-sans)" }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "16px",
        textAlign: "center"
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "linear-gradient(135deg, #6D28D9, #7C3AED, #6366F1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32
        }}>🧭</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--txt-primary)" }}>
          Dashboard
        </h2>
        <p style={{ color: "var(--txt-secondary)", fontSize: 14 }}>
          Phase 0 complete · Shell & design system ready ✓
        </p>
        <p style={{ color: "var(--txt-muted)", fontSize: 13 }}>
          Dashboard content (KPIs, pipeline, activity) coming in Phase 3.
        </p>
      </div>
    </div>
  )
}
