export function PageHeader({ title, subtitle, back }: { title: string; subtitle: string; back: () => void }) {
  return (
    <div className="pageHeader">
      <button type="button" className="back" onClick={back}>Back to dashboard</button>
      <p className="kicker">Dedicated page</p>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}
