import { PageHeader } from "../shared/PageHeader";
import { SpreadsheetGrid } from "../shared/SpreadsheetGrid";
import { money } from "../../lib/calculations/helpers";
import type { Metrics, Section, SectionKey } from "../../lib/types/vcc";

export type ModulePageProps = {
  section: Section;
  updateCell: (sectionKey: SectionKey, rowIndex: number, column: string, value: string) => void;
  addRow: (sectionKey: SectionKey) => void;
  deleteRow: (sectionKey: SectionKey, rowIndex: number) => void;
  resetSection: (sectionKey: SectionKey) => void;
  metrics: Metrics;
  back: () => void;
};

export function ModulePage({
  section,
  updateCell,
  addRow,
  deleteRow,
  resetSection,
  metrics,
  back,
}: ModulePageProps) {
  const summaryItems = getModuleSummaryItems(section.key, metrics);

  return (
    <section className="content toolPage">
      <PageHeader title={section.label} subtitle={section.subtitle} back={back} />

      <div className="decisionStrip">
        <span>{section.label} workspace</span>
        <strong>{section.rows.length} rows</strong>
      </div>

      <div className="summaryCards">
        {summaryItems.map((item) => (
          <div key={item.label} className="summaryCard">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="actions spreadsheetToolbar">
        <button type="button" className="secondary" onClick={() => resetSection(section.key)}>Reset page</button>
        <button type="button" className="primary" onClick={() => addRow(section.key)}>Add row</button>
      </div>

      <SpreadsheetGrid section={section} metrics={metrics} updateCell={updateCell} deleteRow={deleteRow} />
    </section>
  );
}

function getModuleSummaryItems(sectionKey: SectionKey, metrics: Metrics) {
  switch (sectionKey) {
    case "money":
      return [
        { label: "Spendable", value: money(metrics.spendableCash) },
        { label: "Operating", value: money(metrics.operatingCash) },
        { label: "Borrowed", value: money(metrics.borrowedMoney) },
      ];
    case "bills":
      return [
        { label: "Unpaid", value: String(metrics.unpaidBills) },
        { label: "Overdue", value: String(metrics.overdueBills) },
        { label: "Pressure", value: money(metrics.billsPressure) },
      ];
    case "income":
      return [
        { label: "Weekly", value: money(metrics.weeklyIncome) },
        { label: "Other", value: money(metrics.otherIncome) },
        { label: "Combined", value: money(metrics.weeklyIncome + metrics.otherIncome) },
      ];
    case "budget":
      return [
        { label: "Planned", value: money(metrics.budgetPlanned) },
        { label: "Actual", value: money(metrics.budgetActual) },
        { label: "Remaining", value: money(metrics.budgetRemaining) },
      ];
    case "transactions":
      return [
        { label: "Net", value: money(metrics.transactionNet) },
        { label: "Cash", value: money(metrics.cashOnHand) },
        { label: "Spendable", value: money(metrics.spendableCash) },
      ];
    case "debt":
      return [
        { label: "Balance", value: money(metrics.totalDebtBalance) },
        { label: "Active", value: String(metrics.activeDebt) },
        { label: "Pressure", value: money(metrics.debtPressure) },
      ];
    case "savings":
      return [
        { label: "Protected", value: money(metrics.protectedSavings) },
        { label: "Vault", value: money(metrics.savingsVault) },
        { label: "Allowed Pull", value: money(metrics.allowedWithdrawal) },
      ];
    case "inventory":
      return [
        { label: "Critical", value: String(metrics.criticalInventory) },
        { label: "Buy Next", value: metrics.buyNext || "Clear" },
        { label: "Cash", value: money(metrics.spendableCash) },
      ];
    case "buyNext":
      return [
        { label: "Open", value: String(metrics.criticalInventory) },
        { label: "Next", value: metrics.buyNext || "Clear" },
        { label: "Spendable", value: money(metrics.spendableCash) },
      ];
    case "activity":
      return [
        { label: "Open", value: String(metrics.activityCount) },
        { label: "Alerts", value: String(metrics.criticalInventory + metrics.overdueBills) },
        { label: "Net", value: money(metrics.netPosition) },
      ];
    case "goals":
      return [
        { label: "Progress", value: `${metrics.avgGoalProgress}%` },
        { label: "Protected", value: money(metrics.protectedSavings) },
        { label: "Spendable", value: money(metrics.spendableCash) },
      ];
    case "missions":
      return [
        { label: "Open", value: String(metrics.openMissions) },
        { label: "Alerts", value: String(metrics.criticalInventory + metrics.overdueBills) },
        { label: "Net", value: money(metrics.netPosition) },
      ];
    case "alerts":
      return [];
  }
}
