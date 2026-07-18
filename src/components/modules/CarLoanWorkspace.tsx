import { useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, FileCheck2, FileText, Landmark, MessageSquareText, Paperclip, Plus, ReceiptText, ShieldCheck } from "lucide-react";
import { formatCurrency, formatDateMDY, toNumber } from "../../lib/calculations/currency";
import { communicationConflicts, receiptComponentTotal, summarizeCarLoan, syncConfirmedReceiptTransactions } from "../../lib/engine/carLoanEngine";
import { openEvidenceAttachment, saveEvidenceAttachment } from "../../lib/storage/evidenceAttachmentStore";
import type { AppData, CarLoanCommunication, CarLoanReceipt, CommunicationStatus, EvidenceStatus, FinancialState } from "../../lib/types/app";
import "../../car-loan-page.css";

interface Props {
  data: AppData;
  financialState: FinancialState;
  onChange: (data: AppData) => void;
}

type CarTab = "overview" | "receipts" | "schedule" | "communications" | "contract";

const receiptStatuses: Array<[EvidenceStatus, string]> = [
  ["draft", "Draft"], ["confirmed", "Confirmed"], ["needs_review", "Needs Review"],
  ["superseded", "Superseded"], ["rejected", "Rejected"],
];

const communicationStatuses: Array<[CommunicationStatus, string]> = [
  ["unverified", "Unverified"], ["dealer_confirmed", "Dealer Confirmed"],
  ["matches_receipt", "Matches Receipt"], ["conflicts_with_receipt", "Conflicts With Receipt"],
  ["superseded", "Superseded"],
];

export default function CarLoanWorkspace({ data, financialState, onChange }: Props) {
  const [tab, setTab] = useState<CarTab>("overview");
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [revisionSource, setRevisionSource] = useState<CarLoanReceipt | null>(null);
  const summary = useMemo(() => summarizeCarLoan(data.carLoan, data.sections.transactions), [data.carLoan, data.sections.transactions]);
  const contract = data.carLoan.contract;

  if (!contract) {
    return <section className="car-loan-empty panel"><Landmark size={30} /><h1>No verified auto-loan contract</h1><p>Add a contract record before recording evidence.</p></section>;
  }

  function saveReceipt(receipt: CarLoanReceipt) {
    let receipts = [...data.carLoan.receipts];
    if (receipt.supersedesId && receipt.status === "confirmed") {
      receipts = receipts.map((row) => row.id === receipt.supersedesId ? { ...row, status: "superseded" as const } : row);
    }
    receipts.push(receipt);
    onChange({
      ...data,
      carLoan: { ...data.carLoan, receipts },
      sections: { ...data.sections, transactions: syncConfirmedReceiptTransactions(data.sections.transactions, receipts) },
    });
    setShowReceiptForm(false);
    setRevisionSource(null);
  }

  return (
    <div className="car-loan-workspace">
      <section className="car-loan-command panel">
        <div className="car-loan-title">
          <span className="car-loan-icon"><Landmark size={24} /></span>
          <div><p className="eyebrow">Verified Auto Loan</p><h1>{contract.vehicle}</h1><p>{contract.lender} · Contracted {formatDateMDY(contract.contractDate)} · VIN {contract.maskedVin}</p></div>
        </div>
        <div className="car-loan-truth"><ShieldCheck size={18} /><span>Confirmed evidence only</span></div>
      </section>

      <section className="car-loan-primary-metrics" aria-label="Current confirmed loan status">
        <article className="car-loan-metric is-payoff"><span>Official payoff</span><strong>{formatCurrency(summary.officialPayoff)}</strong><small>Dealer receipt · {summary.currentReceipt ? formatDateMDY(summary.currentReceipt.paidDate) : "Not confirmed"}</small></article>
        <article className="car-loan-metric"><span>Dealer account balance</span><strong>{formatCurrency(summary.dealerBalance)}</strong><small>Kept separate from payoff</small></article>
        <article className="car-loan-metric"><span>Total cash paid</span><strong>{formatCurrency(summary.totalCashPaid)}</strong><small>{summary.confirmedReceipts.length} confirmed receipts</small></article>
        <article className="car-loan-metric"><span>Amount financed</span><strong>{formatCurrency(contract.amountFinanced)}</strong><small>Original contract</small></article>
      </section>

      <nav className="car-loan-tabs" aria-label="Car loan records">
        {(["overview", "receipts", "schedule", "communications", "contract"] as CarTab[]).map((value) => (
          <button key={value} type="button" className={tab === value ? "active" : ""} aria-pressed={tab === value} onClick={() => setTab(value)}>{tabLabel(value)}</button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="car-loan-overview-grid">
          <section className="panel car-loan-breakdown">
            <div className="car-section-heading"><div><p className="eyebrow">Confirmed Totals</p><h2>Where the money went</h2></div><CheckCircle2 size={22} /></div>
            <dl>
              <div><dt>Principal paid</dt><dd>{formatCurrency(summary.principalPaid)}</dd></div>
              <div><dt>Interest paid</dt><dd>{formatCurrency(summary.interestPaid)}</dd></div>
              <div><dt>Fees paid</dt><dd>{formatCurrency(summary.feesPaid)}</dd></div>
              <div><dt>Down payment paid</dt><dd>{formatCurrency(summary.downPaymentPaid)}</dd></div>
              <div><dt>Payments remaining</dt><dd>{summary.paymentsRemaining ? `${summary.paymentsRemaining} weeks` : "Not reported"}</dd></div>
              <div><dt>VCC principal progress</dt><dd>{financialState.carPaymentPaidPercent.toFixed(1)}%</dd></div>
            </dl>
          </section>
          <section className="panel car-loan-reconciliation">
            <div className="car-section-heading"><div><p className="eyebrow">Reconciliation</p><h2>{summary.issues.length} item{summary.issues.length === 1 ? "" : "s"} to review</h2></div><AlertTriangle size={22} /></div>
            <ul>{summary.issues.map((issue) => <li key={issue}><AlertTriangle size={16} /><span>{issue}</span></li>)}</ul>
            {!summary.issues.length && <p className="empty-copy">No evidence conflicts are currently detected.</p>}
          </section>
          <section className="panel car-loan-source-note">
            <FileCheck2 size={22} />
            <div><strong>Source boundaries are enforced</strong><p>Receipts show actual documented payments. The amortization schedule stays unchanged as contract reference. Dealer messages never overwrite receipts.</p></div>
          </section>
        </div>
      )}

      {tab === "receipts" && (
        <section className="panel car-loan-records">
          <div className="car-section-heading">
            <div><p className="eyebrow">Actual Payments</p><h2>Confirmed receipt evidence</h2><p>Only documented values appear here. Future “Next Period” amounts are excluded.</p></div>
            <button type="button" onClick={() => { setRevisionSource(null); setShowReceiptForm(true); }}><Plus size={16} /> Add receipt</button>
          </div>
          {(showReceiptForm || revisionSource) && <ReceiptForm source={revisionSource} onCancel={() => { setShowReceiptForm(false); setRevisionSource(null); }} onSave={saveReceipt} />}
          <div className="car-receipt-list">
            {[...data.carLoan.receipts].sort(newestEvidenceFirst).map((receipt) => (
              <ReceiptCard key={receipt.id} receipt={receipt} onRevise={() => { setRevisionSource(receipt); setShowReceiptForm(true); }} />
            ))}
          </div>
        </section>
      )}

      {tab === "schedule" && <ScheduleView data={data} />}
      {tab === "communications" && <CommunicationsView data={data} onChange={onChange} />}
      {tab === "contract" && <ContractView data={data} />}
    </div>
  );
}

function ReceiptForm({ source, onCancel, onSave }: { source: CarLoanReceipt | null; onCancel: () => void; onSave: (receipt: CarLoanReceipt) => void }) {
  const [values, setValues] = useState<Record<string, string>>(() => source ? receiptToForm(source) : { paidDate: "", receiptNumber: "", paymentType: "Payment", paymentMethod: "", receivedBy: "", totalPaid: "", status: "draft", notes: "" });
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!values.paidDate || !values.totalPaid) { setMessage("Paid date and total paid are required."); return; }
    let attachmentId: string | undefined;
    try {
      attachmentId = file ? await saveEvidenceAttachment(file) : undefined;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The attachment could not be saved.");
      return;
    }
    onSave({
      id: `receipt-${Date.now()}`,
      revision: source ? source.revision + 1 : 1,
      supersedesId: source?.id,
      paidDate: values.paidDate,
      receiptNumber: values.receiptNumber || "",
      paymentType: values.paymentType || "Payment",
      paymentMethod: values.paymentMethod || "",
      receivedBy: values.receivedBy || "",
      totalPaid: toNumber(values.totalPaid),
      downPaymentPaid: optionalNumber(values.downPaymentPaid), principalPaid: optionalNumber(values.principalPaid),
      interestPaid: optionalNumber(values.interestPaid), lateFeesPaid: optionalNumber(values.lateFeesPaid),
      otherFeesPaid: optionalNumber(values.otherFeesPaid), sideNoteFeesPaid: optionalNumber(values.sideNoteFeesPaid),
      creditsApplied: optionalNumber(values.creditsApplied), officialPayoff: optionalNumber(values.officialPayoff),
      accountBalance: optionalNumber(values.accountBalance), paymentsRemaining: optionalNumber(values.paymentsRemaining),
      attachmentName: file?.name || source?.attachmentName,
      attachmentId: attachmentId || source?.attachmentId,
      status: values.status as EvidenceStatus,
      notes: values.notes || "",
      createdAt: new Date().toISOString(),
    });
  }

  const fields: Array<[string, string]> = [
    ["downPaymentPaid", "Down payment paid"], ["principalPaid", "Principal paid"], ["interestPaid", "Interest paid"],
    ["lateFeesPaid", "Late fees paid"], ["otherFeesPaid", "Other fees paid"], ["sideNoteFeesPaid", "Side-note fees paid"],
    ["creditsApplied", "Credits applied"], ["officialPayoff", "Official payoff shown"], ["accountBalance", "Account balance shown"],
    ["paymentsRemaining", "Payments remaining"],
  ];

  return (
    <form className="car-evidence-form" onSubmit={submit}>
      <div className="car-form-heading"><div><strong>{source ? `Create revision ${source.revision + 1}` : "Add receipt evidence"}</strong><small>Leave fields blank when the receipt does not show them.</small></div><button type="button" className="ghost-button" onClick={onCancel}>Cancel</button></div>
      <div className="car-form-grid">
        <Field label="Paid date"><input type="date" value={values.paidDate || ""} onChange={setField(values, setValues, "paidDate")} /></Field>
        <Field label="Receipt number"><input value={values.receiptNumber || ""} onChange={setField(values, setValues, "receiptNumber")} /></Field>
        <Field label="Payment type"><input value={values.paymentType || ""} onChange={setField(values, setValues, "paymentType")} /></Field>
        <Field label="Payment method"><input value={values.paymentMethod || ""} onChange={setField(values, setValues, "paymentMethod")} /></Field>
        <Field label="Received by"><input value={values.receivedBy || ""} onChange={setField(values, setValues, "receivedBy")} /></Field>
        <Field label="Total paid"><input inputMode="decimal" value={values.totalPaid || ""} onChange={setField(values, setValues, "totalPaid")} /></Field>
        {fields.map(([key, label]) => <Field key={key} label={label}><input inputMode="decimal" value={values[key] || ""} onChange={setField(values, setValues, key)} /></Field>)}
        <Field label="Verification status"><select value={values.status || "draft"} onChange={setField(values, setValues, "status")}>{receiptStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Receipt image"><input type="file" accept="image/*,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} /></Field>
      </div>
      <Field label="Exact source notes"><textarea value={values.notes || ""} onChange={setField(values, setValues, "notes")} /></Field>
      {message && <p className="car-form-error" role="alert">{message}</p>}
      <button type="submit"><FileCheck2 size={16} /> Save evidence record</button>
    </form>
  );
}

function ReceiptCard({ receipt, onRevise }: { receipt: CarLoanReceipt; onRevise: () => void }) {
  const breakdown = [
    ["Down", receipt.downPaymentPaid], ["Principal", receipt.principalPaid], ["Interest", receipt.interestPaid],
    ["Late fees", receipt.lateFeesPaid], ["Other fees", receipt.otherFeesPaid], ["Side-note", receipt.sideNoteFeesPaid], ["Credits", receipt.creditsApplied],
  ].filter(([, value]) => value !== undefined) as Array<[string, number]>;
  const mismatch = Math.abs(receiptComponentTotal(receipt) - receipt.totalPaid) > 0.009;
  return (
    <article className={`car-receipt-card status-${receipt.status}`}>
      <header><div><span className="receipt-icon"><ReceiptText size={18} /></span><div><strong>{formatCurrency(receipt.totalPaid)}</strong><small>{formatDateMDY(receipt.paidDate)} · Receipt {receipt.receiptNumber || "not numbered"}</small></div></div><StatusBadge status={receipt.status} /></header>
      <div className="receipt-breakdown">{breakdown.map(([label, value]) => <span key={label}><small>{label}</small><strong>{formatCurrency(value)}</strong></span>)}</div>
      <dl className="receipt-account-values">
        {receipt.officialPayoff !== undefined && <div><dt>Official payoff</dt><dd>{formatCurrency(receipt.officialPayoff)}</dd></div>}
        {receipt.accountBalance !== undefined && <div><dt>Account balance</dt><dd>{formatCurrency(receipt.accountBalance)}</dd></div>}
        {receipt.paymentsRemaining !== undefined && <div><dt>Payments remaining</dt><dd>{receipt.paymentsRemaining} weeks</dd></div>}
      </dl>
      <footer>
        <span>{receipt.paymentType}{receipt.paymentMethod ? ` · ${receipt.paymentMethod}` : ""}{receipt.receivedBy ? ` · ${receipt.receivedBy}` : ""}</span>
        <div>{mismatch && <em><AlertTriangle size={14} /> Components differ</em>}{receipt.attachmentId && <button type="button" className="ghost-button" onClick={() => openEvidenceAttachment(receipt.attachmentId!)}><Paperclip size={14} /> Open</button>}<button type="button" className="ghost-button" onClick={onRevise}>Create correction</button></div>
      </footer>
      {receipt.supersedesId && <p className="revision-note">Revision {receipt.revision}; supersedes {receipt.supersedesId}</p>}
    </article>
  );
}

function ScheduleView({ data }: { data: AppData }) {
  return (
    <section className="panel car-loan-schedule">
      <div className="car-section-heading"><div><p className="eyebrow">Original Contract Reference</p><h2>Amortization schedule</h2><p>25 rows are visible in the supplied schedule page. The contract confirms 108 weekly payments; this reference never changes when actual payments differ.</p></div><FileText size={22} /></div>
      <div className="car-table-wrap"><table><thead><tr><th>#</th><th>Scheduled date</th><th>Payment</th><th>Principal</th><th>Interest</th><th>Principal balance</th><th>Actual evidence</th><th>Reconciliation</th></tr></thead><tbody>
        {data.carLoan.schedule.map((row) => {
          const receipts = data.carLoan.receipts.filter((receipt) => receipt.status === "confirmed" && receipt.paidDate === row.scheduledDate);
          const actual = receipts.reduce((total, receipt) => total + receipt.totalPaid, 0);
          const status = receipts.length ? (Math.abs(actual - row.scheduledPayment) < 0.009 ? "Matches schedule" : "Actual differs") : "No linked receipt";
          return <tr key={row.paymentNumber}><td>{row.paymentNumber}</td><td>{formatDateMDY(row.scheduledDate)}</td><td>{formatCurrency(row.scheduledPayment)}</td><td>{formatCurrency(row.scheduledPrincipal)}</td><td>{formatCurrency(row.scheduledInterest)}</td><td>{formatCurrency(row.scheduledPrincipalBalance)}</td><td>{receipts.length ? `${receipts.length} · ${formatCurrency(actual)}` : "—"}</td><td><span className={`schedule-status ${receipts.length ? "has-evidence" : ""}`}>{status}</span></td></tr>;
        })}
      </tbody></table></div>
    </section>
  );
}

function CommunicationsView({ data, onChange }: { data: AppData; onChange: (data: AppData) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({ messageDate: "", communicationType: "Text", dealerRepresentative: "", exactMessage: "", status: "unverified", notes: "" });
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    const relatedReceipt = data.carLoan.receipts.find((receipt) => receipt.id === values.relatedReceiptId);
    let attachmentId: string | undefined;
    try {
      attachmentId = file ? await saveEvidenceAttachment(file) : undefined;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The attachment could not be saved.");
      return;
    }
    const draft: CarLoanCommunication = {
      id: `communication-${Date.now()}`, messageDate: values.messageDate, communicationType: values.communicationType,
      dealerRepresentative: values.dealerRepresentative, exactMessage: values.exactMessage,
      amountStated: optionalNumber(values.amountStated), paymentAcknowledged: optionalNumber(values.paymentAcknowledged),
      payoffStated: optionalNumber(values.payoffStated), accountBalanceStated: optionalNumber(values.accountBalanceStated),
      feesStated: optionalNumber(values.feesStated), relatedReceiptId: values.relatedReceiptId || undefined,
      attachmentName: file?.name, attachmentId,
      status: values.status as CommunicationStatus, notes: values.notes,
    };
    if (communicationConflicts(draft, relatedReceipt)) draft.status = "conflicts_with_receipt";
    onChange({ ...data, carLoan: { ...data.carLoan, communications: [...data.carLoan.communications, draft] } });
    setShowForm(false);
  }
  return <section className="panel car-loan-records"><div className="car-section-heading"><div><p className="eyebrow">Dealer Evidence</p><h2>Communications</h2><p>Texts, emails, calls, and notices stay separate from receipts.</p></div><button type="button" onClick={() => setShowForm(!showForm)}><Plus size={16} /> Add communication</button></div>
    {showForm && <form className="car-evidence-form" onSubmit={submit}><div className="car-form-grid">
      <Field label="Date and time"><input type="datetime-local" value={values.messageDate} onChange={setField(values, setValues, "messageDate")} required /></Field>
      <Field label="Type"><select value={values.communicationType} onChange={setField(values, setValues, "communicationType")}><option>Text</option><option>Email</option><option>Call</option><option>Handwritten notice</option><option>Other</option></select></Field>
      <Field label="Dealer representative"><input value={values.dealerRepresentative} onChange={setField(values, setValues, "dealerRepresentative")} /></Field>
      <Field label="Related receipt"><select value={values.relatedReceiptId || ""} onChange={setField(values, setValues, "relatedReceiptId")}><option value="">None</option>{data.carLoan.receipts.map((receipt) => <option key={receipt.id} value={receipt.id}>{receipt.paidDate} · {receipt.receiptNumber}</option>)}</select></Field>
      {[["amountStated", "Amount stated"], ["paymentAcknowledged", "Payment acknowledged"], ["payoffStated", "Payoff stated"], ["accountBalanceStated", "Account balance stated"], ["feesStated", "Fees stated"]].map(([key, label]) => <Field key={key} label={label}><input inputMode="decimal" value={values[key] || ""} onChange={setField(values, setValues, key)} /></Field>)}
      <Field label="Status"><select value={values.status} onChange={setField(values, setValues, "status")}>{communicationStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Field label="Attachment"><input type="file" accept="image/*,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} /></Field>
    </div><Field label="Exact message"><textarea value={values.exactMessage} onChange={setField(values, setValues, "exactMessage")} required /></Field><Field label="User notes"><textarea value={values.notes} onChange={setField(values, setValues, "notes")} /></Field>{message && <p className="car-form-error" role="alert">{message}</p>}<button type="submit"><MessageSquareText size={16} /> Save communication</button></form>}
    <div className="communication-list">{data.carLoan.communications.map((item) => <article key={item.id}><header><div><MessageSquareText size={17} /><strong>{item.communicationType} · {formatDateMDY(item.messageDate.slice(0, 10))}</strong></div><StatusBadge status={item.status} /></header><blockquote>{item.exactMessage}</blockquote><small>{item.dealerRepresentative || "Representative not recorded"}</small>{item.attachmentId && <button className="ghost-button" type="button" onClick={() => openEvidenceAttachment(item.attachmentId!)}>Open attachment</button>}</article>)}{!data.carLoan.communications.length && <p className="empty-copy">No dealer communications have been added.</p>}</div>
  </section>;
}

function ContractView({ data }: { data: AppData }) {
  const contract = data.carLoan.contract!;
  const rows: Array<[string, string]> = [
    ["Contract date", formatDateMDY(contract.contractDate)], ["Vehicle", contract.vehicle], ["Masked VIN", contract.maskedVin],
    ["Original odometer", contract.originalOdometer.toLocaleString()], ["APR", `${contract.apr.toFixed(3)}%`],
    ["Amount financed", formatCurrency(contract.amountFinanced)], ["Finance charge", formatCurrency(contract.financeCharge)],
    ["Total scheduled payments", formatCurrency(contract.totalScheduledPayments)], ["Down payment shown", formatCurrency(contract.downPayment)],
    ["Deferred down payment", formatCurrency(contract.deferredDownPayment)], ["Total sale price", formatCurrency(contract.totalSalePrice)],
    ["Payment schedule", `${contract.scheduledPaymentCount} ${contract.scheduleFrequency.toLowerCase()} payments of ${formatCurrency(contract.scheduledPaymentAmount)}`],
    ["First payment", formatDateMDY(contract.firstPaymentDate)], ["Late charge", `${contract.lateChargePercent}% after ${contract.gracePeriodDays} days`],
    ["Prepayment penalty", contract.prepaymentPenalty ? "Yes" : "None"],
  ];
  return <section className="panel car-loan-contract"><div className="car-section-heading"><div><p className="eyebrow">Original Legal Terms</p><h2>Contract reference</h2><p>{contract.sourceLabel}</p></div><FileCheck2 size={22} /></div><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="contract-boundary"><ShieldCheck size={16} /> Verified contract reference. Actual receipts never overwrite these scheduled terms.</p></section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="car-form-field"><span>{label}</span>{children}</label>; }
function StatusBadge({ status }: { status: string }) { return <span className={`evidence-status status-${status}`}>{status.replace(/_/g, " ")}</span>; }
function tabLabel(tab: CarTab) { return ({ overview: "Overview", receipts: "Payment Receipts", schedule: "Amortization", communications: "Dealer Communications", contract: "Original Contract" })[tab]; }
function optionalNumber(value: string | undefined) { return value === undefined || value.trim() === "" ? undefined : toNumber(value); }
function newestEvidenceFirst(a: CarLoanReceipt, b: CarLoanReceipt) { return `${b.paidDate}-${b.createdAt}`.localeCompare(`${a.paidDate}-${a.createdAt}`); }
function setField(values: Record<string, string>, setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>, key: string) { return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValues({ ...values, [key]: event.target.value }); }
function receiptToForm(receipt: CarLoanReceipt) { return Object.fromEntries(Object.entries(receipt).map(([key, value]) => [key, value === undefined ? "" : String(value)])); }
