import { formatReceiptArchive, type ReceiptDraft } from "./receiptParser";
import { cloudConfigured, supabase } from "../cloud/client";

export const vitaCloudEnabled = cloudConfigured;

export async function syncReceipt(draft: ReceiptDraft, transactionId: string) {
  if (!supabase) return { synced: false, reason: "Cloud sync is not configured" };
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user || user.is_anonymous) return { synced: false, reason: "Sign in to sync this receipt across devices" };
  const { error } = await supabase.from("vita_receipts").upsert({
    user_id: user.id, transaction_id: transactionId, merchant: draft.merchant,
    amount: Number(draft.amount), occurred_on: draft.date, direction: draft.direction,
    account_name: draft.account, category: draft.category, reference_code: draft.reference || null,
    raw_text: formatReceiptArchive(draft), confidence: draft.confidence,
  }, { onConflict: "user_id,transaction_id" });
  if (error) throw error;
  return { synced: true };
}
