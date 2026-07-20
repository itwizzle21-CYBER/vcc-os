import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Barcode,
  Camera,
  Check,
  Cloud,
  FileImage,
  LoaderCircle,
  Languages,
  ReceiptText,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  ShoppingBasket,
  Smartphone,
} from "lucide-react";
import type { AppData } from "../../lib/types/app";
import { formatReceiptNotes, parseReceiptText, type ReceiptDraft } from "../../lib/vitascan/receiptParser";
import { readReceiptImage, warmReceiptReader, type ReceiptImageQuality, type ReceiptReadProgress } from "../../lib/vitascan/receiptOcr";
import { syncReceipt, vitaCloudEnabled } from "../../lib/vitascan/cloud";
import { VCC_OFFICIAL_URL, VCC_TRANSACTIONS_URL } from "../../config/urls";
import "./vitascan.css";
import "./vitascan-app.css";

const emptyDraft = parseReceiptText("");
type ScanStatus = "idle" | "scanning" | "ready" | "saving" | "saved";

export default function VitaScan({ data, onChange }: { data: AppData; onChange: (data: AppData) => void }) {
  const [preview, setPreview] = useState("");
  const [draft, setDraft] = useState<ReceiptDraft>(emptyDraft);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [message, setMessage] = useState("");
  const [readProgress, setReadProgress] = useState<ReceiptReadProgress | null>(null);
  const [imageQuality, setImageQuality] = useState<ReceiptImageQuality | null>(null);
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const scanSequenceRef = useRef(0);
  const recent = useMemo(
    () => data.sections.transactions.filter((row) => row.cells.notes?.includes("VitaScan")).slice(-5).reverse(),
    [data]
  );

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void warmReceiptReader(receiptOcrLanguages()).catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    document.body.classList.add("vitascan-body");
    const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    manifest?.setAttribute("href", "/vitascan.webmanifest");
    appleIcon?.setAttribute("href", "/icons/vitascan-apple-180.png?v=2");
    favicon?.setAttribute("href", "/icons/vitascan-android-192.png?v=2");
    return () => {
      document.body.classList.remove("vitascan-body");
      manifest?.setAttribute("href", "/vcc.webmanifest");
      appleIcon?.setAttribute("href", "/icons/vcc-apple-180.png?v=1");
      favicon?.setAttribute("href", "/icons/vcc-android-192.png?v=1");
    };
  }, []);

  async function scan(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("VitaScan accepts receipt photos and screenshots only.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setDraft(emptyDraft);
    setStatus("scanning");
    setImageQuality(null);
    setOcrConfidence(0);
    setReadProgress({ stage: "preparing", progress: 0.02, label: "Preparing the receipt…" });
    setMessage("Finding the receipt, strengthening faint print, and reading every line on this device…");
    const scanSequence = ++scanSequenceRef.current;

    try {
      const barcodePromise = detectImageBarcodes(file);
      const result = await readReceiptImage(file, receiptOcrLanguages(), [], setReadProgress);
      const nextDraft = result.draft;
      setDraft(nextDraft);
      setImageQuality(result.quality);
      setOcrConfidence(result.ocrConfidence);
      setReadProgress(null);
      setStatus("ready");
      setMessage(canAdd(nextDraft)
        ? `Receipt read with ${result.passes} precision pass${result.passes === 1 ? "" : "es"}. Check the highlighted details, then add it to VCC.`
        : `Some details need your help. Fill in the merchant and total below—there is no need to rescan a readable receipt.`);
      void barcodePromise.then((detectedBarcodes) => {
        if (!detectedBarcodes.length || scanSequenceRef.current !== scanSequence) return;
        setDraft((current) => ({ ...current, barcodes: [...new Set([...current.barcodes, ...detectedBarcodes])] }));
      });
    } catch (error) {
      setReadProgress(null);
      setStatus("ready");
      setMessage(`Automatic reading stopped. You can still enter the merchant and total below, or try another image. ${error instanceof Error ? error.message : ""}`.trim());
    }
  }

  async function save() {
    if (!canAdd(draft) || status === "saving") return;
    setStatus("saving");
    setMessage("Adding the receipt to VCC Transactions…");

    const amount = Math.abs(Number(draft.amount));
    const id = `vitascan-${crypto.randomUUID()}`;
    const signed = draft.direction === "expense" ? -amount : amount;
    const savedDraft = { ...draft, date: draft.date || new Date().toISOString().slice(0, 10) };
    const notes = `${formatReceiptNotes(savedDraft)}${draft.date ? "" : "\nReceipt date was unreadable; VitaScan used the scan date."}`;
    const row = {
      id,
      cells: {
        description: draft.merchant,
        type: draft.direction,
        category: draft.category,
        amount: signed.toFixed(2),
        date: savedDraft.date,
        account: draft.account,
        recurring: "No",
        notes,
      },
    };

    onChange({ ...data, sections: { ...data.sections, transactions: [...data.sections.transactions, row] } });

    try {
      const result = await syncReceipt(savedDraft, id);
      setMessage(result.synced
        ? "Added to Transactions and synced across your VCC devices."
        : `Added to Transactions on this device. ${result.reason || "Connect cloud sync to share it."}`);
    } catch (error) {
      setMessage(`Added to Transactions locally; cloud sync needs attention: ${error instanceof Error ? error.message : "unknown error"}`);
    }
    setStatus("saved");
  }

  function reset() {
    scanSequenceRef.current += 1;
    setPreview("");
    setDraft(emptyDraft);
    setStatus("idle");
    setMessage("");
    setReadProgress(null);
    setImageQuality(null);
    setOcrConfidence(0);
    if (scanInputRef.current) scanInputRef.current.value = "";
    if (screenshotInputRef.current) screenshotInputRef.current.value = "";
  }

  function updateDraft<K extends keyof ReceiptDraft>(field: K, value: ReceiptDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function receiveDroppedFile(files: FileList | null) {
    const image = [...(files || [])].find((file) => file.type.startsWith("image/"));
    if (image) void scan(image);
  }

  return <main className="vitascan-app-shell">
    <header className="vitascan-app-header">
      <a className="vitascan-brand" href="/vitascan" aria-label="VitaScan home">
        <img src="/vitascan-logo.png" alt="" />
        <span><strong>VitaScan</strong><small>by VCC</small></span>
      </a>
      <a className="open-vcc" href={VCC_TRANSACTIONS_URL} aria-label="Open VCC Transactions">
        <span className="open-vcc-short">VCC</span><span className="open-vcc-wide">Transactions</span><ArrowUpRight size={16} />
      </a>
    </header>

    <div className="vitascan-page">
      <section className="vitascan-hero" aria-labelledby="vitascan-title">
        <div className="vitascan-mark"><ScanLine aria-hidden="true" /></div>
        <div>
          <p className="eyebrow">VitaScan</p>
          <h1 id="vitascan-title">Scan it. Send it to VCC.</h1>
          <p>Receipt and payment screenshots become connected VCC transactions.</p>
        </div>
        <span className={`vitascan-sync ${vitaCloudEnabled ? "online" : ""}`}>
          <Cloud size={14} aria-hidden="true" />{vitaCloudEnabled ? "Sync ready" : "On-device"}
        </span>
      </section>

      <div className="vitascan-workbench">
        <section
          className="vitascan-capture panel"
          aria-labelledby="scanner-title"
          aria-busy={status === "scanning"}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); receiveDroppedFile(event.dataTransfer.files); }}
          onPaste={(event) => receiveDroppedFile(event.clipboardData.files)}
        >
          <div className="scanner-heading">
            <div><p className="eyebrow">Primary action</p><h2 id="scanner-title">Scan a receipt</h2></div>
            <span>1</span>
          </div>

          <div className={`scan-frame ${preview ? "has-preview" : ""}`}>
            {preview
              ? <img src={preview} alt="Receipt selected for scanning" />
              : <><Camera size={42} aria-hidden="true" /><strong>Capture the whole receipt</strong><span>Take a photo, choose a screenshot, paste, or drop an image here.</span></>}
            {status === "scanning" && <div className="scan-reading">
              <LoaderCircle className="spin" aria-hidden="true" />
              <strong>{readProgress?.label || "Reading every detail…"}</strong>
              <progress max="1" value={readProgress?.progress || 0.02} aria-label="Receipt reading progress" />
              <small>{Math.round((readProgress?.progress || 0.02) * 100)}%</small>
            </div>}
          </div>

          <div className="scan-actions">
            <label className="scan-button"><Camera size={19} aria-hidden="true" /> Open camera
              <input ref={scanInputRef} type="file" accept="image/*" capture="environment" onChange={(event) => scan(event.target.files?.[0])} />
            </label>
            <label className="scan-secondary"><FileImage size={18} aria-hidden="true" /> Use screenshot
              <input ref={screenshotInputRef} type="file" accept="image/*" onChange={(event) => scan(event.target.files?.[0])} />
            </label>
          </div>
          <p className="privacy-note"><ShieldCheck size={15} aria-hidden="true" /> Multi-pass image reading happens privately on this device.</p>
        </section>

        {status !== "idle" && <section className="vitascan-result panel" aria-live="polite" aria-labelledby="result-title">
          <div className="result-heading">
            <div><p className="eyebrow">Scan result</p><h2 id="result-title">{status === "saved" ? "Added to VCC" : "Details captured"}</h2></div>
            {ocrConfidence > 0 && <span className="read-score"><Sparkles size={13} aria-hidden="true" /> {ocrConfidence}% OCR</span>}
          </div>

          {status !== "scanning" && <>
            <fieldset className="receipt-review">
              <legend>Review receipt details</legend>
              <label className={!draft.merchant.trim() || draft.merchant === "Receipt" ? "needs-value" : ""}>
                <span>Merchant <small>Required</small></span>
                <input value={draft.merchant === "Receipt" ? "" : draft.merchant} onChange={(event) => updateDraft("merchant", event.target.value)} placeholder="Store or payee" autoComplete="organization" />
              </label>
              <label className={!Number(draft.amount) ? "needs-value" : ""}>
                <span>Total <small>Required</small></span>
                <div className="money-input"><b>{draft.currencySymbol || "$"}</b><input type="number" inputMode="decimal" min="0.01" step="0.01" value={draft.amount} onChange={(event) => updateDraft("amount", event.target.value)} placeholder="0.00" /></div>
              </label>
              <label><span>Date</span><input type="date" value={draft.date} onChange={(event) => updateDraft("date", event.target.value)} /></label>
              <label><span>Payment method</span><input value={draft.account === "Receipt" ? "" : draft.account} onChange={(event) => updateDraft("account", event.target.value)} placeholder="Cash, Visa, Cash App…" /></label>
              <label><span>Category</span><select value={draft.category} onChange={(event) => updateDraft("category", event.target.value)}>
                {["Groceries", "Restaurants", "Shopping", "Fuel", "Healthcare", "Bills", "Transfers", "Income", "Other"].map((category) => <option key={category}>{category}</option>)}
              </select></label>
              <label><span>Transaction type</span><select value={draft.direction} onChange={(event) => updateDraft("direction", event.target.value as ReceiptDraft["direction"])}>
                <option value="expense">Expense</option><option value="income">Income</option><option value="transfer">Transfer</option>
              </select></label>
              <label className="review-wide"><span>Receipt / confirmation number</span><input value={draft.reference} onChange={(event) => updateDraft("reference", event.target.value)} placeholder="Optional" /></label>
            </fieldset>
            {(draft.items.length > 0 || draft.barcodes.length > 0 || draft.pluNumbers.length > 0) && <section className="retail-intelligence" aria-labelledby="retail-intelligence-title">
              <div className="retail-intelligence-heading"><ShoppingBasket size={18} aria-hidden="true" /><h3 id="retail-intelligence-title">Retail intelligence</h3></div>
              <div className="retail-signals">
                {draft.currencyCode && <span><Languages size={14} aria-hidden="true" />{draft.currencyCode}</span>}
                {draft.items.length > 0 && <span><ShoppingBasket size={14} aria-hidden="true" />{draft.items.length} item{draft.items.length === 1 ? "" : "s"}</span>}
                {draft.barcodes.length > 0 && <span><Barcode size={14} aria-hidden="true" />{draft.barcodes.length} barcode{draft.barcodes.length === 1 ? "" : "s"}</span>}
              </div>
              {draft.items.length > 0 && <ul className="receipt-items">{draft.items.slice(0, 12).map((item, index) => <li key={`${item.name}-${index}`}>
                <span><strong>{item.name}</strong>{item.plu && <small>PLU {item.plu}</small>}{item.barcode && <small>{item.barcode}</small>}</span>
                <b>{item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}${item.unitPrice ? ` @ ${formatItemAmount(item.unitPrice, draft)}` : ""} · ` : ""}{formatItemAmount(item.totalPrice, draft)}</b>
              </li>)}</ul>}
              {draft.items.length > 12 && <p className="more-items">+{draft.items.length - 12} more items preserved in the transaction</p>}
              {draft.pluNumbers.length > 0 && <p className="code-list"><strong>PLU</strong> {draft.pluNumbers.join(" · ")}</p>}
              {draft.barcodes.length > 0 && <p className="code-list"><strong>Barcode</strong> {draft.barcodes.join(" · ")}</p>}
            </section>}
            {imageQuality?.warnings.length ? <section className="scan-quality" aria-label="Photo tips">
              <strong>For an even stronger read</strong>
              <ul>{imageQuality.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            </section> : null}
            {draft.rawText && <details className="full-scan"><summary><ReceiptText size={17} aria-hidden="true" /> Every captured line</summary><pre>{draft.rawText}</pre></details>}
          </>}

          {message && <p className={`scan-message ${canAdd(draft) ? "is-ready" : ""}`}><ShieldCheck size={16} aria-hidden="true" />{message}</p>}

          {status === "saved"
            ? <a className="save-scan is-saved" href={VCC_TRANSACTIONS_URL}><Check aria-hidden="true" /> View in Transactions</a>
            : <button className="save-scan" type="button" onClick={save} disabled={!canAdd(draft) || status === "scanning" || status === "saving"} aria-busy={status === "saving"}>
              {status === "saving" ? <LoaderCircle className="spin" aria-hidden="true" /> : <ArrowUpRight aria-hidden="true" />}
              {status === "saving" ? "Adding to VCC…" : "Add to VCC"}
            </button>}
          <button className="reset-scan" type="button" onClick={reset}><RotateCcw aria-hidden="true" /> {status === "saved" ? "Scan another" : "Retake scan"}</button>
        </section>}
      </div>

      <section className="vitascan-desktop-companion panel">
        <Smartphone size={30} aria-hidden="true" />
        <div><p className="eyebrow">Works everywhere</p><h2>Phone camera or desktop screenshots</h2><p>Use the same high-quality scanner on any screen. Confirmed scans sync into VCC Transactions.</p></div>
        <a href={VCC_TRANSACTIONS_URL}>Open Transactions <ArrowUpRight size={16} /></a>
      </section>

      <RecentScans recent={recent} />
    </div>

    <footer className="vitascan-footer"><span>Official VCC companion</span><a href={VCC_OFFICIAL_URL}>vcc-os.vercel.app</a></footer>
  </main>;
}

function canAdd(draft: ReceiptDraft) {
  const amount = Number(draft.amount);
  return Boolean(draft.merchant.trim() && draft.merchant !== "Receipt" && Number.isFinite(amount) && amount > 0);
}

function formatItemAmount(amount: number, draft: ReceiptDraft): string {
  const value = amount.toFixed(2);
  return draft.currencySymbol ? `${draft.currencySymbol}${value}` : draft.currencyCode ? `${draft.currencyCode} ${value}` : value;
}

function receiptOcrLanguages(): string {
  return "eng";
}

type BarcodeResult = { rawValue: string };
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => { detect: (source: ImageBitmap) => Promise<BarcodeResult[]> };

async function detectImageBarcodes(file: File): Promise<string[]> {
  const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  if (Detector && typeof createImageBitmap === "function") {
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await createImageBitmap(file);
      const detector = new Detector();
      const results = await detector.detect(bitmap);
      const values = [...new Set(results.map((result) => result.rawValue.trim()).filter(Boolean))];
      if (values.length) return values;
    } catch {
      // Continue to the cross-browser decoder below.
    } finally {
      bitmap?.close();
    }
  }

  return [];
}

function RecentScans({ recent }: { recent: AppData["sections"]["transactions"] }) {
  return <section className="vitascan-recent panel">
    <div><p className="eyebrow">Synced activity</p><h2>Recent scans</h2></div>
    {recent.length
      ? <ul>{recent.map((row) => <li key={row.id}><strong>{row.cells.description}</strong><span>{row.cells.account}</span><b>${Math.abs(Number(row.cells.amount)).toFixed(2)}</b></li>)}</ul>
      : <p>No VitaScan receipts yet. Your first scan will appear here.</p>}
  </section>;
}
