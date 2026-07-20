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
  ShoppingBasket,
  Smartphone,
} from "lucide-react";
import type { AppData } from "../../lib/types/app";
import { formatReceiptNotes, parseReceiptText, type ReceiptDraft } from "../../lib/vitascan/receiptParser";
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
  const scanInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const recent = useMemo(
    () => data.sections.transactions.filter((row) => row.cells.notes?.includes("VitaScan")).slice(-5).reverse(),
    [data]
  );

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    document.body.classList.add("vitascan-body");
    return () => document.body.classList.remove("vitascan-body");
  }, []);

  async function scan(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("VitaScan accepts receipt photos and screenshots only.");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setDraft(emptyDraft);
    setStatus("scanning");
    setMessage("Reading every visible line on this device…");

    try {
      const { recognize } = await import("tesseract.js");
      const barcodePromise = detectImageBarcodes(file);
      const result = await recognize(file, receiptOcrLanguages(window.navigator.languages));
      const nextDraft = parseReceiptText(result.data.text, await barcodePromise);
      setDraft(nextDraft);
      setStatus("ready");
      setMessage(canAdd(nextDraft)
        ? "Receipt details are ready to send to VCC Transactions."
        : "The total or merchant was not clear enough. Retake the scan with the full receipt in frame.");
    } catch {
      setStatus("ready");
      setMessage("This image could not be read. Retake it in bright, even light with the full receipt in frame.");
    }
  }

  async function save() {
    if (!canAdd(draft) || status === "saving") return;
    setStatus("saving");
    setMessage("Adding the receipt to VCC Transactions…");

    const amount = Math.abs(Number(draft.amount));
    const id = `vitascan-${crypto.randomUUID()}`;
    const signed = draft.direction === "expense" ? -amount : amount;
    const notes = formatReceiptNotes(draft);
    const row = {
      id,
      cells: {
        description: draft.merchant,
        type: draft.direction,
        category: draft.category,
        amount: signed.toFixed(2),
        date: draft.date,
        account: draft.account,
        recurring: "No",
        notes,
      },
    };

    onChange({ ...data, sections: { ...data.sections, transactions: [...data.sections.transactions, row] } });

    try {
      const result = await syncReceipt(draft, id);
      setMessage(result.synced
        ? "Added to Transactions and synced across your VCC devices."
        : `Added to Transactions on this device. ${result.reason || "Connect cloud sync to share it."}`);
    } catch (error) {
      setMessage(`Added to Transactions locally; cloud sync needs attention: ${error instanceof Error ? error.message : "unknown error"}`);
    }
    setStatus("saved");
  }

  function reset() {
    setPreview("");
    setDraft(emptyDraft);
    setStatus("idle");
    setMessage("");
    if (scanInputRef.current) scanInputRef.current.value = "";
    if (screenshotInputRef.current) screenshotInputRef.current.value = "";
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

      <div className="vitascan-mobile-only">
        <section className="vitascan-capture panel" aria-labelledby="scanner-title" aria-busy={status === "scanning"}>
          <div className="scanner-heading">
            <div><p className="eyebrow">Primary action</p><h2 id="scanner-title">Scan a receipt</h2></div>
            <span>1</span>
          </div>

          <div className={`scan-frame ${preview ? "has-preview" : ""}`}>
            {preview
              ? <img src={preview} alt="Receipt selected for scanning" />
              : <><Camera size={42} aria-hidden="true" /><strong>Fill the frame</strong><span>Keep the entire receipt or payment screenshot visible.</span></>}
            {status === "scanning" && <div className="scan-reading"><LoaderCircle className="spin" aria-hidden="true" /><strong>Reading every detail…</strong></div>}
          </div>

          <div className="scan-actions">
            <label className="scan-button"><Camera size={19} aria-hidden="true" /> Open camera
              <input ref={scanInputRef} type="file" accept="image/*" capture="environment" onChange={(event) => scan(event.target.files?.[0])} />
            </label>
            <label className="scan-secondary"><FileImage size={18} aria-hidden="true" /> Use screenshot
              <input ref={screenshotInputRef} type="file" accept="image/*" onChange={(event) => scan(event.target.files?.[0])} />
            </label>
          </div>
          <p className="privacy-note"><ShieldCheck size={15} aria-hidden="true" /> Image reading happens on this device.</p>
        </section>

        {status !== "idle" && <section className="vitascan-result panel" aria-live="polite" aria-labelledby="result-title">
          <div className="result-heading">
            <div><p className="eyebrow">Scan result</p><h2 id="result-title">{status === "saved" ? "Added to VCC" : "Details captured"}</h2></div>
            {draft.confidence > 0 && <span className="read-score">{draft.confidence}% read</span>}
          </div>

          {draft.rawText && <>
            <dl className="receipt-summary">
              <div><dt>Merchant</dt><dd>{draft.merchant || "Not detected"}</dd></div>
              <div><dt>Total</dt><dd>{draft.amount ? formatReceiptAmount(draft) : "Not detected"}</dd></div>
              <div><dt>Date</dt><dd>{draft.date || "Not detected"}</dd></div>
              <div><dt>Payment</dt><dd>{draft.account}</dd></div>
            </dl>
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
            <details className="full-scan"><summary><ReceiptText size={17} aria-hidden="true" /> Every captured line</summary><pre>{draft.rawText}</pre></details>
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
        <div><p className="eyebrow">Mobile scanner</p><h2>Scan from your phone</h2><p>VitaScan capture is mobile-only. New scans sync here and into VCC Transactions.</p></div>
        <a href={VCC_TRANSACTIONS_URL}>Open Transactions <ArrowUpRight size={16} /></a>
      </section>

      <RecentScans recent={recent} />
    </div>

    <footer className="vitascan-footer"><span>Official VCC companion</span><a href={VCC_OFFICIAL_URL}>vcc-os.vercel.app</a></footer>
  </main>;
}

function canAdd(draft: ReceiptDraft) {
  const amount = Number(draft.amount);
  return Boolean(draft.rawText && draft.merchant.trim() && draft.date && Number.isFinite(amount) && amount > 0);
}

function formatReceiptAmount(draft: ReceiptDraft): string {
  if (!draft.amount) return "";
  if (draft.currencySymbol) return `${draft.currencySymbol}${draft.amount}`;
  return draft.currencyCode ? `${draft.currencyCode} ${draft.amount}` : draft.amount;
}

function formatItemAmount(amount: number, draft: ReceiptDraft): string {
  const value = amount.toFixed(2);
  return draft.currencySymbol ? `${draft.currencySymbol}${value}` : draft.currencyCode ? `${draft.currencyCode} ${value}` : value;
}

function receiptOcrLanguages(languages: readonly string[]): string {
  const languageMap: Record<string, string> = {
    ar: "ara", cs: "ces", da: "dan", de: "deu", el: "ell", es: "spa", fi: "fin", fr: "fra",
    he: "heb", hi: "hin", hu: "hun", id: "ind", it: "ita", ja: "jpn", ko: "kor", nl: "nld",
    no: "nor", pl: "pol", pt: "por", ro: "ron", ru: "rus", sv: "swe", th: "tha", tr: "tur",
    uk: "ukr", vi: "vie", zh: "chi_sim",
  };
  const selected = languages.map((language) => languageMap[language.toLowerCase().split("-")[0]]).filter(Boolean).slice(0, 2);
  return [...new Set(["eng", ...selected])].join("+");
}

type BarcodeResult = { rawValue: string };
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => { detect: (source: ImageBitmap) => Promise<BarcodeResult[]> };

async function detectImageBarcodes(file: File): Promise<string[]> {
  const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  if (Detector && typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    try {
      const detector = new Detector();
      const results = await detector.detect(bitmap);
      const values = [...new Set(results.map((result) => result.rawValue.trim()).filter(Boolean))];
      if (values.length) return values;
    } catch {
      // Continue to the cross-browser decoder below.
    } finally {
      bitmap.close();
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    const result = await new BrowserMultiFormatReader().decodeFromImageUrl(objectUrl);
    return result.getText() ? [result.getText().trim()] : [];
  } catch {
    return [];
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function RecentScans({ recent }: { recent: AppData["sections"]["transactions"] }) {
  return <section className="vitascan-recent panel">
    <div><p className="eyebrow">Synced activity</p><h2>Recent scans</h2></div>
    {recent.length
      ? <ul>{recent.map((row) => <li key={row.id}><strong>{row.cells.description}</strong><span>{row.cells.account}</span><b>${Math.abs(Number(row.cells.amount)).toFixed(2)}</b></li>)}</ul>
      : <p>No VitaScan receipts yet. Your first scan will appear here.</p>}
  </section>;
}
