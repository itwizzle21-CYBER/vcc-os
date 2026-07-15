import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Bot, CheckCircle2, CircleAlert, Send, ShieldCheck, Sparkles } from "lucide-react";
import { formatCurrency } from "../../lib/calculations/currency";
import type { DecisionState, FinancialState } from "../../lib/types/app";

type AgentMessage = {
  id: string;
  role: "agent" | "user";
  text: string;
  reasoning?: string;
  source?: string;
  confidence?: "High" | "Medium";
  href?: string;
};

const suggestedPrompts = [
  "What should I do first?",
  "Can I safely spend today?",
  "Where is my biggest risk?",
  "What pattern do you see?",
];

export default function VccAgent({ financialState, decisionState }: { financialState: FinancialState; decisionState: DecisionState }) {
  const [draft, setDraft] = useState("");
  const opening = useMemo<AgentMessage>(() => ({
    id: "opening",
    role: "agent",
    text: decisionState.recommendedMove,
    reasoning: decisionState.todayBriefing,
    source: "Money, bills, transactions, debt, goals, and inventory",
    confidence: "High",
    href: decisionState.todayMission.href,
  }), [decisionState]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);

  function ask(question: string) {
    const clean = question.trim();
    if (!clean) return;
    const reply = buildAgentReply(clean, financialState, decisionState);
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text: clean },
      { ...reply, id: `agent-${Date.now() + 1}`, role: "agent" },
    ]);
    setDraft("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    ask(draft);
  }

  const safe = Math.min(financialState.spendableCash, financialState.safeToSpend);
  const riskCount = financialState.overdueBills + financialState.criticalItems + (financialState.borrowedMoney > 0 ? 1 : 0);

  return (
    <div className="agent-page">
      <section className="agent-hero">
        <div>
          <p className="eyebrow"><Sparkles size={14} /> VCC Intelligence</p>
          <h2>Ask less. Decide better.</h2>
          <p>Your VCC Agent monitors the financial picture already stored in this device and turns it into one clear next move.</p>
        </div>
        <div className="agent-status" aria-label="Agent status">
          <span><span className="agent-live-dot" /> Monitoring this device</span>
          <small>Private local analysis · No external AI connection</small>
        </div>
      </section>

      <section className="agent-signal-grid" aria-label="Current decision signals">
        <article><small>Spendable / Safe</small><strong>{formatCurrency(safe)}</strong><span>After known pressure</span></article>
        <article><small>Immediate Risks</small><strong>{riskCount}</strong><span>Across bills, borrowing, inventory</span></article>
        <article><small>Today’s Priority</small><strong>{decisionState.todayMission.priority}</strong><span>{decisionState.todayMission.title}</span></article>
      </section>

      <div className="agent-layout">
        <section className="agent-chat-panel" aria-label="Conversation with VCC Agent">
          <div className="agent-chat-heading">
            <span><Bot size={20} /></span>
            <div><strong>VCC Agent</strong><small>Decision support, not automatic control</small></div>
          </div>
          <div className="agent-messages" aria-live="polite">
            {[opening, ...messages].map((message) => (
              <article key={message.id} className={`agent-message ${message.role}`}>
                {message.role === "agent" && <span className="agent-avatar"><Bot size={16} /></span>}
                <div>
                  <p>{message.text}</p>
                  {message.reasoning && (
                    <details>
                      <summary>Why this recommendation</summary>
                      <p>{message.reasoning}</p>
                      <small><ShieldCheck size={13} /> Source: {message.source} · {message.confidence} confidence</small>
                    </details>
                  )}
                  {message.href && <a href={message.href}>Review supporting data <ArrowRight size={14} /></a>}
                </div>
              </article>
            ))}
          </div>

          <div className="agent-suggestions">
            {suggestedPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => ask(prompt)}>{prompt}</button>)}
          </div>
          <form className="agent-composer" onSubmit={submit}>
            <label htmlFor="agent-question">Ask about your current VCC data</label>
            <div>
              <input id="agent-question" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Example: What should I focus on this week?" />
              <button type="submit" aria-label="Send question" disabled={!draft.trim()}><Send size={17} /></button>
            </div>
          </form>
        </section>

        <aside className="agent-brief-panel">
          <p className="eyebrow">Decision Brief</p>
          <h3>{decisionState.todayMission.title}</h3>
          <p>{decisionState.todayMission.detail}</p>
          <a href={decisionState.todayMission.href}>Open action area <ArrowRight size={15} /></a>
          <div className="agent-alert-list">
            {decisionState.priorityAlerts.map((alert) => (
              <div key={alert.title}>
                {alert.tone === "success" ? <CheckCircle2 size={17} /> : <CircleAlert size={17} />}
                <span><strong>{alert.title}</strong><small>{alert.detail}</small></span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function buildAgentReply(question: string, financial: FinancialState, decision: DecisionState): Omit<AgentMessage, "id" | "role"> {
  const query = question.toLowerCase();
  const safe = Math.min(financial.spendableCash, financial.safeToSpend);
  const base = { confidence: "High" as const };

  if (/spend|buy|afford|safe/.test(query)) {
    const hold = financial.overdueBills > 0 || financial.billsPressure > safe * 0.5 || financial.borrowedMoney > 0;
    return {
      ...base,
      text: hold ? "Hold non-essential spending today." : `Your current Spendable / Safe amount is ${formatCurrency(safe)}. Keep new purchases below that ceiling and avoid adding fixed costs.`,
      reasoning: `${formatCurrency(financial.billsPressure)} is reserved for near-term bills and ${formatCurrency(financial.borrowedMoney)} is borrowed money. The remaining safe amount is ${formatCurrency(safe)}.`,
      source: "Money Snapshot, bills, and borrowed-money rows",
      href: "/money",
    };
  }
  if (/risk|wrong|flaw|problem|pressure/.test(query)) {
    const risk = financial.overdueBills > 0
      ? `${financial.overdueBills} overdue bill${financial.overdueBills === 1 ? " is" : "s are"} the largest immediate risk.`
      : financial.borrowedMoney > 0
        ? `${formatCurrency(financial.borrowedMoney)} in borrowed money is the largest cash-flow risk.`
        : financial.criticalItems > 0
          ? `${financial.criticalItems} critical inventory item${financial.criticalItems === 1 ? " needs" : "s need"} attention.`
          : "No urgent exception is visible in the current records.";
    return { ...base, text: risk, reasoning: decision.todayBriefing, source: "Bills, money, and inventory exception checks", href: decision.todayMission.href };
  }
  if (/pattern|behavior|habit|trend/.test(query)) {
    const top = financial.categorySummary[0];
    return {
      confidence: top ? "High" : "Medium",
      text: top ? `${top.label} is currently the strongest spending pattern at ${formatCurrency(top.amount)}.` : "There is not enough categorized transaction history to identify a reliable behavior pattern yet.",
      reasoning: top ? `VCC grouped recorded expenses by category and ranked them by total amount. This describes recorded behavior; it does not infer motive or personality.` : "Pattern detection needs multiple dated, categorized transactions.",
      source: "Categorized transaction history",
      href: "/transactions",
    };
  }
  if (/debt|payoff|loan|credit/.test(query)) {
    return { ...base, text: financial.totalDebt > 0 ? `Keep minimums current, then focus on ${financial.nextPayoff}.` : "No active debt balance is recorded.", reasoning: `Recorded debt is ${formatCurrency(financial.totalDebt)} with ${formatCurrency(financial.minimumPayments)} in minimum payments.`, source: "Debt records", href: "/debt" };
  }
  if (/goal|save|saving|emergency/.test(query)) {
    return { ...base, text: financial.closestGoal !== "None" ? `The closest recorded goal is ${financial.closestGoal}. Protect essentials first, then direct surplus there.` : "Add a target and current balance before VCC recommends a savings allocation.", reasoning: `Goal progress is ${financial.goalCompletionPercent.toFixed(0)}% and the emergency fund is ${formatCurrency(financial.emergencyFund)}.`, source: "Savings and goals", href: "/goals" };
  }
  return { ...base, text: decision.recommendedMove, reasoning: decision.todayBriefing, source: "VCC Decision Engine across current records", href: decision.todayMission.href };
}
