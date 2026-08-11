import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Bot, ChevronDown, ExternalLink, Send, Sparkles, X } from "lucide-react";
import { formatCurrency } from "../../lib/calculations/currency";
import type { AppData, DecisionState, FinancialState, VccCompanionId } from "../../lib/types/app";

type AgentMessage = {
  id: string;
  role: "agent" | "user";
  text: string;
  reasoning?: string;
  source?: string;
  href?: string;
  action?: string;
  companionId?: VccCompanionId;
};

export type VccCompanion = {
  id: VccCompanionId;
  name: string;
  species: string;
  emoji: string;
  specialty: string;
  nuance: string;
  intro: string;
  prompts: string[];
};

export const VCC_COMPANIONS: VccCompanion[] = [
  { id: "scout", name: "Scout", species: "Border Collie", emoji: "🐕", specialty: "Plans & next actions", nuance: "Direct, loyal, and focused on the most useful next move.", intro: "Scout here. I keep the plan moving and turn financial pressure into a clear next action.", prompts: ["Give me my next move", "Build today's routine", "What needs attention first?"] },
  { id: "penny", name: "Penny", species: "Calico Cat", emoji: "🐈", specialty: "Patterns & reality checks", nuance: "Observant, skeptical, and quick to question a shaky assumption.", intro: "Penny checking in. I watch the patterns, question the fuzzy numbers, and tell you what does not add up.", prompts: ["What looks off?", "Find a spending pattern", "Challenge this purchase"] },
  { id: "clover", name: "Clover", species: "Mini Lop", emoji: "🐇", specialty: "Calm & small steps", nuance: "Gentle, grounding, and careful not to turn a hard day into a lecture.", intro: "Clover here. We can make this lighter by choosing one safe, manageable step at a time.", prompts: ["Give me one small step", "Help me feel less overwhelmed", "What can wait?"] },
  { id: "pico", name: "Pico", species: "Cockatiel", emoji: "🦜", specialty: "Check-ins & momentum", nuance: "Bright, encouraging, and tuned to progress worth repeating.", intro: "Pico reporting in. I keep the signal short, notice your wins, and help you follow through.", prompts: ["Recap my progress", "What should I check today?", "Keep me accountable"] },
];

type ConversationStep = "idle" | "priority" | "pressure" | "style" | "complete";
type UserContext = { priority?: string; pressure?: string; style?: string };
type PetPosition = { x: number; y: number };
const contextKey = "vcc.agent.context.v1";
const positionKey = "vcc.agent.position.v1";

const setupPrompts = ["Help me start", "Walk me through VCC", "What data should I add first?"];
const activePrompts = ["What should I do first?", "Can I safely spend?", "Where is my biggest risk?"];

export default function VccAgent({ data, financialState, decisionState, petEnabled = false, companionId = "scout", onCompanionChange }: { data: AppData; financialState: FinancialState; decisionState: DecisionState; petEnabled?: boolean; companionId?: VccCompanionId; onCompanionChange?: (companionId: VccCompanionId) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [conversationStep, setConversationStep] = useState<ConversationStep>("idle");
  const [userContext, setUserContext] = useState<UserContext>(() => loadUserContext());
  const [petPosition, setPetPosition] = useState<PetPosition | null>(() => loadPetPosition());
  const [dragging, setDragging] = useState(false);
  const [ambientNudge, setAmbientNudge] = useState<string | null>(null);
  const [nudgeMuted, setNudgeMuted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const isFreshStart = useMemo(() => hasNoMeaningfulData(data), [data]);
  const companion = VCC_COMPANIONS.find((candidate) => candidate.id === companionId) || VCC_COMPANIONS[0];
  const prompts = petEnabled ? companion.prompts : isFreshStart ? setupPrompts : activePrompts;
  const opening = isFreshStart
    ? "Welcome to VCC. We can build your stability one small step at a time. Start with your available money, then bills, income, and debt—I’ll guide you through each one."
    : decisionState.recommendedMove;
  const displayOpening = petEnabled ? `${companion.intro} ${opening}` : opening;

  useEffect(() => {
    if (!petEnabled || open || nudgeMuted) return;
    const timer = window.setTimeout(() => {
      setAmbientNudge(buildAmbientNudge(companion, financialState, decisionState));
    }, 45_000);
    return () => window.clearTimeout(timer);
  }, [companion, decisionState, financialState, nudgeMuted, open, petEnabled]);

  useEffect(() => {
    if (!petPosition) return;
    function keepPetOnScreen() {
      setPetPosition((current) => current ? clampPetPosition(current.x, current.y) : null);
    }
    window.addEventListener("resize", keepPetOnScreen);
    return () => window.removeEventListener("resize", keepPetOnScreen);
  }, [petPosition]);

  function toggle() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setAmbientNudge(null);
    setOpen((current) => {
      const next = !current;
      if (next) window.setTimeout(() => inputRef.current?.focus(), 80);
      return next;
    });
  }

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!petEnabled || event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: rect.left, originY: rect.top, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function movePet(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    event.preventDefault();
    setPetPosition(clampPetPosition(drag.originX + dx, drag.originY + dy));
  }

  function finishDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    setDragging(false);
    if (!drag.moved) return;
    suppressClickRef.current = true;
    const next = clampPetPosition(drag.originX + event.clientX - drag.startX, drag.originY + event.clientY - drag.startY);
    setPetPosition(next);
    savePetPosition(next);
  }

  function resetPetPosition() {
    window.localStorage.removeItem(positionKey);
    setPetPosition(null);
  }

  function openFromNudge() {
    setAmbientNudge(null);
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 80);
  }

  function ask(question: string) {
    const clean = question.trim();
    if (!clean) return;
    const guided = continueConversation(clean, conversationStep, userContext);
    const baseReply = guided?.reply
      || (petEnabled ? buildCompanionSpecialtyReply(clean, companion, data, financialState, decisionState) : null)
      || buildAgentReply(clean, financialState, decisionState, isFreshStart, userContext);
    const reply = petEnabled ? applyCompanionVoice(baseReply, companion) : baseReply;
    if (guided) {
      setConversationStep(guided.nextStep);
      setUserContext(guided.context);
      saveUserContext(guided.context);
    }
    const time = Date.now();
    setMessages((current) => [
      ...current,
      { id: `user-${time}`, role: "user", text: clean },
      { ...reply, id: `agent-${time + 1}`, role: "agent", companionId: petEnabled ? companion.id : undefined },
    ]);
    setDraft("");
  }

  function startConversation() {
    const time = Date.now();
    setConversationStep("priority");
    setMessages((current) => [...current, {
      id: `agent-${time}`,
      role: "agent",
      companionId: petEnabled ? companion.id : undefined,
      text: "I’d like to understand what stability means for you. What matters most right now: getting bills under control, reducing debt, building savings, or simply understanding where your money goes?",
    }]);
    window.setTimeout(() => inputRef.current?.focus(), 60);
  }

  function forgetContext() {
    window.localStorage.removeItem(contextKey);
    setUserContext({});
    setConversationStep("idle");
    setMessages((current) => [...current, { id: `agent-${Date.now()}`, role: "agent", text: "I’ve cleared what I learned from this conversation. We can start fresh whenever you’re ready." }]);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    ask(draft);
  }

  function selectCompanion(nextId: VccCompanionId) {
    if (nextId === companion.id) return;
    const nextCompanion = VCC_COMPANIONS.find((candidate) => candidate.id === nextId);
    if (!nextCompanion) return;
    onCompanionChange?.(nextId);
    setMessages((current) => [...current, {
      id: `agent-${Date.now()}`,
      role: "agent",
      text: nextCompanion.intro,
      companionId: nextCompanion.id,
    }]);
    window.setTimeout(() => inputRef.current?.focus(), 60);
  }

  return (
    <aside
      className={`vcc-agent-widget${open ? " is-open" : ""}${petEnabled ? " pet-enabled" : ""}${dragging ? " is-dragging" : ""}`}
      aria-label="VCC Agent"
      style={petPosition ? { left: petPosition.x, top: petPosition.y, right: "auto", bottom: "auto" } as CSSProperties : undefined}
    >
      {open && (
        <section className="vcc-agent-popover" role="dialog" aria-modal="false" aria-label="Chat with VCC Agent">
          <header>
            <span className="vcc-agent-face" aria-hidden="true">{petEnabled ? <CompanionArt companionId={companion.id} variant="header" /> : <Bot size={20} />}</span>
            <div><strong>{petEnabled ? companion.name : "VCC Agent"}</strong><small><i /> {petEnabled ? `${companion.species} · ${companion.specialty}` : "Local guidance · watching this device"}</small></div>
            <button type="button" onClick={toggle} aria-label="Minimize VCC Agent"><ChevronDown size={18} /></button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close VCC Agent"><X size={17} /></button>
          </header>

          {petEnabled && (
            <div className="vcc-companion-tabs" role="tablist" aria-label="AI companion">
              {VCC_COMPANIONS.map((candidate) => (
                <button key={candidate.id} type="button" role="tab" aria-selected={candidate.id === companion.id} title={`${candidate.species}: ${candidate.nuance}`} onClick={() => selectCompanion(candidate.id)}>
                  <CompanionArt companionId={candidate.id} variant="tab" />
                  <small>{candidate.name}</small>
                </button>
              ))}
            </div>
          )}

          <div className="vcc-agent-thread" aria-live="polite">
            <article className="vcc-agent-message agent">
              <span className="vcc-agent-mini-face">{petEnabled ? <CompanionArt companionId={companion.id} variant="message" /> : <Sparkles size={14} />}</span>
              <div><p>{displayOpening}</p>{!isFreshStart && <small>{decisionState.todayBriefing}</small>}</div>
            </article>
            {messages.map((message) => (
              <article key={message.id} className={`vcc-agent-message ${message.role}`}>
                {message.role === "agent" && <span className="vcc-agent-mini-face" aria-hidden="true">{petEnabled ? <CompanionArt companionId={message.companionId || companion.id} variant="message" /> : <Bot size={14} />}</span>}
                <div>
                  <p>{message.text}</p>
                  {message.reasoning && <details><summary>Small reason</summary><p>{message.reasoning}</p>{message.source && <small>Based on: {message.source}</small>}</details>}
                  {message.href && <a href={message.href}>{message.action || "Open this area"} <ExternalLink size={13} /></a>}
                </div>
              </article>
            ))}
          </div>

          <div className="vcc-agent-quick-actions" aria-label="Suggested questions">
            <button type="button" onClick={startConversation}>{Object.keys(userContext).length ? "Update what you know" : "Get to know me"}</button>
            {prompts.map((prompt) => <button key={prompt} type="button" onClick={() => ask(prompt)}>{prompt}</button>)}
          </div>
          <form className="vcc-agent-input" onSubmit={submit}>
            <label htmlFor="vcc-agent-question">Ask VCC Agent</label>
            <div>
              <input ref={inputRef} id="vcc-agent-question" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask what to do next…" />
              <button type="submit" disabled={!draft.trim()} aria-label="Send question"><Send size={16} /></button>
            </div>
          </form>
          <footer>
            <span>Guidance only. Review important financial decisions before acting.</span>
            {petEnabled && petPosition && <button type="button" onClick={resetPetPosition}>Reset companion position</button>}
            {Object.keys(userContext).length > 0 && <button type="button" onClick={forgetContext}>Forget what you learned</button>}
          </footer>
        </section>
      )}

      {petEnabled && ambientNudge && !open && (
        <div className={`vcc-agent-nudge${(!petPosition && window.innerWidth <= 1024) || (petPosition && petPosition.y < window.innerHeight / 2) ? " is-below" : ""}${petPosition && petPosition.x < 300 ? " is-left" : ""}`} role="status" aria-live="polite">
          <CompanionArt companionId={companion.id} variant="nudge" />
          <div><strong>{companion.name} noticed something</strong><span>{ambientNudge}</span><button type="button" onClick={openFromNudge}>Ask {companion.name}</button></div>
          <button type="button" className="vcc-agent-nudge-dismiss" onClick={() => { setAmbientNudge(null); setNudgeMuted(true); }} aria-label={`Dismiss ${companion.name}'s suggestion`}><X size={14} /></button>
        </div>
      )}

      <button
        className="vcc-agent-launcher"
        type="button"
        onClick={toggle}
        onPointerDown={startDrag}
        onPointerMove={movePet}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        aria-label={open ? "Minimize VCC Agent" : "Open VCC Agent"}
        aria-expanded={open}
        title={petEnabled ? `Drag ${companion.name} to move · Click to chat` : undefined}
      >
        {petEnabled ? <CompanionArt companionId={companion.id} variant="launcher" /> : <Bot size={23} />}
        {!open && <Sparkles className="vcc-agent-launcher-spark" size={12} aria-hidden="true" />}
      </button>
    </aside>
  );
}

export function CompanionArt({ companionId, variant = "message" }: { companionId: VccCompanionId; variant?: "launcher" | "header" | "tab" | "message" | "settings" | "nudge" }) {
  return <span className={`vcc-companion-art art-${companionId} is-${variant}`} aria-hidden="true" />;
}

export function buildAmbientNudge(companion: VccCompanion, financial: FinancialState, decision: DecisionState): string {
  const lead = { scout: "Your next move:", penny: "A quick reality check:", clover: "One calm step:", pico: "Quick progress check:" }[companion.id];
  if (financial.overdueBills > 0) return `${lead} ${financial.overdueBills} overdue bill${financial.overdueBills === 1 ? " needs" : "s need"} attention.`;
  if (financial.borrowedMoney > 0) return `${lead} keep ${formatCurrency(financial.borrowedMoney)} in borrowed money visible before spending.`;
  if (financial.billsDueThisWeek > 0) return `${lead} ${financial.billsDueThisWeek} bill${financial.billsDueThisWeek === 1 ? " is" : "s are"} due this week.`;
  return `${lead} ${decision.todayMission.title}.`;
}

function loadPetPosition(): PetPosition | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(positionKey) || "null") as Partial<PetPosition> | null;
    return saved && Number.isFinite(saved.x) && Number.isFinite(saved.y) ? clampPetPosition(Number(saved.x), Number(saved.y)) : null;
  } catch {
    return null;
  }
}

function savePetPosition(position: PetPosition) {
  window.localStorage.setItem(positionKey, JSON.stringify(position));
}

function clampPetPosition(x: number, y: number): PetPosition {
  const size = window.innerWidth >= 1024 ? 48 : 36;
  const margin = 8;
  return {
    x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - size - margin)),
    y: Math.min(Math.max(margin, y), Math.max(margin, window.innerHeight - size - margin)),
  };
}

function applyCompanionVoice(reply: Omit<AgentMessage, "id" | "role">, companion: VccCompanion): Omit<AgentMessage, "id" | "role"> {
  const lead = {
    scout: "Next move:",
    penny: "Reality check:",
    clover: "One gentle step:",
    pico: "Quick signal:",
  }[companion.id];
  return { ...reply, text: `${lead} ${reply.text}` };
}

function buildCompanionSpecialtyReply(question: string, companion: VccCompanion, data: AppData, financial: FinancialState, decision: DecisionState): Omit<AgentMessage, "id" | "role"> | null {
  const query = question.toLowerCase();
  if (companion.id === "scout" && /next move|routine|attention first/.test(query)) {
    return { text: decision.recommendedMove, reasoning: decision.todayBriefing, source: "VCC Decision Engine", href: decision.todayMission.href, action: "Take Scout's next step" };
  }
  if (companion.id === "penny" && /looks off|pattern|challenge this purchase/.test(query)) {
    const top = financial.categorySummary[0];
    const safe = Math.min(financial.spendableCash, financial.safeToSpend);
    const purchaseWarning = financial.overdueBills > 0 || financial.borrowedMoney > 0 || financial.billsPressure > safe * 0.5;
    if (/purchase/.test(query)) {
      return { text: purchaseWarning ? "Pause the purchase until overdue bills, borrowed money, and protected cash are clear." : `The purchase only passes the first check if it keeps total optional spending below ${formatCurrency(safe)}.`, reasoning: decision.todayBriefing, source: "Current cash, bills, and borrowed-money signals", href: "/money", action: "Check the numbers" };
    }
    return top
      ? { text: `${top.label} is the strongest recorded spending pattern at ${formatCurrency(top.amount)}. Check the underlying transactions before assuming it is normal.`, reasoning: "A category total is a signal, not proof of motive or waste.", source: "Categorized transactions", href: "/transactions", action: "Inspect the pattern" }
      : { text: "There are not enough categorized transactions to call a pattern reliable yet.", source: "Transaction history", href: "/transactions", action: "Add or categorize transactions" };
  }
  if (companion.id === "clover" && /small step|overwhelm|what can wait/.test(query)) {
    if (/what can wait/.test(query)) return { text: "Optional purchases and extra payoff can wait until immediate bills and usable cash are clear.", reasoning: decision.todayBriefing, source: "Current priority order", href: "/bills", action: "Review immediate bills" };
    return { text: financial.overdueBills > 0 ? "Open Bills and handle only the first overdue item. You do not need to solve the whole list today." : "Open today's mission and complete only its first action.", reasoning: decision.todayBriefing, source: "VCC priority stack", href: financial.overdueBills > 0 ? "/bills" : decision.todayMission.href, action: "Take one small step" };
  }
  if (companion.id === "pico" && /recap|check today|accountable|progress/.test(query)) {
    const latest = data.activity[0];
    const progress = latest ? `Your latest recorded win is “${latest.title}.” ` : "No completed mission is recorded yet. ";
    return { text: `${progress}Today's follow-through target is ${decision.todayMission.title}.`, reasoning: decision.todayBriefing, source: "Activity and today's mission", href: decision.todayMission.href, action: "Keep the streak moving" };
  }
  return null;
}

export function buildAgentReply(question: string, financial: FinancialState, decision: DecisionState, freshStart = false, context: UserContext = {}): Omit<AgentMessage, "id" | "role"> {
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
  const personalLead = context.priority ? `Since your priority is ${context.priority}, ` : "";
  const followUp = context.style === "step-by-step"
    ? " Would you like me to give you only the first step?"
    : " What part of that feels hardest right now?";
  return { text: freshStart ? "We’ll keep it simple. Add your current available money first, and ask me about any field you are unsure about." : `${personalLead}${decision.recommendedMove.toLowerCase()}${followUp}`, reasoning: decision.todayBriefing, source: "VCC Decision Engine and your stated priorities", href: freshStart ? "/money" : decision.todayMission.href, action: "Take the next step" };
}

function continueConversation(answer: string, step: ConversationStep, current: UserContext): { reply: Omit<AgentMessage, "id" | "role">; nextStep: ConversationStep; context: UserContext } | null {
  if (step === "idle" || step === "complete") return null;
  if (step === "priority") {
    const context = { ...current, priority: answer };
    return { context, nextStep: "pressure", reply: { text: `Got it—${answer} is the priority. What creates the most pressure today: not enough income, bills arriving too close together, impulse spending, debt, or uncertainty about the numbers?` } };
  }
  if (step === "pressure") {
    const context = { ...current, pressure: answer };
    return { context, nextStep: "style", reply: { text: "That helps me understand the pressure behind the numbers. How should I guide you: one step at a time, a short answer with optional reasoning, or a complete plan?" } };
  }
  const style = normalizeGuidanceStyle(answer);
  const context = { ...current, style };
  return {
    context,
    nextStep: "complete",
    reply: {
      text: `Understood. I’ll prioritize ${context.priority || "stability"}, watch for ${context.pressure || "financial pressure"}, and respond in a ${style} way. You can change this anytime. What decision are you facing today?`,
      reasoning: "Your answers stay in this browser and are used only to tailor VCC guidance.",
      source: "What you told VCC Agent",
    },
  };
}

function normalizeGuidanceStyle(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes("step") || lower.includes("one")) return "step-by-step";
  if (lower.includes("complete") || lower.includes("plan") || lower.includes("detail")) return "complete-plan";
  return "concise-with-reasoning";
}

function loadUserContext(): UserContext {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(contextKey) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveUserContext(context: UserContext) {
  window.localStorage.setItem(contextKey, JSON.stringify(context));
}

function hasNoMeaningfulData(data: AppData): boolean {
  const hasRows = Object.values(data.sections).some((rows) => rows.some((row) => Object.values(row.cells).some((value) => String(value || "").trim())));
  const planner = data.paycheckPlanner;
  return !hasRows && !planner.locked && !planner.paycheckAmount && data.paycheckHistory.length === 0;
}
