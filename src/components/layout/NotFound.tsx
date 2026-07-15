import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <section className="not-found-panel" aria-labelledby="not-found-title">
      <p className="eyebrow">404 / Navigation check</p>
      <h2 id="not-found-title">That page is outside the command center.</h2>
      <p>The address may be outdated or mistyped. Your VCC-OS data is safe and unchanged.</p>
      <div className="not-found-actions">
        <a className="primary-action" href="/">
          <Home size={17} aria-hidden="true" /> Go to dashboard
        </a>
        <button type="button" className="ghost-button" onClick={() => window.history.back()}>
          <ArrowLeft size={17} aria-hidden="true" /> Go back
        </button>
      </div>
    </section>
  );
}
