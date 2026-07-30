import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRightLeft,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Plus,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { formatCurrency, formatDateMDY, todayIso, toNumber } from "../../lib/calculations/currency";
import { signedTransactionAmount, transactionMatchesPeriod, transactionType } from "../../lib/engine/transactionEngine";
import type { SpreadsheetRow } from "../../lib/types/app";

export type TransactionLayoutVariant = 1 | 2 | 3 | 4 | 5;

interface AccountOption {
  value: string;
  label: string;
  balance: number;
  kind: "money" | "savings";
  isNew: boolean;
}

interface TransactionHistoryConceptsProps {
  variant: TransactionLayoutVariant;
  rows: SpreadsheetRow[];
  accounts: AccountOption[];
  incomeTotal: number;
  expenseTotal: number;
  transferTotal: number;
  message: string;
  receiptAction: ReactNode;
  onSave: (row: SpreadsheetRow) => boolean;
  onDelete: (rowId: string) => void;
}

export default function TransactionHistoryConcepts({
  variant,
  rows,
  accounts,
  incomeTotal,
  expenseTotal,
  transferTotal,
  message,
  receiptAction,
  onSave,
  onDelete,
}: TransactionHistoryConceptsProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<SpreadsheetRow | null>(null);

  const categories = useMemo(() => [...new Set(rows.map((row) => row.cells.category?.trim()).filter(Boolean))].sort(), [rows]);
  const filteredRows = useMemo(() => rows
    .filter((row) => {
      const query = search.trim().toLowerCase();
      const type = transactionType(row);
      const matchesType = typeFilter === "all"
        || typeFilter === type
        || (typeFilter === "spending" && type === "expense");
      const matchesCategory = categoryFilter === "all" || row.cells.category === categoryFilter;
      const matchesAccount = accountFilter === "all"
        || row.cells.account === accountFilter
        || row.cells.transferDestination === accountFilter;
      const matchesSearch = !query || [
        row.cells.description,
        row.cells.merchant,
        row.cells.category,
        row.cells.account,
        row.cells.transferDestination,
        row.cells.notes,
      ].join(" ").toLowerCase().includes(query);
      return matchesType && matchesCategory && matchesAccount && matchesSearch;
    })
    .sort((left, right) => (right.cells.date || "").localeCompare(left.cells.date || "")),
  [accountFilter, categoryFilter, rows, search, typeFilter]);

  function openNewTransaction() {
    setEditingRow({
      id: `concept-transaction-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      cells: {
        description: "",
        merchant: "",
        type: "expense",
        category: "",
        quantity: "",
        unitCost: "",
        salesTax: "",
        amount: "",
        date: todayIso(),
        account: accounts[0]?.value || "",
        transferDestination: "",
        shortfallSource: "overdraft",
        notes: "",
      },
    });
  }

  const toolbar = (
    <TransactionToolbar
      search={search}
      typeFilter={typeFilter}
      categoryFilter={categoryFilter}
      accountFilter={accountFilter}
      categories={categories}
      accounts={accounts}
      filtersOpen={filtersOpen}
      receiptAction={receiptAction}
      segmented={variant === 3 || variant === 5}
      onSearch={setSearch}
      onTypeFilter={setTypeFilter}
      onCategoryFilter={setCategoryFilter}
      onAccountFilter={setAccountFilter}
      onToggleFilters={() => setFiltersOpen((open) => !open)}
      onAdd={openNewTransaction}
    />
  );

  return (
    <div className="transaction-concept-page">
      {variant === 1 && (
        <CalmLedger
          rows={filteredRows}
          editingRow={editingRow}
          accounts={accounts}
          incomeTotal={incomeTotal}
          expenseTotal={expenseTotal}
          transferTotal={transferTotal}
          message={message}
          toolbar={toolbar}
          onEdit={setEditingRow}
          onClose={() => setEditingRow(null)}
          onSave={(row) => { if (onSave(row)) setEditingRow(null); }}
          onDelete={(rowId) => { onDelete(rowId); setEditingRow(null); }}
        />
      )}

      {variant === 2 && (
        <AccountLens
          rows={filteredRows}
          editingRow={editingRow}
          accounts={accounts}
          selectedAccount={accountFilter}
          incomeTotal={incomeTotal}
          expenseTotal={expenseTotal}
          message={message}
          toolbar={toolbar}
          onSelectAccount={setAccountFilter}
          onEdit={setEditingRow}
          onClose={() => setEditingRow(null)}
          onSave={(row) => { if (onSave(row)) setEditingRow(null); }}
          onDelete={(rowId) => { onDelete(rowId); setEditingRow(null); }}
        />
      )}

      {variant === 3 && (
        <MoneyTimeline
          rows={filteredRows}
          allRows={rows}
          editingRow={editingRow}
          accounts={accounts}
          incomeTotal={incomeTotal}
          expenseTotal={expenseTotal}
          message={message}
          toolbar={toolbar}
          onEdit={(row) => setEditingRow((current) => current?.id === row.id ? null : row)}
          onClose={() => setEditingRow(null)}
          onSave={(row) => { if (onSave(row)) setEditingRow(null); }}
          onDelete={(rowId) => { onDelete(rowId); setEditingRow(null); }}
        />
      )}

      {variant === 4 && (
        <CashflowFocus
          rows={filteredRows}
          editingRow={editingRow}
          accounts={accounts}
          incomeTotal={incomeTotal}
          expenseTotal={expenseTotal}
          transferTotal={transferTotal}
          message={message}
          toolbar={toolbar}
          onEdit={setEditingRow}
          onClose={() => setEditingRow(null)}
          onSave={(row) => { if (onSave(row)) setEditingRow(null); }}
          onDelete={(rowId) => { onDelete(rowId); setEditingRow(null); }}
        />
      )}

      {variant === 5 && (
        <ReviewQueue
          rows={filteredRows}
          editingRow={editingRow}
          accounts={accounts}
          incomeTotal={incomeTotal}
          expenseTotal={expenseTotal}
          message={message}
          toolbar={toolbar}
          onEdit={setEditingRow}
          onClose={() => setEditingRow(null)}
          onSave={(row) => { if (onSave(row)) setEditingRow(null); }}
          onDelete={(rowId) => { onDelete(rowId); setEditingRow(null); }}
        />
      )}
    </div>
  );
}

function TransactionToolbar({
  search,
  typeFilter,
  categoryFilter,
  accountFilter,
  categories,
  accounts,
  filtersOpen,
  receiptAction,
  segmented,
  onSearch,
  onTypeFilter,
  onCategoryFilter,
  onAccountFilter,
  onToggleFilters,
  onAdd,
}: {
  search: string;
  typeFilter: string;
  categoryFilter: string;
  accountFilter: string;
  categories: string[];
  accounts: AccountOption[];
  filtersOpen: boolean;
  receiptAction: ReactNode;
  segmented: boolean;
  onSearch: (value: string) => void;
  onTypeFilter: (value: string) => void;
  onCategoryFilter: (value: string) => void;
  onAccountFilter: (value: string) => void;
  onToggleFilters: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="transaction-concept-toolbar">
      {segmented && (
        <div className="transaction-type-tabs" aria-label="Transaction type">
          {[['all', 'All'], ['spending', 'Spending'], ['income', 'Income'], ['transfer', 'Transfers']].map(([value, label]) => (
            <button key={value} type="button" className={typeFilter === value ? "active" : ""} onClick={() => onTypeFilter(value)}>{label}</button>
          ))}
        </div>
      )}
      <label className="transaction-concept-search">
        <Search size={17} aria-hidden="true" />
        <span className="sr-only">Search transactions</span>
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search transactions" />
      </label>
      {!segmented && (
        <select aria-label="Transaction type" value={typeFilter} onChange={(event) => onTypeFilter(event.target.value)}>
          <option value="all">All activity</option>
          <option value="expense">Spending</option>
          <option value="income">Income</option>
          <option value="transfer">Transfers</option>
        </select>
      )}
      <div className="transaction-filter-menu">
        <button type="button" className="transaction-filter-trigger" aria-expanded={filtersOpen} onClick={onToggleFilters}>
          <SlidersHorizontal size={16} aria-hidden="true" /> Filters
        </button>
        {filtersOpen && (
          <div className="transaction-filter-popover">
            <label>
              <span>Category</span>
              <select value={categoryFilter} onChange={(event) => onCategoryFilter(event.target.value)}>
                <option value="all">All categories</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label>
              <span>Account or vault</span>
              <select value={accountFilter} onChange={(event) => onAccountFilter(event.target.value)}>
                <option value="all">All accounts</option>
                {accounts.map((account) => <option key={`${account.kind}-${account.value}`} value={account.value}>{accountName(account)}</option>)}
              </select>
            </label>
          </div>
        )}
      </div>
      <div className="transaction-toolbar-actions">
        {receiptAction}
        <button type="button" className="transaction-add-button" onClick={onAdd}><Plus size={17} aria-hidden="true" /> Add transaction</button>
      </div>
    </div>
  );
}

function CalmLedger({
  rows,
  editingRow,
  accounts,
  incomeTotal,
  expenseTotal,
  transferTotal,
  message,
  toolbar,
  onEdit,
  onClose,
  onSave,
  onDelete,
}: ConceptBodyProps & { transferTotal: number }) {
  return (
    <section className="transaction-concept transaction-calm-ledger" aria-labelledby="calm-ledger-title">
      <header className="transaction-concept-header">
        <div>
          <p className="eyebrow">Layout 1 · Calm Ledger</p>
          <h2 id="calm-ledger-title">A clean register with details on demand</h2>
        </div>
        <TransactionMetrics items={[
          ["Money in", incomeTotal, "good"],
          ["Money out", -expenseTotal, "bad"],
          ["Transfers", transferTotal, "neutral"],
          ["Transactions", rows.length, "count"],
        ]} />
      </header>
      {toolbar}
      <div className={`transaction-ledger-workspace ${editingRow ? "has-editor" : ""}`}>
        <div className="transaction-ledger-list">
          <div className="transaction-ledger-columns" aria-hidden="true">
            <span>Date</span><span>Description</span><span>Category</span><span>Account / movement</span><span>Amount</span>
          </div>
          <TransactionGroups rows={rows} selectedId={editingRow?.id} onEdit={onEdit} />
          {!rows.length && <EmptyTransactions />}
        </div>
        {editingRow && (
          <aside className="transaction-editor-drawer" aria-label="Transaction details">
            <TransactionEditor row={editingRow} accounts={accounts} message={message} onClose={onClose} onSave={onSave} onDelete={onDelete} />
          </aside>
        )}
      </div>
    </section>
  );
}

function AccountLens({
  rows,
  editingRow,
  accounts,
  selectedAccount,
  incomeTotal,
  expenseTotal,
  message,
  toolbar,
  onSelectAccount,
  onEdit,
  onClose,
  onSave,
  onDelete,
}: ConceptBodyProps & { selectedAccount: string; onSelectAccount: (value: string) => void }) {
  return (
    <section className="transaction-concept transaction-account-lens" aria-labelledby="account-lens-title">
      <header className="transaction-concept-header">
        <div>
          <p className="eyebrow">Layout 2 · Account Lens</p>
          <h2 id="account-lens-title">Start with the place the money changed</h2>
        </div>
        <TransactionMetrics items={[
          ["Net activity", incomeTotal - expenseTotal, incomeTotal - expenseTotal >= 0 ? "good" : "bad"],
          ["Money in", incomeTotal, "good"],
          ["Money out", -expenseTotal, "bad"],
        ]} />
      </header>
      <div className="transaction-account-workspace">
        <aside className="transaction-account-rail" aria-label="Accounts and vaults">
          <div className="transaction-account-rail-title"><span>Accounts & vaults</span><small>{accounts.length} places</small></div>
          <button type="button" className={selectedAccount === "all" ? "active" : ""} onClick={() => onSelectAccount("all")}>
            <span><strong>All activity</strong><small>Every account and vault</small></span><ChevronRight size={16} aria-hidden="true" />
          </button>
          {accounts.map((account) => (
            <button key={`${account.kind}-${account.value}`} type="button" className={selectedAccount === account.value ? "active" : ""} onClick={() => onSelectAccount(account.value)}>
              <span><strong>{accountName(account)}</strong><small className={account.balance < 0 ? "negative" : ""}>{account.isNew ? "Ready to use" : formatCurrency(account.balance)}</small></span>
              {account.balance < 0 ? <AlertTriangle size={16} aria-label="Negative balance" /> : <ChevronRight size={16} aria-hidden="true" />}
            </button>
          ))}
        </aside>
        <div className="transaction-account-main">
          {toolbar}
          <div className={`transaction-account-main-grid ${editingRow ? "has-editor" : ""}`}>
            <div className="transaction-ledger-list">
              <TransactionGroups rows={rows} selectedId={editingRow?.id} onEdit={onEdit} compact />
              {!rows.length && <EmptyTransactions />}
            </div>
            {editingRow && (
              <aside className="transaction-editor-drawer" aria-label="Transaction details">
                <TransactionEditor row={editingRow} accounts={accounts} message={message} onClose={onClose} onSave={onSave} onDelete={onDelete} />
              </aside>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MoneyTimeline({
  rows,
  allRows,
  editingRow,
  accounts,
  incomeTotal,
  expenseTotal,
  message,
  toolbar,
  onEdit,
  onClose,
  onSave,
  onDelete,
}: ConceptBodyProps & { allRows: SpreadsheetRow[] }) {
  const attentionRows = allRows.filter((row) => row.cells.category === "Uncategorized" || toNumber(row.cells.shortfallAmount) > 0);
  const negativeAccounts = accounts.filter((account) => account.balance < 0);
  const buckets = timelineBuckets(rows);
  return (
    <section className="transaction-concept transaction-money-timeline" aria-labelledby="money-timeline-title">
      <header className="transaction-concept-header">
        <div>
          <p className="eyebrow">Layout 3 · Money Timeline</p>
          <h2 id="money-timeline-title">July activity <span>Net {formatCurrency(incomeTotal - expenseTotal)}</span></h2>
        </div>
      </header>
      {toolbar}
      <div className="transaction-timeline-workspace">
        <div className="transaction-timeline-list">
          {buckets.map((bucket) => (
            <section key={bucket.label} className="transaction-timeline-group" aria-labelledby={`timeline-${slug(bucket.label)}`}>
              <h3 id={`timeline-${slug(bucket.label)}`}>{bucket.label}</h3>
              {bucket.rows.map((row) => (
                <div key={row.id} className={`transaction-timeline-item ${editingRow?.id === row.id ? "expanded" : ""}`}>
                  <TransactionRow row={row} selected={editingRow?.id === row.id} onEdit={onEdit} timeline />
                  {editingRow?.id === row.id && (
                    <div className="transaction-inline-editor">
                      <TransactionEditor row={editingRow} accounts={accounts} message={message} onClose={onClose} onSave={onSave} onDelete={onDelete} compact />
                    </div>
                  )}
                </div>
              ))}
            </section>
          ))}
          {!rows.length && <EmptyTransactions />}
        </div>
        <aside className="transaction-attention-rail" aria-labelledby="attention-title">
          <div className="transaction-attention-title">
            <h3 id="attention-title">Needs attention</h3>
            <span>{attentionRows.length + negativeAccounts.length}</span>
          </div>
          {attentionRows.slice(0, 3).map((row) => (
            <button key={row.id} type="button" onClick={() => onEdit(row)}>
              <AlertTriangle size={18} aria-hidden="true" />
              <span><strong>{row.cells.description || "Uncategorized transaction"}</strong><small>{row.cells.category === "Uncategorized" ? "Choose a category" : shortfallLabel(row)}</small></span>
              <b>{formatSignedAmount(row)}</b>
            </button>
          ))}
          {negativeAccounts.map((account) => (
            <div key={`${account.kind}-${account.value}`} className="transaction-attention-account">
              <CircleDollarSign size={18} aria-hidden="true" />
              <span><strong>{accountName(account)}</strong><small>Negative balance</small></span>
              <b>{formatCurrency(account.balance)}</b>
            </div>
          ))}
          {!attentionRows.length && !negativeAccounts.length && <p>Everything is categorized and reconciled.</p>}
        </aside>
      </div>
    </section>
  );
}

function CashflowFocus({
  rows,
  editingRow,
  accounts,
  incomeTotal,
  expenseTotal,
  transferTotal,
  message,
  toolbar,
  onEdit,
  onClose,
  onSave,
  onDelete,
}: ConceptBodyProps & { transferTotal: number }) {
  const net = incomeTotal - expenseTotal;
  return (
    <section className="transaction-concept transaction-cashflow-focus" aria-labelledby="cashflow-focus-title">
      <header className="transaction-concept-header transaction-cashflow-heading">
        <div>
          <p className="eyebrow">Layout 4 · Cashflow Focus</p>
          <h2 id="cashflow-focus-title">See the flow, then open one detail</h2>
        </div>
      </header>
      <TransactionMetrics items={[
        ["Money in", incomeTotal, "good"],
        ["Money out", -expenseTotal, "bad"],
        ["Net change", net, net >= 0 ? "good" : "bad"],
        ["Transfers", transferTotal, "neutral"],
      ]} />
      {toolbar}
      <div className="transaction-cashflow-list">
        <TransactionGroups rows={rows} selectedId={editingRow?.id} onEdit={onEdit} compact />
        {!rows.length && <EmptyTransactions />}
      </div>
      {editingRow && (
        <aside className="transaction-bottom-sheet" aria-label="Selected transaction details">
          <TransactionEditor row={editingRow} accounts={accounts} message={message} compact onClose={onClose} onSave={onSave} onDelete={onDelete} />
        </aside>
      )}
    </section>
  );
}

function ReviewQueue({
  rows,
  editingRow,
  accounts,
  incomeTotal,
  expenseTotal,
  message,
  toolbar,
  onEdit,
  onClose,
  onSave,
  onDelete,
}: ConceptBodyProps) {
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const needsReview = rows.filter((row) => !reviewedIds.includes(row.id));
  const current = editingRow || needsReview[0] || rows[0] || null;
  const receipt = current ? receiptSummary(current) : "";
  const currentStatus = current ? shortfallLabel(current) : "";

  function confirmCurrent() {
    if (!current) return;
    setReviewedIds((ids) => ids.includes(current.id) ? ids : [...ids, current.id]);
    if (editingRow?.id === current.id) onClose();
  }

  return (
    <section className="transaction-concept transaction-review-queue" aria-labelledby="review-queue-title">
      <header className="transaction-review-progress">
        <div>
          <p className="eyebrow">Layout 5 · Review Queue</p>
          <h2 id="review-queue-title">{needsReview.length ? `${needsReview.length} transaction${needsReview.length === 1 ? "" : "s"} need review` : "Review queue clear"}</h2>
        </div>
        <span role="progressbar" aria-label="Transaction review progress" aria-valuemin={0} aria-valuemax={Math.max(1, rows.length)} aria-valuenow={reviewedIds.length}>
          <i style={{ width: `${rows.length ? Math.min(100, (reviewedIds.length / rows.length) * 100) : 100}%` }} />
        </span>
      </header>
      {toolbar}
      <div className="transaction-review-workspace">
        <div className="transaction-review-primary">
          {current ? (
            <>
              <div className="transaction-review-card">
                <div className="transaction-review-card-top">
                  <span className={`transaction-row-icon ${transactionType(current)}`} aria-hidden="true">
                    {transactionType(current) === "transfer" ? <ArrowRightLeft size={20} /> : current.cells.salesTax ? <ReceiptText size={20} /> : <CircleDollarSign size={20} />}
                  </span>
                  <div><small>{current.cells.date ? formatDateMDY(current.cells.date) : "No date"}</small><h3>{current.cells.description || current.cells.merchant || "Untitled transaction"}</h3></div>
                  <strong className={transactionType(current)}>{formatSignedAmount(current)}</strong>
                </div>
                {currentStatus && <div className="transaction-review-warning"><AlertTriangle size={18} aria-hidden="true" /><span><strong>{currentStatus}</strong><small>This entry changes the shortfall totals.</small></span></div>}
                <dl>
                  <div><dt>Account</dt><dd>{accountPath(current)}</dd></div>
                  <div><dt>Category</dt><dd>{current.cells.category || "Choose a category"}</dd></div>
                  {receipt && <div><dt>Receipt total</dt><dd>{receipt}</dd></div>}
                  {current.cells.merchant && <div><dt>Merchant</dt><dd>{current.cells.merchant}</dd></div>}
                  {current.cells.notes && <div><dt>Notes</dt><dd>{current.cells.notes}</dd></div>}
                </dl>
                <footer>
                  <button type="button" onClick={() => onEdit(current)}><ArrowLeft size={16} aria-hidden="true" /> Edit details</button>
                  <button type="button" className="transaction-review-confirm" onClick={confirmCurrent}><Check size={16} aria-hidden="true" /> Confirm record</button>
                </footer>
              </div>
              {editingRow?.id === current.id && (
                <div className="transaction-review-editor">
                  <TransactionEditor row={editingRow} accounts={accounts} message={message} compact onClose={onClose} onSave={onSave} onDelete={onDelete} />
                </div>
              )}
            </>
          ) : <EmptyTransactions />}
        </div>
        <aside className="transaction-review-recent" aria-labelledby="recent-cleared-title">
          <div><h3 id="recent-cleared-title">Recent and cleared</h3><small>Net {formatCurrency(incomeTotal - expenseTotal)}</small></div>
          {rows.slice(0, 10).map((row) => (
            <button type="button" key={row.id} onClick={() => onEdit(row)}>
              <span><strong>{row.cells.description || row.cells.merchant || "Untitled transaction"}</strong><small>{accountPath(row)} · {row.cells.date ? formatDateMDY(row.cells.date) : "No date"}</small></span>
              <b className={transactionType(row)}>{formatSignedAmount(row)}</b>
            </button>
          ))}
        </aside>
      </div>
    </section>
  );
}

interface ConceptBodyProps {
  rows: SpreadsheetRow[];
  editingRow: SpreadsheetRow | null;
  accounts: AccountOption[];
  incomeTotal: number;
  expenseTotal: number;
  message: string;
  toolbar: ReactNode;
  onEdit: (row: SpreadsheetRow) => void;
  onClose: () => void;
  onSave: (row: SpreadsheetRow) => void;
  onDelete: (rowId: string) => void;
}

function TransactionMetrics({ items }: { items: Array<[string, number, string]> }) {
  return (
    <div className="transaction-concept-metrics">
      {items.map(([label, value, tone]) => (
        <span key={label} className={tone}>
          <small>{label}</small>
          <strong>{tone === "count" ? value : formatCurrency(value)}</strong>
        </span>
      ))}
    </div>
  );
}

function TransactionGroups({ rows, selectedId, compact = false, onEdit }: { rows: SpreadsheetRow[]; selectedId?: string; compact?: boolean; onEdit: (row: SpreadsheetRow) => void }) {
  return groupRowsByDate(rows).map((group) => (
    <section key={group.date} className="transaction-date-group" aria-labelledby={`date-${slug(group.date)}`}>
      <h3 id={`date-${slug(group.date)}`}>{dateGroupLabel(group.date)}</h3>
      {group.rows.map((row) => <TransactionRow key={row.id} row={row} selected={row.id === selectedId} compact={compact} onEdit={onEdit} />)}
    </section>
  ));
}

function TransactionRow({ row, selected, compact = false, timeline = false, onEdit }: { row: SpreadsheetRow; selected: boolean; compact?: boolean; timeline?: boolean; onEdit: (row: SpreadsheetRow) => void }) {
  const type = transactionType(row);
  const receipt = receiptSummary(row);
  const status = shortfallLabel(row);
  return (
    <button type="button" className={`transaction-simple-row ${selected ? "selected" : ""} ${compact ? "compact" : ""} ${timeline ? "timeline" : ""}`} onClick={() => onEdit(row)}>
      <span className={`transaction-row-icon ${type}`} aria-hidden="true">
        {type === "transfer" ? <ArrowRightLeft size={17} /> : row.cells.salesTax ? <ReceiptText size={17} /> : <CircleDollarSign size={17} />}
      </span>
      <time dateTime={row.cells.date}>{row.cells.date ? formatDateMDY(row.cells.date) : "No date"}</time>
      <span className="transaction-row-main">
        <strong>{row.cells.description || row.cells.merchant || "Untitled transaction"}</strong>
        <small>{receipt || row.cells.merchant || accountPath(row)}</small>
        <small className="transaction-row-mobile-meta">{row.cells.category || "Uncategorized"} · {accountPath(row)}</small>
      </span>
      <span className="transaction-row-category">{row.cells.category || "Uncategorized"}</span>
      <span className="transaction-row-account">{accountPath(row)}</span>
      <span className={`transaction-row-amount ${type}`}>
        <strong>{formatSignedAmount(row)}</strong>
        {status && <small>{status}</small>}
      </span>
      <ChevronRight className="transaction-row-chevron" size={17} aria-hidden="true" />
    </button>
  );
}

function TransactionEditor({ row, accounts, message, compact = false, onClose, onSave, onDelete }: { row: SpreadsheetRow; accounts: AccountOption[]; message: string; compact?: boolean; onClose: () => void; onSave: (row: SpreadsheetRow) => void; onDelete: (rowId: string) => void }) {
  const [draft, setDraft] = useState<SpreadsheetRow>(() => ({
    ...row,
    cells: { ...row.cells, amount: String(Math.abs(toNumber(row.cells.amount)) || "") },
  }));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [validation, setValidation] = useState("");
  const type = transactionType(draft);
  const isNew = row.id.startsWith("concept-transaction-");

  function updateCell(key: string, value: string) {
    setDraft((current) => ({ ...current, cells: { ...current.cells, [key]: value } }));
    setValidation("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const magnitude = Math.abs(toNumber(draft.cells.amount));
    if (!draft.cells.description?.trim()) return setValidation("Add a description.");
    if (!magnitude) return setValidation("Enter an amount greater than $0.");
    if (!draft.cells.date) return setValidation("Choose a date.");
    if (!draft.cells.account) return setValidation("Choose the account the money came from or went to.");
    if (type === "transfer" && !draft.cells.transferDestination) return setValidation("Choose where the transfer went.");
    onSave({
      ...draft,
      cells: {
        ...draft.cells,
        type,
        amount: (type === "income" ? magnitude : -magnitude).toFixed(2),
        transferDestination: type === "transfer" ? draft.cells.transferDestination : "",
        shortfallSource: type === "expense" ? (draft.cells.shortfallSource || "overdraft") : "",
      },
    });
  }

  return (
    <form className={`transaction-detail-editor ${compact ? "compact" : ""}`} onSubmit={submit}>
      <header>
        <div><p className="eyebrow">{isNew ? "New transaction" : "Transaction details"}</p><h3>{draft.cells.description || "Untitled transaction"}</h3></div>
        <button type="button" aria-label="Close transaction details" onClick={onClose}><X size={18} /></button>
      </header>
      <div className="transaction-editor-fields">
        <label><span>Type</span><select value={type} onChange={(event) => updateCell("type", event.target.value)}><option value="expense">Expense</option><option value="income">Income</option><option value="transfer">Transfer</option></select></label>
        <label><span>Date</span><input type="date" value={draft.cells.date || ""} onChange={(event) => updateCell("date", event.target.value)} /></label>
        <label className="wide"><span>Description</span><input value={draft.cells.description || ""} onChange={(event) => updateCell("description", event.target.value)} /></label>
        <label><span>{type === "transfer" ? "From" : "Account"}</span><select value={draft.cells.account || ""} onChange={(event) => updateCell("account", event.target.value)}><option value="">Choose account</option>{accounts.map((account) => <option key={`${account.kind}-${account.value}`} value={account.value}>{accountName(account)}</option>)}</select></label>
        {type === "transfer" && <label><span>To</span><select value={draft.cells.transferDestination || ""} onChange={(event) => updateCell("transferDestination", event.target.value)}><option value="">Choose destination</option>{accounts.map((account) => <option key={`${account.kind}-${account.value}`} value={account.value}>{accountName(account)}</option>)}</select></label>}
        <label><span>Amount</span><input inputMode="decimal" value={draft.cells.amount || ""} onChange={(event) => updateCell("amount", event.target.value)} placeholder="0.00" /></label>
        {type === "expense" && <label><span>If account is short</span><select value={draft.cells.shortfallSource || "overdraft"} onChange={(event) => updateCell("shortfallSource", event.target.value)}><option value="overdraft">Let account go negative</option><option value="borrowed">Borrowed money</option><option value="unreconciled">Unaccounted cash</option></select></label>}
      </div>
      <button type="button" className="transaction-advanced-toggle" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((open) => !open)}>More accounting details <ChevronDown size={16} aria-hidden="true" /></button>
      {advancedOpen && (
        <div className="transaction-editor-fields advanced">
          <label><span>Category</span><input value={draft.cells.category || ""} onChange={(event) => updateCell("category", event.target.value)} /></label>
          <label><span>Merchant</span><input value={draft.cells.merchant || ""} onChange={(event) => updateCell("merchant", event.target.value)} /></label>
          <label><span>Quantity</span><input inputMode="decimal" value={draft.cells.quantity || ""} onChange={(event) => updateCell("quantity", event.target.value)} /></label>
          <label><span>Each</span><input inputMode="decimal" value={draft.cells.unitCost || ""} onChange={(event) => updateCell("unitCost", event.target.value)} /></label>
          <label><span>Sales tax</span><input inputMode="decimal" value={draft.cells.salesTax || ""} onChange={(event) => updateCell("salesTax", event.target.value)} placeholder="Blank when none" /></label>
          <label className="wide"><span>Notes</span><textarea value={draft.cells.notes || ""} onChange={(event) => updateCell("notes", event.target.value)} /></label>
        </div>
      )}
      <p className="transaction-editor-message" role="status">{validation || message}</p>
      <footer>
        {!isNew && <button type="button" className="transaction-delete-button" onClick={() => onDelete(row.id)}><Trash2 size={15} aria-hidden="true" /> Delete</button>}
        <span />
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit" className="transaction-save-button">Save changes</button>
      </footer>
    </form>
  );
}

function EmptyTransactions() {
  return <div className="transaction-concept-empty"><ReceiptText size={22} aria-hidden="true" /><strong>No matching transactions</strong><span>Clear a filter or try another search.</span></div>;
}

function groupRowsByDate(rows: SpreadsheetRow[]) {
  const groups = new Map<string, SpreadsheetRow[]>();
  rows.forEach((row) => {
    const date = row.cells.date || "Undated";
    groups.set(date, [...(groups.get(date) || []), row]);
  });
  return [...groups.entries()].map(([date, groupedRows]) => ({ date, rows: groupedRows }));
}

function timelineBuckets(rows: SpreadsheetRow[]) {
  const today: SpreadsheetRow[] = [];
  const week: SpreadsheetRow[] = [];
  const earlier: SpreadsheetRow[] = [];
  rows.forEach((row) => {
    if (row.cells.date === todayIso()) today.push(row);
    else if (transactionMatchesPeriod(row.cells.date, "week")) week.push(row);
    else earlier.push(row);
  });
  return [
    { label: "Today", rows: today },
    { label: "This week", rows: week },
    { label: "Earlier", rows: earlier },
  ].filter((bucket) => bucket.rows.length);
}

function receiptSummary(row: SpreadsheetRow) {
  const tax = Math.abs(toNumber(row.cells.salesTax));
  if (!tax) return "";
  const total = Math.abs(toNumber(row.cells.amount));
  const subtotal = Math.max(0, total - tax);
  return `${formatCurrency(subtotal)} + ${formatCurrency(tax)} tax = ${formatCurrency(total)}`;
}

function accountPath(row: SpreadsheetRow) {
  return transactionType(row) === "transfer"
    ? `${row.cells.account || "Choose source"} → ${row.cells.transferDestination || "Choose destination"}`
    : row.cells.account || "No account selected";
}

function shortfallLabel(row: SpreadsheetRow) {
  if (toNumber(row.cells.shortfallAmount) <= 0) return "";
  if (row.cells.shortfallSource === "borrowed") return "Borrowed money";
  if (row.cells.shortfallSource === "unreconciled") return "Unaccounted cash";
  return "Account negative";
}

function formatSignedAmount(row: SpreadsheetRow) {
  const amount = signedTransactionAmount(row);
  return `${amount > 0 ? "+" : amount < 0 ? "-" : ""}${formatCurrency(Math.abs(amount))}`;
}

function accountName(account: AccountOption) {
  return account.value.replace(/ · (Account|Vault)(?: \d+)?$/, "");
}

function dateGroupLabel(date: string) {
  if (date === "Undated") return date;
  if (date === todayIso()) return `Today · ${formatDateMDY(date)}`;
  return formatDateMDY(date);
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
