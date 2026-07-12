import { useState } from "react";
import { formatCurrency, toNumber, weekBounds } from "../../lib/calculations/currency";
import type { AppData, PaycheckHistoryRow, PaycheckPlanner as Planner, SpreadsheetRow } from "../../lib/types/app";

export default function PaycheckPlanner({
  data,
  onChange,
  showHistory = true,
}: {
  data: AppData;
  onChange: (data: AppData) => void;
  showHistory?: boolean;
}) {
  const [selected, setSelected] = useState<PaycheckHistoryRow | null>(null);
  const planner = data.paycheckPlanner;
  const remaining = toNumber(planner.paycheckAmount) - toNumber(planner.spotMeRepayment) - toNumber(planner.myPayRepayment);

  function updatePlanner(updates: Partial<Planner>) {
    const next = { ...planner, ...updates };
    if (updates.payDate && !planner.locked) {
      const bounds = weekBounds(updates.payDate);
      next.weekStart = bounds.start;
      next.weekEnd = bounds.end;
    }
    onChange({ ...data, paycheckPlanner: next });
  }

  function lockWeek() {
    const historyRow: PaycheckHistoryRow = {
      id: `paycheck-${planner.payDate}-${Date.now()}`,
      payDate: planner.payDate,
      income: planner.paycheckAmount,
      spotMe: planner.spotMeRepayment,
      myPay: planner.myPayRepayment,
      remaining: String(remaining),
      weekStart: planner.weekStart,
      weekEnd: planner.weekEnd,
      locked: true,
    };
    const moneyRows = data.sections.money.map((row) => {
      if (row.cells.weekStart || row.cells.weekEnd) return row;
      return { ...row, cells: { ...row.cells, weekStart: planner.weekStart, weekEnd: planner.weekEnd } };
    });
    const snapshotTransactionIds = moneySnapshotTransactionIds(planner);
    const snapshotTransactions = buildMoneySnapshotTransactions(planner);
    onChange({
      ...data,
      paycheckPlanner: { ...planner, locked: true },
      paycheckHistory: [historyRow, ...data.paycheckHistory.filter((row) => row.payDate !== planner.payDate)],
      sections: {
        ...data.sections,
        money: moneyRows,
        transactions: [
          ...snapshotTransactions,
          ...data.sections.transactions.filter((row) => !snapshotTransactionIds.has(row.id)),
        ],
      },
    });
  }

  return (
    <section className="planner-panel">
      <div className="planner-form">
        <div>
          <p className="eyebrow">Current Week Planner</p>
          <h2>Weekly Paycheck</h2>
        </div>
        <PlannerInput label="Paycheck Amount" value={planner.paycheckAmount} disabled={planner.locked} onChange={(value) => updatePlanner({ paycheckAmount: value })} />
        <PlannerInput label="Pay Date" type="date" value={planner.payDate} disabled={planner.locked} onChange={(value) => updatePlanner({ payDate: value })} />
        <PlannerInput label="Week Start" type="date" value={planner.weekStart} disabled={planner.locked} onChange={(value) => updatePlanner({ weekStart: value })} />
        <PlannerInput label="Week End" type="date" value={planner.weekEnd} disabled={planner.locked} onChange={(value) => updatePlanner({ weekEnd: value })} />
        <PlannerInput label="SpotMe Repayment" value={planner.spotMeRepayment} disabled={planner.locked} onChange={(value) => updatePlanner({ spotMeRepayment: value })} />
        <PlannerInput label="MyPay Repayment" value={planner.myPayRepayment} disabled={planner.locked} onChange={(value) => updatePlanner({ myPayRepayment: value })} />
        <div className="planner-result">
          <span>Remaining After Repayment</span>
          <strong>{formatCurrency(remaining)}</strong>
        </div>
        {planner.locked ? (
          <button type="button" onClick={() => updatePlanner({ locked: false })}>
            Unlock/Edit
          </button>
        ) : (
          <button type="button" onClick={lockWeek}>
            Enable / Lock Week
          </button>
        )}
      </div>

      {showHistory && (
        <div className="history-panel">
          <p className="eyebrow">Payment History</p>
          <div className="history-list">
            {data.paycheckHistory.map((row) => (
              <button type="button" key={row.id} onClick={() => setSelected(row)}>
                <span>{row.payDate}</span>
                <strong>{formatCurrency(toNumber(row.income))}</strong>
                <small>{formatCurrency(toNumber(row.remaining))} remaining</small>
              </button>
            ))}
            {data.paycheckHistory.length === 0 && <p className="empty-copy">No locked weeks yet.</p>}
          </div>
          {selected && (
            <div className="week-detail">
              <h3>Week Detail</h3>
              <p>Paycheck: {formatCurrency(toNumber(selected.income))}</p>
              <p>SpotMe: {formatCurrency(toNumber(selected.spotMe))}</p>
              <p>MyPay: {formatCurrency(toNumber(selected.myPay))}</p>
              <p>Remaining: {formatCurrency(toNumber(selected.remaining))}</p>
              <p>
                {selected.weekStart} to {selected.weekEnd}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function buildMoneySnapshotTransactions(planner: Planner): SpreadsheetRow[] {
  const rows = [
    moneySnapshotTransaction(planner, "income", "Money Snapshot Paycheck", "income", "Income", planner.paycheckAmount),
    moneySnapshotTransaction(planner, "spotme", "SpotMe Repayment", "expense", "Debt Payments", negativeAmount(planner.spotMeRepayment)),
    moneySnapshotTransaction(planner, "mypay", "MyPay Repayment", "expense", "Debt Payments", negativeAmount(planner.myPayRepayment)),
  ];
  return rows.filter((row) => toNumber(row.cells.amount) !== 0);
}

function moneySnapshotTransaction(
  planner: Planner,
  idSuffix: string,
  description: string,
  type: string,
  category: string,
  amount: string
): SpreadsheetRow {
  const weekLabel = planner.weekStart && planner.weekEnd ? `${planner.weekStart} to ${planner.weekEnd}` : "locked week";
  return {
    id: moneySnapshotTransactionId(planner, idSuffix),
    cells: {
      description,
      type,
      category,
      amount,
      date: planner.payDate,
      account: "Money Snapshot",
      recurring: "No",
      notes: `[Money Snapshot] ${weekLabel}`,
    },
  };
}

function moneySnapshotTransactionIds(planner: Planner): Set<string> {
  return new Set(["income", "spotme", "mypay"].map((suffix) => moneySnapshotTransactionId(planner, suffix)));
}

function moneySnapshotTransactionId(planner: Planner, suffix: string): string {
  const key = planner.payDate || planner.weekStart || "current";
  return `money-snapshot-${key.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}-${suffix}`;
}

function negativeAmount(value: string): string {
  const amount = Math.abs(toNumber(value));
  return amount ? String(-amount) : "";
}

function PlannerInput({
  label,
  value,
  onChange,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        type={type}
        className={type === "date" ? "calendar-input" : undefined}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onClick={(event) => {
          if (type === "date" && !disabled) openDatePicker(event.currentTarget);
        }}
      />
    </label>
  );
}

function openDatePicker(input: HTMLInputElement) {
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      // Native focus still exposes the browser date picker if showPicker is blocked.
    }
  }
}
