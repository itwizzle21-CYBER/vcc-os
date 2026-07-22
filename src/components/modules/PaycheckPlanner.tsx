import { useState } from "react";
import { formatCurrency, formatDateMDY, toNumber, weekBounds } from "../../lib/calculations/currency";
import { eligibleDepositAccounts, lockPaycheckWeek } from "../../lib/engine/paycheckPlannerEngine";
import type { AppData, PaycheckHistoryRow, PaycheckPlanner as Planner } from "../../lib/types/app";
import BufferedTextInput from "../shared/BufferedTextInput";

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
  const [plannerMessage, setPlannerMessage] = useState("");
  const planner = data.paycheckPlanner;
  const depositAccounts = eligibleDepositAccounts(data);
  const remaining = toNumber(planner.paycheckAmount) - toNumber(planner.spotMeRepayment) - toNumber(planner.myPayRepayment);

  function updatePlanner(updates: Partial<Planner>) {
    setPlannerMessage("");
    const next = { ...planner, ...updates };
    if (updates.payDate && !planner.locked) {
      const bounds = weekBounds(updates.payDate);
      next.weekStart = bounds.start;
      next.weekEnd = bounds.end;
    }
    onChange({ ...data, paycheckPlanner: next });
  }

  function lockWeek() {
    try {
      onChange(lockPaycheckWeek(data));
      setPlannerMessage("Paycheck locked. Money Snapshot and Transactions are updated, and the deposit account is ready for savings transfers.");
    } catch (error) {
      setPlannerMessage(error instanceof Error ? error.message : "The paycheck could not be locked.");
    }
  }

  return (
    <section className="planner-panel">
      <div className="planner-form">
        <div>
          <p className="eyebrow">Current Week Planner</p>
          <h2>Weekly Paycheck</h2>
        </div>
        <PlannerInput label="Income Source" value={planner.incomeSource} disabled={planner.locked} onChange={(value) => updatePlanner({ incomeSource: value })} />
        <PlannerSelect label="Deposit To" value={planner.depositAccountId} disabled={planner.locked} onChange={(value) => updatePlanner({ depositAccountId: value })} options={depositAccounts.map((row) => ({ value: row.id, label: `${row.cells.label} · ${formatCurrency(toNumber(row.cells.amount))}` }))} />
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
        {plannerMessage && <p className="planner-message" role="status">{plannerMessage}</p>}
      </div>

      {showHistory && (
        <div className="history-panel">
          <p className="eyebrow">Payment History</p>
          <div className="history-list">
            {data.paycheckHistory.map((row) => (
              <button type="button" key={row.id} onClick={() => setSelected(row)}>
                <span>{formatDateMDY(row.payDate)}</span>
                <strong>{formatCurrency(toNumber(row.income))}</strong>
                <small>{row.incomeSource || "Income source not recorded"} · {formatCurrency(toNumber(row.remaining))} remaining</small>
              </button>
            ))}
            {data.paycheckHistory.length === 0 && <p className="empty-copy">No locked weeks yet.</p>}
          </div>
          {selected && (
            <div className="week-detail">
              <h3>Week Detail</h3>
              <p>Income Source: {selected.incomeSource || "Not recorded"}</p>
              <p>Deposited To: {selected.depositAccountLabel || "Not recorded"}</p>
              <p>Paycheck: {formatCurrency(toNumber(selected.income))}</p>
              <p>SpotMe: {formatCurrency(toNumber(selected.spotMe))}</p>
              <p>MyPay: {formatCurrency(toNumber(selected.myPay))}</p>
              <p>Remaining: {formatCurrency(toNumber(selected.remaining))}</p>
              <p>
                {formatDateMDY(selected.weekStart)} to {formatDateMDY(selected.weekEnd)}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function PlannerSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <label>
      <span>{label}</span>
      <select aria-label={label} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} required>
        <option value="">Select card or account</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
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
  const isLockedDate = type === "date" && disabled;

  return (
    <label>
      <span>{label}</span>
      <BufferedTextInput
        type={isLockedDate ? "text" : type}
        aria-label={label}
        className={type === "date" ? "calendar-input" : undefined}
        value={isLockedDate ? formatDateMDY(value) : value}
        disabled={disabled}
        onValueChange={onChange}
        delay={280}
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
