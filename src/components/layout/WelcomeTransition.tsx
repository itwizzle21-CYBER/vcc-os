import { useEffect, useState, type CSSProperties } from "react";
import { Zap } from "lucide-react";
import type { UserSettings } from "../../lib/types/app";

const welcomeKey = "vcc-os-welcome-seen";

export default function WelcomeTransition({ settings, preview = false }: { settings: UserSettings; preview?: boolean }) {
  const [visible, setVisible] = useState(() => preview || sessionStorage.getItem(welcomeKey) !== "true");
  const firstName = settings.accountName.trim().split(/\s+/)[0] || "there";
  const durationSeconds = Math.min(5, Math.max(1, settings.welcomeDurationSeconds || 4));
  const durationMs = durationSeconds * 1000;
  const headline = settings.welcomeHeadline.trim() || timeGreeting();
  const message = settings.welcomeMessage.trim() || "Preparing your command center";

  useEffect(() => {
    if (!visible) return;
    if (!preview) sessionStorage.setItem(welcomeKey, "true");
    const timer = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, preview, visible]);

  if (!visible) return null;

  return (
    <div
      className={`welcome-transition welcome-transition-${settings.welcomeTransition || "rise"}`}
      style={{ "--welcome-duration": `${durationMs}ms` } as CSSProperties}
      role="status"
      aria-live="polite"
      aria-label={`Welcome to VCC-OS, ${firstName}`}
    >
      <div className="welcome-transition-content">
        <span className="welcome-transition-mark" aria-hidden="true"><Zap size={25} /></span>
        <p>{headline}</p>
        <strong className="welcome-transition-name">{firstName}</strong>
        <small>{message}</small>
      </div>
      <button type="button" onClick={() => setVisible(false)}>Skip intro</button>
    </div>
  );
}

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
