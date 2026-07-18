import { useState } from "react";
import { Check, Cloud, CloudOff, LoaderCircle, LogOut, Mail, X } from "lucide-react";
import type { VccCloudSync } from "../../lib/cloud/useVccCloudSync";
import "./cloud-sync-control.css";

export default function CloudSyncControl({ sync }: { sync: VccCloudSync }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const busy = sync.status === "connecting" || sync.status === "saving";

  async function connect() {
    setError("");
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    try { await sync.sendMagicLink(email.trim()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send the sign-in link."); }
  }

  const label = sync.email ? (sync.status === "synced" ? "Synced" : sync.status === "saving" ? "Saving" : "Connected") : "Sync devices";
  return <>
    <button className={`cloud-sync-trigger ${sync.email ? "connected" : ""}`} type="button" onClick={() => setOpen(true)}>
      {busy ? <LoaderCircle className="spin" size={16}/> : sync.email ? <Cloud size={16}/> : <CloudOff size={16}/>} {label}
    </button>
    {open && <div className="cloud-sync-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="cloud-sync-dialog" role="dialog" aria-modal="true" aria-labelledby="cloud-sync-title">
        <button className="cloud-sync-close" type="button" aria-label="Close" onClick={() => setOpen(false)}><X/></button>
        <span className="cloud-sync-icon"><Cloud/></span>
        <h2 id="cloud-sync-title">VCC everywhere</h2>
        {sync.email ? <>
          <p>Signed in as <strong>{sync.email}</strong>. Changes from VitaScan, mobile, and desktop share one protected VCC account.</p>
          <div className="cloud-sync-state"><Check size={16}/>{sync.message || "Your data is synced."}</div>
          <button className="cloud-sync-secondary" type="button" onClick={sync.signOut}><LogOut size={16}/> Sign out on this device</button>
        </> : <>
          <p>Use the same email on every device. We will send a secure passwordless sign-in link.</p>
          <label className="cloud-sync-email"><span>Email address</span><div><Mail size={17}/><input type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"/></div></label>
          <button className="cloud-sync-primary" type="button" disabled={busy || !sync.configured} onClick={connect}>{busy ? <LoaderCircle className="spin"/> : <Cloud/>} Connect this device</button>
          {(error || sync.message) && <p className="cloud-sync-message">{error || sync.message}</p>}
          <small>Local data stays on this device until you sign in. The first signed-in device becomes the initial shared VCC copy.</small>
        </>}
      </section>
    </div>}
  </>;
}
