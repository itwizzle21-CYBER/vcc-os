import { useState } from "react";
import { layoutViewClass } from "../layout/LayoutViews";
import SummaryGrid from "../shared/SummaryGrid";
import { formatCurrency, isBlankRow, toNumber } from "../../lib/calculations/currency";
import { transactionType } from "../../lib/engine/transactionEngine";
import type { LayoutView, SpreadsheetRow } from "../../lib/types/app";

type ReportPeriod = "weekly" | "monthly" | "yearly" | "all";

const reportPeriods = [
  ["weekly", "Weekly"],
  ["monthly", "Monthly"],
  ["yearly", "Yearly"],
  ["all", "All Time"],
] as const satisfies ReadonlyArray<readonly [ReportPeriod, string]>;

type ReportsPageProps = {
  layoutView: LayoutView;
  transactions: SpreadsheetRow[];
};

export default function ReportsPage({ layoutView, transactions: rows }: ReportsPageProps) {
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const transactions = rows.filter((row) => !isBlankRow(row.cells));
  const filteredTransactions = transactions.filter((row) => period === "all" || transactionDateMatchesReport(row.cells.date, period));
  const incomeRows = filteredTransactions.filter((row) => transactionType(row) === "income");
  const expenseRows = filteredTransactions.filter((row) => transactionType(row) === "expense");
  const totalIncome = incomeRows.reduce((sum, row) => sum + Math.abs(toNumber(row.cells.amount)), 0);
  const totalExpenses = expenseRows.reduce((sum, row) => sum + Math.abs(toNumber(row.cells.amount)), 0);
  const cashFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((cashFlow / totalIncome) * 100) : 0;
  const categoryData = buildCategoryReport(expenseRows);
  const trendData = buildTrendReport(filteredTransactions, period);
  const trendMax = Math.max(1, ...trendData.flatMap((item) => [item.income, item.expenses]));
  const forecast = buildForecast(cashFlow, period);
  const forecastMax = Math.max(1, ...forecast.map((item) => Math.abs(item.balance)));
  const monthlyProjection = projectedMonthlyCashFlow(cashFlow, period);
  const reportSummary = [
    { label: "Income", value: totalIncome },
    { label: "Expenses", value: totalExpenses, tone: "bad" as const },
    { label: "Cash Flow", value: cashFlow, tone: cashFlow >= 0 ? undefined : "bad" as const },
    { label: "Savings Rate", value: `${savingsRate}%` },
  ];

  return (
    <div className={`reports-page ${layoutViewClass(layoutView)}`} data-layout-view={layoutView}>
      <section className="reports-command-panel">
        <div>
          <p className="eyebrow">Reports</p>
          <h2>Visual analytics for your finances</h2>
        </div>
        <div className="reports-period-tabs" role="group" aria-label="Report period">
          {reportPeriods.map(([value, label]) => (
            <button key={value} type="button" className={period === value ? "active" : ""} aria-pressed={period === value} onClick={() => setPeriod(value)}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <SummaryGrid items={reportSummary} />

      {transactions.length === 0 ? (
        <section className="panel report-empty-state">
          <p className="eyebrow">No Data Yet</p>
          <h2>Add transactions to unlock reports</h2>
          <p className="empty-copy">Reports stay empty until your transaction spreadsheet has real rows.</p>
          <a href="/transactions" className="report-link">Open Transactions</a>
        </section>
      ) : (
        <section className="reports-grid report-analytics-grid">
          <article className="panel report-card report-card-wide">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Cash Flow Trend</p>
                <h2>Income and expenses</h2>
              </div>
              <a href="/transactions" className="report-link">Transactions</a>
            </div>
            <figure className="report-chart-figure">
              <ReportLineChart data={trendData} max={trendMax} />
              <figcaption>{cashFlow >= 0 ? `You kept ${formatCurrency(cashFlow)} after expenses.` : `Expenses exceeded income by ${formatCurrency(Math.abs(cashFlow))}.`}</figcaption>
              <table className="visually-hidden"><caption>Cash flow trend data</caption><thead><tr><th>Period</th><th>Income</th><th>Expenses</th></tr></thead><tbody>{trendData.map((item) => <tr key={item.label}><th>{item.label}</th><td>{formatCurrency(item.income)}</td><td>{formatCurrency(item.expenses)}</td></tr>)}</tbody></table>
            </figure>
          </article>

          <article className="panel report-card report-category-card">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Spending By Category</p>
                <h2>Where money is going</h2>
              </div>
              <a href="/transactions" className="report-link">Open</a>
            </div>
            <div className="report-category-chart">
              {categoryData.length ? categoryData.slice(0, 8).map((category) => (
                <div key={category.label}>
                  <span>{category.label}</span>
                  <strong>{formatCurrency(category.amount)}</strong>
                  <b style={{ width: `${(category.amount / Math.max(1, categoryData[0].amount)) * 100}%` }} />
                  <small>{totalExpenses > 0 ? Math.round((category.amount / totalExpenses) * 100) : 0}% of spend</small>
                </div>
              )) : <p className="empty-copy">No expense data in this period.</p>}
            </div>
          </article>

          <article className="panel report-card report-forecast-card">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">12-Month Forecast</p>
                <h2>Projected change</h2>
              </div>
              <span className="report-pill">{formatCurrency(projectedMonthlyCashFlow(cashFlow, period))}/mo</span>
            </div>
            <ForecastLineChart data={forecast} max={forecastMax} />
            <p className="report-chart-caption"><strong>{formatCurrency(monthlyProjection * 12)}</strong> projected over 12 months.</p>
            <table className="visually-hidden"><caption>12-month cash flow forecast</caption><thead><tr><th>Month</th><th>Projected balance</th></tr></thead><tbody>{forecast.map((item) => <tr key={item.label}><th>{item.label}</th><td>{formatCurrency(item.balance)}</td></tr>)}</tbody></table>
          </article>
        </section>
      )}
    </div>
  );
}

export function transactionDateMatchesReport(dateText: string, period: ReportPeriod): boolean {
  if (!dateText) return false;
  const date = new Date(`${dateText}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  if (period === "weekly") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return date >= weekAgo && date <= now;
  }
  if (period === "monthly") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  if (period === "yearly") return date.getFullYear() === now.getFullYear();
  return true;
}

export function buildCategoryReport(rows: SpreadsheetRow[]): Array<{ label: string; amount: number }> {
  return Object.entries(
    rows.reduce<Record<string, number>>((acc, row) => {
      const category = row.cells.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + Math.abs(toNumber(row.cells.amount));
      return acc;
    }, {}),
  )
    .map(([label, amount]) => ({ label: titleCase(label.replace(/_/g, " ")), amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildTrendReport(rows: SpreadsheetRow[], period: ReportPeriod): Array<{ label: string; income: number; expenses: number }> {
  const buckets = rows.reduce<Record<string, { label: string; income: number; expenses: number; order: number }>>((acc, row) => {
    if (!row.cells.date) return acc;
    const date = new Date(`${row.cells.date}T12:00:00`);
    if (Number.isNaN(date.getTime())) return acc;
    const label = reportBucketLabel(date, period);
    const order = reportBucketOrder(date, period);
    if (!acc[label]) acc[label] = { label, income: 0, expenses: 0, order };
    if (transactionType(row) === "income") acc[label].income += Math.abs(toNumber(row.cells.amount));
    if (transactionType(row) === "expense") acc[label].expenses += Math.abs(toNumber(row.cells.amount));
    return acc;
  }, {});
  return Object.values(buckets).sort((a, b) => a.order - b.order);
}

function reportBucketLabel(date: Date, period: ReportPeriod): string {
  if (period === "weekly") return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (period === "monthly") return `Week ${Math.ceil(date.getDate() / 7)}`;
  return date.toLocaleDateString("en-US", { month: "short" });
}

function reportBucketOrder(date: Date, period: ReportPeriod): number {
  if (period === "weekly") return date.getTime();
  if (period === "monthly") return Math.ceil(date.getDate() / 7);
  return date.getMonth();
}

export function projectedMonthlyCashFlow(cashFlow: number, period: ReportPeriod): number {
  const months = period === "yearly" ? 12 : period === "monthly" ? 1 : period === "weekly" ? 0.25 : 12;
  return months > 0 ? cashFlow / months : 0;
}

export function buildForecast(cashFlow: number, period: ReportPeriod): Array<{ label: string; balance: number }> {
  const monthly = projectedMonthlyCashFlow(cashFlow, period);
  const now = new Date();
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index + 1, 1);
    return { label: date.toLocaleDateString("en-US", { month: "short" }), balance: monthly * (index + 1) };
  });
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function chartPoints(values: number[], max: number): string {
  return values.map((value, index) => `${42 + (values.length <= 1 ? 264 : (index / (values.length - 1)) * 528)},${180 - (value / Math.max(1, max)) * 162}`).join(" ");
}

function ReportLineChart({ data, max }: { data: Array<{ label: string; income: number; expenses: number }>; max: number }) {
  if (!data.length) return <p className="empty-copy">No transactions in this period.</p>;
  const incomePoints = chartPoints(data.map((item) => item.income), max);
  const expensePoints = chartPoints(data.map((item) => item.expenses), max);
  const last = data[data.length - 1];
  const lastX = data.length <= 1 ? 306 : 570;
  return <svg className="report-svg-chart" viewBox="0 0 600 220" role="img" aria-label="Income and expense trend lines">
    <line x1="42" y1="180" x2="570" y2="180" className="chart-axis" />
    <polyline points={incomePoints} className="chart-line income" />
    <polyline points={expensePoints} className="chart-line expense" />
    {data.map((item, index) => { const x = 42 + (data.length <= 1 ? 264 : (index / (data.length - 1)) * 528); return <g key={item.label}><circle cx={x} cy={180 - (item.income / max) * 162} r="4" className="chart-dot income" /><circle cx={x} cy={180 - (item.expenses / max) * 162} r="4" className="chart-dot expense" /><text x={x} y="205" textAnchor="middle">{item.label}</text></g>; })}
    <text x={lastX - 6} y={Math.max(13, 174 - (last.income / max) * 162)} textAnchor="end" className="chart-direct-label income">Income</text>
    <text x={lastX - 6} y={Math.min(176, 194 - (last.expenses / max) * 162)} textAnchor="end" className="chart-direct-label expense">Expenses</text>
  </svg>;
}

function ForecastLineChart({ data, max }: { data: Array<{ label: string; balance: number }>; max: number }) {
  const points = data.map((item, index) => `${42 + (index / Math.max(1, data.length - 1)) * 528},${item.balance >= 0 ? 110 - (item.balance / max) * 82 : 110 + (Math.abs(item.balance) / max) * 82}`).join(" ");
  const last = data[data.length - 1];
  const lastY = last ? last.balance >= 0 ? 110 - (last.balance / max) * 82 : 110 + (Math.abs(last.balance) / max) * 82 : 110;
  return <svg className="report-svg-chart forecast" viewBox="0 0 600 220" role="img" aria-label="Cumulative 12-month cash flow projection">
    <line x1="42" y1="110" x2="570" y2="110" className="chart-axis zero" /><polyline points={points} className={`chart-line ${data[0]?.balance >= 0 ? "income" : "expense"}`} />
    {data.map((item, index) => { const x = 42 + (index / Math.max(1, data.length - 1)) * 528; const y = item.balance >= 0 ? 110 - (item.balance / max) * 82 : 110 + (Math.abs(item.balance) / max) * 82; return <g key={item.label}><circle cx={x} cy={y} r="3.5" className={`chart-dot ${item.balance >= 0 ? "income" : "expense"}`} />{(index === 0 || index === 5 || index === 11) && <text x={x} y="207" textAnchor="middle">{item.label}</text>}</g>; })}
    {last && <text x="562" y={Math.max(16, Math.min(196, lastY - 10))} textAnchor="end" className={`chart-direct-label ${last.balance >= 0 ? "income" : "expense"}`}>{formatCurrency(last.balance)}</text>}
  </svg>;
}
