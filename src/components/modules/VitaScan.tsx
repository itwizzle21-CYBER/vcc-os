import { useMemo, useState } from "react";
import { ArrowUpRight, Camera, CheckCircle2, Cloud, FileImage, LoaderCircle, RotateCcw, ScanLine, ShieldCheck } from "lucide-react";
import type { AppData } from "../../lib/types/app";
import { parseReceiptText, type ReceiptDraft } from "../../lib/vitascan/receiptParser";
import { syncReceipt, vitaCloudEnabled } from "../../lib/vitascan/cloud";
import "./vitascan.css";
import "./vitascan-app.css";

const emptyDraft = parseReceiptText("");

export default function VitaScan({ data, onChange }: { data: AppData; onChange: (data: AppData) => void }) {
  const [preview, setPreview] = useState("");
  const [draft, setDraft] = useState<ReceiptDraft>(emptyDraft);
  const [status, setStatus] = useState<"idle" | "scanning" | "review" | "saved">("idle");
  const [message, setMessage] = useState("");
  const recent = useMemo(() => data.sections.transactions.filter((r) => r.cells.notes?.includes("VitaScan")).slice(-5).reverse(), [data]);

  async function scan(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage("Choose a screenshot or photo."); return; }
    setPreview(URL.createObjectURL(file)); setStatus("scanning"); setMessage("Reading payment details on this device…");
    try {
      const { recognize } = await import("tesseract.js");
      const result = await recognize(file, "eng");
      setDraft(parseReceiptText(result.data.text)); setStatus("review"); setMessage("Review the details before adding them to VCC.");
    } catch { setStatus("review"); setMessage("OCR could not read this image. Enter the details below."); }
  }

  function update<K extends keyof ReceiptDraft>(key: K, value: ReceiptDraft[K]) { setDraft((current) => ({ ...current, [key]: value })); }

  async function save() {
    const amount = Number(draft.amount);
    if (!draft.merchant.trim() || !Number.isFinite(amount) || amount <= 0) { setMessage("Merchant and a valid amount are required."); return; }
    const id = `vitascan-${crypto.randomUUID()}`;
    const signed = draft.direction === "expense" ? -amount : amount;
    const row = { id, cells: { description: draft.merchant, type: draft.direction, category: draft.category, amount: signed.toFixed(2), date: draft.date, account: draft.account, recurring: "No", notes: `VitaScan${draft.reference ? ` · Ref ${draft.reference}` : ""}` } };
    onChange({ ...data, sections: { ...data.sections, transactions: [...data.sections.transactions, row] } });
    try { const result = await syncReceipt(draft, id); setMessage(result.synced ? "Saved to VCC and synced securely." : "Saved to this VCC. Cloud sync needs environment setup."); }
    catch (error) { setMessage(`Saved locally; cloud sync needs attention: ${error instanceof Error ? error.message : "unknown error"}`); }
    setStatus("saved");
  }

  return <main className="vitascan-app-shell">
    <header className="vitascan-app-header">
      <a className="vitascan-brand" href="/vitascan" aria-label="VitaScan home"><img src="/vitascan-logo.png" alt=""/><span><strong>VitaScan</strong><small>by VCC</small></span></a>
      <a className="open-vcc" href="https://vcc.os.vercel.app/transactions">Open VCC <ArrowUpRight size={16}/></a>
    </header>
    <div className="vitascan-page">
    <section className="vitascan-hero">
      <div className="vitascan-mark"><ScanLine /></div><div><p className="eyebrow">VitaScan</p><h1>Receipts in. Clarity out.</h1><p>Scan Chime, Cash App, Apple Cash, and everyday receipts. Confirm once, then see the transaction across VCC.</p></div>
      <span className={`vitascan-sync ${vitaCloudEnabled ? "online" : ""}`}><Cloud size={15}/>{vitaCloudEnabled ? "Cloud ready" : "Local mode"}</span>
    </section>
    <div className="vitascan-grid">
      <section className="vitascan-capture panel">
        <div className="scan-frame">{preview ? <img src={preview} alt="Receipt preview"/> : <><Camera size={38}/><strong>Capture or upload</strong><span>Screenshots and receipt photos stay on-device during OCR.</span></>}</div>
        <label className="scan-button"><Camera size={18}/> Scan receipt<input type="file" accept="image/*" capture="environment" onChange={(e) => scan(e.target.files?.[0])}/></label>
        <label className="scan-secondary"><FileImage size={17}/> Choose screenshot<input type="file" accept="image/*" onChange={(e) => scan(e.target.files?.[0])}/></label>
        {status === "scanning" && <p className="scan-status"><LoaderCircle className="spin"/> Extracting details…</p>}
      </section>
      <section className="vitascan-review panel" aria-live="polite">
        <div className="review-heading"><div><p className="eyebrow">Review</p><h2>{status === "saved" ? "Receipt added" : "Confirm the details"}</h2></div>{draft.confidence > 0 && <span>{draft.confidence}% read</span>}</div>
        <div className="review-fields">
          <label className="wide">Merchant<input value={draft.merchant} onChange={(e)=>update("merchant",e.target.value)} placeholder="Who was paid?"/></label>
          <label>Amount<input inputMode="decimal" value={draft.amount} onChange={(e)=>update("amount",e.target.value)} placeholder="0.00"/></label>
          <label>Date<input type="date" value={draft.date} onChange={(e)=>update("date",e.target.value)}/></label>
          <label>Flow<select value={draft.direction} onChange={(e)=>update("direction",e.target.value as ReceiptDraft["direction"])}><option value="expense">Money out</option><option value="income">Money in</option><option value="transfer">Transfer</option></select></label>
          <label>Account<input value={draft.account} onChange={(e)=>update("account",e.target.value)}/></label>
          <label>Category<input value={draft.category} onChange={(e)=>update("category",e.target.value)}/></label>
          <label>Reference<input value={draft.reference} onChange={(e)=>update("reference",e.target.value)}/></label>
        </div>
        <button className="save-scan" onClick={save} disabled={status === "scanning"}><CheckCircle2/> Add to VCC</button>
        <button className="reset-scan" onClick={()=>{setPreview("");setDraft(emptyDraft);setStatus("idle");setMessage("");}}><RotateCcw/> Start over</button>
        {message && <p className="scan-message"><ShieldCheck size={16}/>{message}</p>}
      </section>
    </div>
    <section className="vitascan-recent panel"><div><p className="eyebrow">Recently scanned</p><h2>VitaScan activity</h2></div>{recent.length ? <ul>{recent.map((r)=><li key={r.id}><strong>{r.cells.description}</strong><span>{r.cells.account}</span><b>${Math.abs(Number(r.cells.amount)).toFixed(2)}</b></li>)}</ul> : <p>No VitaScan receipts yet.</p>}</section>
    </div>
    <footer className="vitascan-footer"><span>Official VCC companion</span><a href="https://vcc.os.vercel.app">vcc.os.vercel.app</a></footer>
  </main>;
}
