import { createClient } from "@supabase/supabase-js";
import type { ReceiptDraft } from "./receiptParser";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
export const vitaCloudEnabled = Boolean(url && key);
const client = vitaCloudEnabled ? createClient(url!, key!) : null;

export async function syncReceipt(draft: ReceiptDraft, transactionId: string) {
  if (!client) return { synced: false, reason: "Cloud sync is not configured" };
  const { data: sessionData } = await client.auth.getSession();
  let user = sessionData.session?.user;
  if (!user) {
    const { data, error } = await client.auth.signInAnonymously();
    if (error) throw error;
    user = data.user || undefined;
  }
  if (!user) throw new Error("Could not start a secure VitaScan session");
  const { error } = await client.from("vita_receipts").insert({
    user_id: user.id, transaction_id: transactionId, merchant: draft.merchant,
    amount: Number(draft.amount), occurred_on: draft.date, direction: draft.direction,
    account_name: draft.account, category: draft.category, reference_code: draft.reference || null,
    raw_text: draft.rawText, confidence: draft.confidence,
  });
  if (error) throw error;
  return { synced: true };
}
