export function PageHeader({ title, subtitle, back }: { title: string; subtitle: string; back: () => void }) {
  return (
    <div className="pageHeader">
      <button className="back" onClick={back}>â† DASHBOARD</button>
      <p className="kicker">DEDICATED_PAGE</p>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}
