export default function Dashboard() {
  const cards = [
    ["Daily Briefing", "VCC is back online", "App engine restored. Now we rebuild the dashboard pieces."],
    ["Today’s Mission", "Stabilize the numbers", "Update cash, bills, food, gas, and the next move."],
    ["Money Snapshot", "$0.00", "Placeholder until we reconnect your real data."],
    ["Priority Alerts", "3 active", "Bills, food/inventory, and car payment need tracking."],
    ["Buy Next", "Food • Gas • Basics", "Critical inventory will live here."],
    ["Goal Progress", "35%", "VCC recovery is moving. Engine works now."],
    ["Bills", "Needs update", "Paid, unpaid, overdue, and due dates will connect here."],
    ["Debt", "Needs update", "Car balance, MyPay, SpotMe, and other debts."],
    ["Savings", "$0.00", "Emergency fund and goal money will track here."],
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#07111f", color: "white", padding: 32, fontFamily: "Arial, sans-serif" }}>
      <section style={{ marginBottom: 28, padding: 28, borderRadius: 24, background: "#0f2744", border: "1px solid rgba(255,255,255,0.15)" }}>
        <p style={{ margin: 0, color: "#38bdf8", textTransform: "uppercase", letterSpacing: 2, fontWeight: 800 }}>
          Vitality Command Center
        </p>
        <h1 style={{ margin: "10px 0", fontSize: 44 }}>VCC 2.0 Dashboard</h1>
        <p style={{ margin: 0, color: "#cbd5e1" }}>
          Money, bills, inventory, goals, and daily decisions in one command center.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
        {cards.map(([title, value, note]) => (
          <article key={title} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: 20, minHeight: 150 }}>
            <p style={{ margin: 0, color: "#38bdf8", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
              {title}
            </p>
            <h2 style={{ margin: "14px 0 8px", fontSize: 25 }}>{value}</h2>
            <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.5 }}>{note}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
