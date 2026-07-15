import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

const welcomeKey = "vcc-os-welcome-seen";

export default function WelcomeTransition({ accountName }: { accountName: string }) {
  const [visible, setVisible] = useState(() => sessionStorage.getItem(welcomeKey) !== "true");
  const firstName = accountName.trim().split(/\s+/)[0] || "there";

  useEffect(() => {
    if (!visible) return;
    sessionStorage.setItem(welcomeKey, "true");
    const timer = window.setTimeout(() => setVisible(false), 760);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="welcome-transition" role="status" aria-live="polite" aria-label={`Welcome to VCC-OS, ${firstName}`}>
      <div className="welcome-transition-content">
        <span className="welcome-transition-mark" aria-hidden="true"><Zap size={25} /></span>
        <p>{timeGreeting()}</p>
        <strong className="welcome-transition-name">{firstName}</strong>
        <small>Preparing your command center</small>
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
