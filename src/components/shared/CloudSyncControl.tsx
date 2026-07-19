import { useEffect, useRef, useState } from "react";
import { Check, Cloud, CloudOff, ExternalLink, LoaderCircle, LogOut, Mail, MailCheck, RefreshCw, ShieldCheck, X } from "lucide-react";
import type { VccCloudSync } from "../../lib/cloud/useVccCloudSync";
import { gmailActionLabel, gmailInboxUrl, isMagicLinkConfirmation, magicLinkRetrySeconds, MAGIC_LINK_COOLDOWN_SECONDS, prefersGmailApp } from "../../lib/cloud/magicLinkFlow";
import "./cloud-sync-control.css";

const RESEND_AT_KEY = "vcc-os:magic-link-resend-at";

export default function CloudSyncControl({ sync }: { sync: VccCloudSync }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [resendAt, setResendAt] = useState(() => Number(window.sessionStorage.getItem(RESEND_AT_KEY)) || 0);
  const [confirmationReturn] = useState(() => isMagicLinkConfirmation(window.location.search));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const busy = sending || sync.status === "connecting" || sync.status === "saving";
  const retrySeconds = Math.max(0, Math.ceil((resendAt - now) / 1000));

  useEffect(() => {
    if (!resendAt || resendAt <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  useEffect(() => {
    if (!confirmationReturn || !sync.email) return;
    setOpen(true);
    window.history.replaceState({}, "", window.location.pathname);
    const timer = window.setTimeout(() => {
      setOpen(false);
      window.close();
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [confirmationReturn, sync.email]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : triggerRef.current;
    const dialog = dialogRef.current;
    const focusableSelector = "button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex='-1'])";
    const focusTimer = window.setTimeout(() => {
      (dialog?.querySelector<HTMLElement>("[data-autofocus]") || dialog?.querySelector<HTMLElement>(focusableSelector))?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [open]);

  function startCooldown(seconds = MAGIC_LINK_COOLDOWN_SECONDS) {
    const nextResendAt = Date.now() + seconds * 1000;
    window.sessionStorage.setItem(RESEND_AT_KEY, String(nextResendAt));
    setNow(Date.now());
    setResendAt(nextResendAt);
  }

  async function connect(targetEmail = email) {
    setError("");
    const normalizedEmail = targetEmail.trim().toLowerCase();
    if (!normalizedEmail.includes("@")) { setError("Enter a valid email address."); return; }
    setSending(true);
    try {
      await sync.sendMagicLink(normalizedEmail);
      setSentEmail(normalizedEmail);
      startCooldown();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not send the sign-in link.";
      const wait = magicLinkRetrySeconds(message);
      if (wait) {
        setSentEmail(normalizedEmail);
        startCooldown(wait);
        setError("A sign-in email was already requested. Wait for the timer before sending another.");
      } else {
        setError(message);
      }
    } finally {
      setSending(false);
    }
  }

  function resetRequest() {
    setSentEmail("");
    setError("");
  }

  function closeConfirmation() {
    setOpen(false);
    window.close();
  }

  function openGmail() {
    const target = gmailInboxUrl(sentEmail, window.navigator.userAgent);
    if (prefersGmailApp(window.navigator.userAgent)) {
      window.location.assign(target);
      return;
    }
    window.open(target, "_blank", "noopener,noreferrer");
  }

  const label = sync.email ? (sync.status === "synced" ? "Synced" : sync.status === "saving" ? "Saving" : "Connected") : "Sync devices";
  return <>
    <button ref={triggerRef} className={`cloud-sync-trigger ${sync.email ? "connected" : ""}`} type="button" onClick={() => setOpen(true)}>
      {busy ? <LoaderCircle className="spin" size={16}/> : sync.email ? <Cloud size={16}/> : <CloudOff size={16}/>} {label}
    </button>
    {open && <div className="cloud-sync-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section ref={dialogRef} className="cloud-sync-dialog" role="dialog" aria-modal="true" aria-labelledby="cloud-sync-title" aria-describedby="cloud-sync-description">
        <button className="cloud-sync-close" type="button" aria-label="Close" onClick={() => setOpen(false)}><X/></button>
        <span className={`cloud-sync-icon ${confirmationReturn && sync.email ? "is-success" : ""}`}>
          {confirmationReturn && sync.email ? <ShieldCheck/> : sentEmail ? <MailCheck/> : <Cloud/>}
        </span>
        <h2 id="cloud-sync-title">{confirmationReturn && sync.email ? "Device connected" : sentEmail ? "Check your Gmail" : "VCC everywhere"}</h2>
        {confirmationReturn && sync.email ? <>
          <p id="cloud-sync-description"><strong>{sync.email}</strong> is confirmed. VitaScan and VCC are now connected on this device.</p>
          <div className="cloud-sync-state" role="status"><Check size={16}/> Connection complete. Closing this window...</div>
          <button className="cloud-sync-secondary" type="button" data-autofocus onClick={closeConfirmation}><X size={16}/> Close now</button>
        </> : sync.email ? <>
          <p id="cloud-sync-description">Signed in as <strong>{sync.email}</strong>. Changes from VitaScan, mobile, and desktop share one protected VCC account.</p>
          <div className="cloud-sync-state"><Check size={16}/>{sync.message || "Your data is synced."}</div>
          <button className="cloud-sync-secondary" type="button" data-autofocus onClick={sync.signOut}><LogOut size={16}/> Sign out on this device</button>
        </> : sentEmail ? <>
          <p id="cloud-sync-description">We sent a secure, one-time sign-in link to the Gmail account below.</p>
          <div className="cloud-sync-account" aria-label={`Confirmation sent to ${sentEmail}`}>
            <Mail size={18}/>
            <span><small>Confirmation destination</small><strong>{sentEmail}</strong></span>
            <Check size={17}/>
          </div>
          <button className="cloud-sync-primary cloud-sync-gmail" type="button" data-autofocus onClick={openGmail}>
            <ExternalLink size={17}/> {gmailActionLabel(window.navigator.userAgent)}
          </button>
          <button className="cloud-sync-resend" type="button" disabled={sending || retrySeconds > 0} onClick={() => connect(sentEmail)}>
            {sending ? <LoaderCircle className="spin" size={17}/> : <RefreshCw size={17}/>}
            {retrySeconds > 0 ? `Resend available in ${retrySeconds}s` : "Resend sign-in email"}
          </button>
          {error && <p className="cloud-sync-message" role="alert">{error}</p>}
          <div className="cloud-sync-delivery-note">
            <Mail size={16}/><span>Confirm that Gmail shows <strong>{sentEmail}</strong> in the account menu. Check <strong>Spam</strong> and search for <strong>VitaScan</strong>. Only the newest link will work.</span>
          </div>
          <button className="cloud-sync-text-button" type="button" onClick={resetRequest}>Use a different email</button>
        </> : <>
          <p id="cloud-sync-description">Use the same email on every device. We will send a secure passwordless sign-in link.</p>
          <form className="cloud-sync-form" onSubmit={(event) => { event.preventDefault(); connect(); }}>
            <label className="cloud-sync-email"><span>Email address</span><div><Mail size={17}/><input data-autofocus type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" aria-invalid={Boolean(error)} aria-describedby={error ? "cloud-sync-error" : undefined}/></div></label>
            <button className="cloud-sync-primary" type="submit" disabled={busy || !sync.configured}>{busy ? <LoaderCircle className="spin"/> : <Cloud/>} Connect this device</button>
            {(error || sync.message) && <p className="cloud-sync-message" id="cloud-sync-error" role={error ? "alert" : "status"}>{error || sync.message}</p>}
            <small>Local data stays on this device until you sign in. The first signed-in device becomes the initial shared VCC copy.</small>
          </form>
        </>}
      </section>
    </div>}
  </>;
}
