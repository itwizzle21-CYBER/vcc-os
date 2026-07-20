import { useEffect, useRef, useState } from "react";
import { Check, Cloud, CloudOff, ExternalLink, LoaderCircle, LogOut, Mail, MailCheck, RefreshCw, ShieldCheck, X } from "lucide-react";
import type { VccCloudSync } from "../../lib/cloud/useVccCloudSync";
import { gmailActionLabel, gmailInboxUrl, isCompleteLoginCode, isMagicLinkConfirmation, LOGIN_CODE_MAX_LENGTH, magicLinkRetrySeconds, MAGIC_LINK_COOLDOWN_SECONDS, normalizeLoginCode, shouldAutoCloseConfirmation, usesAndroidGmailIntent } from "../../lib/cloud/magicLinkFlow";
import "./cloud-sync-control.css";

const RESEND_AT_KEY = "vcc-os:magic-link-resend-at";
const LOGIN_EMAIL_KEY = "vcc-os:login-code-email";

export default function CloudSyncControl({ sync }: { sync: VccCloudSync }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sentEmail, setSentEmail] = useState(() => window.sessionStorage.getItem(LOGIN_EMAIL_KEY) || "");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [loginCode, setLoginCode] = useState("");
  const [now, setNow] = useState(Date.now());
  const [resendAt, setResendAt] = useState(() => Number(window.sessionStorage.getItem(RESEND_AT_KEY)) || 0);
  const [confirmationReturn, setConfirmationReturn] = useState(() => isMagicLinkConfirmation(window.location.search));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const busy = sending || verifying || restoring || sync.status === "connecting" || sync.status === "saving";
  const retrySeconds = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const standaloneApp = window.matchMedia?.("(display-mode: standalone)").matches
    || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  const canAutoCloseConfirmation = shouldAutoCloseConfirmation(Boolean(window.opener), standaloneApp);

  useEffect(() => {
    if (!resendAt || resendAt <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  useEffect(() => {
    if (!sync.email) return;
    window.sessionStorage.removeItem(LOGIN_EMAIL_KEY);
    setSentEmail("");
    setLoginCode("");
  }, [sync.email]);

  useEffect(() => {
    if (!confirmationReturn || !sync.email) return;
    setOpen(true);
    window.history.replaceState(window.history.state, "", window.location.pathname);
    const timer = window.setTimeout(() => {
      setConfirmationReturn(false);
      setOpen(false);
      if (canAutoCloseConfirmation) window.close();
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [canAutoCloseConfirmation, confirmationReturn, sync.email]);

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
      await sync.sendLoginCode(normalizedEmail);
      setSentEmail(normalizedEmail);
      window.sessionStorage.setItem(LOGIN_EMAIL_KEY, normalizedEmail);
      setLoginCode("");
      startCooldown();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not send the sign-in link.";
      const wait = magicLinkRetrySeconds(message);
      if (wait) {
        setSentEmail(normalizedEmail);
        window.sessionStorage.setItem(LOGIN_EMAIL_KEY, normalizedEmail);
        startCooldown(wait);
        setError("A sign-in code was already requested. Wait for the timer before sending another.");
      } else {
        setError(message);
      }
    } finally {
      setSending(false);
    }
  }

  function resetRequest() {
    setSentEmail("");
    window.sessionStorage.removeItem(LOGIN_EMAIL_KEY);
    setLoginCode("");
    setError("");
  }

  async function verifyCode() {
    setError("");
    if (!isCompleteLoginCode(loginCode)) {
      setError("Enter the complete six- or eight-digit code from Gmail.");
      return;
    }
    setVerifying(true);
    try {
      await sync.verifyLoginCode(sentEmail, loginCode);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "That code could not be verified.");
    } finally {
      setVerifying(false);
    }
  }

  async function restoreCloudCopy() {
    if (!window.confirm("Replace the data shown on this device with the protected VCC cloud copy?")) return;
    setError("");
    setRestoring(true);
    try {
      await sync.restoreFromCloud();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The protected cloud copy could not be restored.");
    } finally {
      setRestoring(false);
    }
  }

  function closeConfirmation() {
    setConfirmationReturn(false);
    setOpen(false);
    if (canAutoCloseConfirmation) window.close();
  }

  function openGmail() {
    const target = gmailInboxUrl(sentEmail, window.navigator.userAgent);
    if (usesAndroidGmailIntent(window.navigator.userAgent)) {
      window.location.assign(target);
      return;
    }
    window.open(target, "_blank", "noopener,noreferrer");
  }

  const label = sync.email ? (sync.status === "synced" ? "Synced" : sync.status === "saving" ? "Saving" : "Connected") : "Sync devices";
  return <>
    <button ref={triggerRef} className={`cloud-sync-trigger ${sync.email ? "connected" : ""}`} type="button" onClick={() => setOpen(true)} aria-label={label} title={label}>
      {busy ? <LoaderCircle className="spin" size={18}/> : sync.email ? <Cloud size={18}/> : <CloudOff size={18}/>}<span>{label}</span>
    </button>
    {open && <div className="cloud-sync-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section ref={dialogRef} className="cloud-sync-dialog" role="dialog" aria-modal="true" aria-labelledby="cloud-sync-title" aria-describedby="cloud-sync-description">
        <button className="cloud-sync-close" type="button" aria-label="Close" onClick={() => setOpen(false)}><X/></button>
        <span className={`cloud-sync-icon ${confirmationReturn && sync.email ? "is-success" : ""}`}>
          {confirmationReturn && sync.email ? <ShieldCheck/> : sentEmail ? <MailCheck/> : <Cloud/>}
        </span>
        <h2 id="cloud-sync-title">{confirmationReturn && sync.email ? "Device connected" : sentEmail ? "Enter your VitaScan code" : "VCC everywhere"}</h2>
        {confirmationReturn && sync.email ? <>
          <p id="cloud-sync-description"><strong>{sync.email}</strong> is confirmed. VitaScan and VCC are now connected on this device.</p>
          <div className="cloud-sync-state" role="status"><Check size={16}/> Connection complete. {canAutoCloseConfirmation ? "Closing this sign-in tab..." : "Returning to VitaScan..."}</div>
          <button className="cloud-sync-secondary" type="button" data-autofocus onClick={closeConfirmation}>
            {canAutoCloseConfirmation ? <><X size={16}/> Close now</> : <><Check size={16}/> Continue to VitaScan</>}
          </button>
        </> : sync.email ? <>
          <p id="cloud-sync-description">Signed in as <strong>{sync.email}</strong>. Changes from VitaScan, mobile, and desktop share one protected VCC account.</p>
          <div className="cloud-sync-state"><Check size={16}/>{sync.message || "Your data is synced."}</div>
          <button className="cloud-sync-primary" type="button" data-autofocus disabled={busy} onClick={restoreCloudCopy}>
            {restoring ? <LoaderCircle className="spin" size={17}/> : <RefreshCw size={17}/>} Restore protected cloud copy
          </button>
          <small>This reloads the latest protected VCC data onto this device. Every later cloud replacement is kept in recovery history.</small>
          {error && <p className="cloud-sync-message" role="alert">{error}</p>}
          <button className="cloud-sync-secondary" type="button" disabled={busy} onClick={sync.signOut}><LogOut size={16}/> Sign out on this device</button>
        </> : sentEmail ? <>
          <p id="cloud-sync-description">We sent a secure sign-in code to the Gmail account below. Enter the complete six- or eight-digit code to load your VCC data.</p>
          <div className="cloud-sync-account" aria-label={`Confirmation sent to ${sentEmail}`}>
            <Mail size={18}/>
            <span><small>Confirmation destination</small><strong>{sentEmail}</strong></span>
            <Check size={17}/>
          </div>
          <form className="cloud-sync-code-form" onSubmit={(event) => { event.preventDefault(); void verifyCode(); }}>
            <label className="cloud-sync-code" htmlFor="vcc-one-time-code">
              <span>Verification code</span>
              <input
                id="vcc-one-time-code"
                name="one-time-code"
                data-autofocus
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                enterKeyHint="done"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={LOGIN_CODE_MAX_LENGTH}
                value={loginCode}
                onChange={(event) => setLoginCode(normalizeLoginCode(event.target.value))}
                placeholder="00000000"
                aria-invalid={Boolean(error)}
                aria-describedby={`${error ? "cloud-sync-code-error " : ""}cloud-sync-code-help`}
              />
            </label>
            <small id="cloud-sync-code-help">Tap the code suggestion above your phone keyboard to fill it automatically.</small>
            <button className="cloud-sync-primary" type="submit" disabled={verifying || !isCompleteLoginCode(loginCode)}>
              {verifying ? <LoaderCircle className="spin" size={17}/> : <ShieldCheck size={17}/>} Verify and sync
            </button>
          </form>
          <button className="cloud-sync-secondary cloud-sync-gmail" type="button" onClick={openGmail}>
            <ExternalLink size={17}/> {gmailActionLabel(window.navigator.userAgent)}
          </button>
          <button className="cloud-sync-resend" type="button" disabled={sending || retrySeconds > 0} onClick={() => connect(sentEmail)}>
            {sending ? <LoaderCircle className="spin" size={17}/> : <RefreshCw size={17}/>}
            {retrySeconds > 0 ? `Resend available in ${retrySeconds}s` : "Resend sign-in code"}
          </button>
          {error && <p className="cloud-sync-message" id="cloud-sync-code-error" role="alert">{error}</p>}
          <div className="cloud-sync-delivery-note">
            <Mail size={16}/><span>Confirm that Gmail shows <strong>{sentEmail}</strong> in the account menu. Check <strong>Spam</strong> and search for <strong>VitaScan</strong>. Use only the newest code.</span>
          </div>
          <button className="cloud-sync-text-button" type="button" onClick={resetRequest}>Use a different email</button>
        </> : <>
          <p id="cloud-sync-description">Use the same email on every device. We will send a secure sign-in code.</p>
          <form className="cloud-sync-form" onSubmit={(event) => { event.preventDefault(); connect(); }}>
            <label className="cloud-sync-email"><span>Email address</span><div><Mail size={17}/><input data-autofocus type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" aria-invalid={Boolean(error)} aria-describedby={error ? "cloud-sync-error" : undefined}/></div></label>
            <button className="cloud-sync-primary" type="submit" disabled={busy || !sync.configured}>{busy ? <LoaderCircle className="spin"/> : <Cloud/>} Send sign-in code</button>
            {(error || sync.message) && <p className="cloud-sync-message" id="cloud-sync-error" role={error ? "alert" : "status"}>{error || sync.message}</p>}
            <small>Local data stays on this device until you sign in. The first signed-in device becomes the initial shared VCC copy.</small>
          </form>
        </>}
      </section>
    </div>}
  </>;
}
