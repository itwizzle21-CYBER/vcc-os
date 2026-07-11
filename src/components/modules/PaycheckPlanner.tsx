import { useState } from "react";
import { formatCurrency, toNumber, weekBounds } from "../../lib/calculations/currency";
import type { AppData, PaycheckHistoryRow, PaycheckPlanner as Planner } from "../../lib/types/app";

export default function PaycheckPlanner({
  data,
  onChange,
}: {
  data: AppData;
  onChange: (data: AppData) => void;
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
    onChange({
      ...data,
      paycheckPlanner: { ...planner, locked: true },
      paycheckHistory: [historyRow, ...data.paycheckHistory.filter((row) => row.payDate !== planner.payDate)],
      sections: { ...data.sections, money: moneyRows },
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

      <div className="history-panel">
        <p className="eyebrow">Paycheck History</p>
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
            <button type="button" onClick={() => updatePlanner({
              paycheckAmount: selected.income,
              payDate: selected.payDate,
              weekStart: selected.weekStart,
              weekEnd: selected.weekEnd,
              spotMeRepayment: selected.spotMe,
              myPayRepayment: selected.myPay,
              locked: false,
            })}>
              Edit/Unlock
            </button>
          </div>
        )}
      </div>
    </section>
  );
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
