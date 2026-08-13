import type { VccCompanionId } from "../../lib/types/app";

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

export function CompanionArt({ companionId, variant = "message" }: { companionId: VccCompanionId; variant?: "launcher" | "header" | "tab" | "message" | "settings" | "nudge" }) {
  return <span className={`vcc-companion-art art-${companionId} is-${variant}`} aria-hidden="true" />;
}
