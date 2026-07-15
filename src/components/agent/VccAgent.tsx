import { useMemo, useRef, useState, type FormEvent } from "react";
import { Bot, ChevronDown, ExternalLink, Send, Sparkles, X } from "lucide-react";
import { formatCurrency } from "../../lib/calculations/currency";
import type { AppData, DecisionState, FinancialState } from "../../lib/types/app";

type AgentMessage = {
  id: string;
  role: "agent" | "user";
  text: string;
  reasoning?: string;
  source?: string;
  href?: string;
  action?: string;
};

const setupPrompts = ["Help me start", "Walk me through VCC", "What data should I add first?"];
const activePrompts = ["What should I do first?", "Can I safely spend?", "Where is my biggest risk?"];

export default function VccAgent({ data, financialState, decisionState }: { data: AppData; financialState: FinancialState; decisionState: DecisionState }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFreshStart = useMemo(() => hasNoMeaningfulData(data), [data]);
  const prompts = isFreshStart ? setupPrompts : activePrompts;
  const opening = isFreshStart
    ? "Welcome to VCC. We can build your stability one small step at a time. Start with your available money, then bills, income, and debt—I’ll guide you through each one."
    : decisionState.recommendedMove;

  function toggle() {
    setOpen((current) => {
      const next = !current;
      if (next) window.setTimeout(() => inputRef.current?.focus(), 80);
      return next;
    });
  }

  function ask(question: string) {
    const clean = question.trim();
    if (!clean) return;
    const reply = buildAgentReply(clean, financialState, decisionState, isFreshStart);
    const time = Date.now();
    setMessages((current) => [
      ...current,
      { id: `user-${time}`, role: "user", text: clean },
      { ...reply, id: `agent-${time + 1}`, role: "agent" },
    ]);
    setDraft("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    ask(draft);
  }

  return (
    <aside className={`vcc-agent-widget${open ? " is-open" : ""}`} aria-label="VCC Agent">
      {open && (
        <section className="vcc-agent-popover" role="dialog" aria-modal="false" aria-label="Chat with VCC Agent">
          <header>
            <span className="vcc-agent-face" aria-hidden="true"><Bot size={20} /></span>
            <div><strong>VCC Agent</strong><small><i /> Local guidance · watching this device</small></div>
            <button type="button" onClick={toggle} aria-label="Minimize VCC Agent"><ChevronDown size={18} /></button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close VCC Agent"><X size={17} /></button>
          </header>

          <div className="vcc-agent-thread" aria-live="polite">
            <article className="vcc-agent-message agent">
              <span className="vcc-agent-mini-face"><Sparkles size={14} /></span>
              <div><p>{opening}</p>{!isFreshStart && <small>{decisionState.todayBriefing}</small>}</div>
            </article>
            {messages.map((message) => (
              <article key={message.id} className={`vcc-agent-message ${message.role}`}>
                {message.role === "agent" && <span className="vcc-agent-mini-face"><Bot size={14} /></span>}
                <div>
                  <p>{message.text}</p>
                  {message.reasoning && <details><summary>Small reason</summary><p>{message.reasoning}</p>{message.source && <small>Based on: {message.source}</small>}</details>}
                  {message.href && <a href={message.href}>{message.action || "Open this area"} <ExternalLink size={13} /></a>}
                </div>
              </article>
            ))}
          </div>

          <div className="vcc-agent-quick-actions" aria-label="Suggested questions">
            {prompts.map((prompt) => <button key={prompt} type="button" onClick={() => ask(prompt)}>{prompt}</button>)}
          </div>
          <form className="vcc-agent-input" onSubmit={submit}>
            <label htmlFor="vcc-agent-question">Ask VCC Agent</label>
            <div>
              <input ref={inputRef} id="vcc-agent-question" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask what to do next…" />
              <button type="submit" disabled={!draft.trim()} aria-label="Send question"><Send size={16} /></button>
            </div>
          </form>
          <footer>Guidance only. Review important financial decisions before acting.</footer>
        </section>
      )}

      <button
        className="vcc-agent-launcher"
        type="button"
        onClick={toggle}
        aria-label={open ? "Minimize VCC Agent" : "Open VCC Agent"}
        aria-expanded={open}
      >
        <Bot size={23} />
        {!open && <span>{isFreshStart ? "Need help starting?" : "Ask VCC"}</span>}
      </button>
    </aside>
  );
}

export function buildAgentReply(question: string, financial: FinancialState, decision: DecisionState, freshStart = false): Omit<AgentMessage, "id" | "role"> {
  const query = question.toLowerCase();
  const safe = Math.min(financial.spendableCash, financial.safeToSpend);

  if (/start|begin|zero|reset|first time/.test(query) || (freshStart && /what|help/.test(query))) {
    return {
      text: "Start with Money Snapshot. Add every checking balance and cash amount you can use today. Do not include credit as cash. When that is done, come back and I’ll take you to bills.",
      reasoning: "A reliable starting balance gives every later spending and bill recommendation a safe baseline.",
      source: "VCC setup order",
      href: "/money",
      action: "Start Money Snapshot",
    };
  }
  if (/walk|tour|through vcc|how.*work/.test(query)) {
    return {
      text: "Use VCC in this order: Money Snapshot → Bills → Income → Transactions → Debt → Savings and Goals. Inventory and Missions help with daily follow-through. You can ask me what belongs in any field.",
      reasoning: "This order establishes cash first, obligations second, then behavior and long-term stability.",
      source: "VCC workflow",
      href: "/money",
      action: "Begin the walkthrough",
    };
  }
  if (/data|input|enter|add|field/.test(query)) {
    return {
      text: "Add only what you can verify. Begin with current cash balances, then each bill’s amount and due date, your income, and recent transactions. Estimates are okay if you label them in Notes.",
      reasoning: "Small verified inputs produce safer guidance than filling every section with guesses.",
      source: "VCC data-quality rules",
      href: "/money",
      action: "Enter the first balance",
    };
  }
  if (/stability|stable|overwhelm|stress|control/.test(query)) {
    return {
      text: financial.overdueBills > 0 ? "Stability starts by stopping new damage: list and address overdue bills before optional spending." : "Stability starts with a clear floor: protect bill money, avoid new fixed costs, and make one small update in VCC each day.",
      reasoning: decision.todayBriefing,
      source: "Current cash and obligation signals",
      href: financial.overdueBills > 0 ? "/bills" : "/missions",
      action: "Take the next stability step",
    };
  }
  if (/spend|buy|afford|safe/.test(query)) {
    const hold = financial.overdueBills > 0 || financial.billsPressure > safe * 0.5 || financial.borrowedMoney > 0;
    return {
      text: hold ? "Hold non-essential spending today." : `Your current Spendable / Safe amount is ${formatCurrency(safe)}. Stay below it and avoid adding fixed costs.`,
      reasoning: `${formatCurrency(financial.billsPressure)} is reserved for bills and ${formatCurrency(financial.borrowedMoney)} is borrowed money.`,
      source: "Money Snapshot and bills",
      href: "/money",
      action: "Review safe spending",
    };
  }
  if (/risk|problem|flaw|pressure/.test(query)) {
    const risk = financial.overdueBills > 0
      ? `${financial.overdueBills} overdue bill${financial.overdueBills === 1 ? " is" : "s are"} the biggest immediate risk.`
      : financial.borrowedMoney > 0
        ? `${formatCurrency(financial.borrowedMoney)} in borrowed money is the biggest cash-flow risk.`
        : "No urgent exception is visible in the current records.";
    return { text: risk, reasoning: decision.todayBriefing, source: "Bills and Money Snapshot", href: decision.todayMission.href, action: "Review the risk" };
  }
  if (/pattern|behavior|habit|trend/.test(query)) {
    const top = financial.categorySummary[0];
    return { text: top ? `${top.label} is the strongest recorded spending pattern at ${formatCurrency(top.amount)}.` : "Add several dated transactions before I call a behavior pattern reliable.", reasoning: "I describe recorded spending behavior without guessing motive or personality.", source: "Categorized transactions", href: "/transactions", action: "Review transactions" };
  }
  if (/debt|payoff|loan|credit/.test(query)) {
    return { text: financial.totalDebt > 0 ? `Keep minimums current, then focus on ${financial.nextPayoff}.` : "No active debt is recorded yet.", reasoning: `Recorded debt is ${formatCurrency(financial.totalDebt)} with ${formatCurrency(financial.minimumPayments)} in minimums.`, source: "Debt records", href: "/debt", action: "Open debt" };
  }
  if (/goal|save|saving|emergency/.test(query)) {
    return { text: financial.closestGoal !== "None" ? `The closest goal is ${financial.closestGoal}. Protect essentials first, then direct surplus there.` : "Add one goal with a target and current amount. I’ll help break it into manageable steps.", reasoning: `Current goal progress is ${financial.goalCompletionPercent.toFixed(0)}%.`, source: "Savings and goals", href: "/goals", action: "Open goals" };
  }
  return { text: freshStart ? "We’ll keep it simple. Add your current available money first, and ask me about any field you are unsure about." : decision.recommendedMove, reasoning: decision.todayBriefing, source: "VCC Decision Engine", href: freshStart ? "/money" : decision.todayMission.href, action: "Take the next step" };
}

function hasNoMeaningfulData(data: AppData): boolean {
  const hasRows = Object.values(data.sections).some((rows) => rows.some((row) => Object.values(row.cells).some((value) => String(value || "").trim())));
  const planner = data.paycheckPlanner;
  return !hasRows && !planner.locked && !planner.paycheckAmount && data.paycheckHistory.length === 0;
}
