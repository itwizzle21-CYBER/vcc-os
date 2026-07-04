import {
  applyDerivedRow,
  getInventoryBuyNextRows,
  isOverdue,
  isPaid,
  levelWeight,
  money,
  number,
} from "../calculations/helpers";
import type {
  Alert,
  DecisionEngineState,
  FinancialState,
  HealthStatus,
  RecommendedMove,
  Row,
  Section,
  SectionKey,
} from "../types/vcc";

export function computeDecisionEngine(financialState: FinancialState, data: Section[]): DecisionEngineState {
  const metrics = financialState.metrics;
  const alerts: Alert[] = [];
  const bills = getSection(data, "bills");
  const inventory = getSection(data, "inventory");
  const buyNext = getSection(data, "buyNext");
  const goals = getSection(data, "goals");

  const normalizedBills = bills.rows
    .filter((row) => hasAnyValue(row, ["Bill", "Due Date", "Amount", "Status"]))
    .map((row) => applyDerivedRow("bills", row));
  const unpaidBills = normalizedBills.filter((row) => !isPaid(row.Status));
  const overdueBills = unpaidBills.filter((row) => isOverdue(row["Due Date"]) || (row.Status ?? "").toLowerCase() === "overdue");
  const carOverdue = overdueBills.find((row) => /car|auto|vehicle|transport/i.test(row.Bill ?? ""));
  const phoneOverdue = overdueBills.find((row) => /phone|mobile|cell/i.test(row.Bill ?? ""));
  const dueSoonBills = unpaidBills.filter((row) => daysUntil(row["Due Date"]) !== null && daysUntil(row["Due Date"])! <= 3 && !isOverdue(row["Due Date"]));

  if (carOverdue) {
    alerts.push({
      title: `${carOverdue.Bill || "Car payment"} is overdue`,
      source: "bills",
      level: "Critical",
      proof: `${carOverdue.Bill || "Car payment"} is overdue for ${money(number(carOverdue.Amount))}.`,
      action: "Protect transportation and income before lower-impact pressure.",
    });
  }

  if (phoneOverdue) {
    alerts.push({
      title: `${phoneOverdue.Bill || "Phone"} is overdue`,
      source: "bills",
      level: "High",
      proof: `${phoneOverdue.Bill || "Phone"} is overdue for ${money(number(phoneOverdue.Amount))}.`,
      action: "Protect communication access and update the bill status after action.",
    });
  }

  dueSoonBills.forEach((row) => {
    alerts.push({
      title: `${row.Bill || "Bill"} is due soon`,
      source: "bills",
      level: "High",
      proof: `${row.Bill || "Bill"} is due within 3 days for ${money(number(row.Amount))}.`,
      action: "Plan the payment before it becomes overdue.",
    });
  });

  overdueBills
    .filter((row) => row !== carOverdue && row !== phoneOverdue)
    .forEach((row) => {
      alerts.push({
        title: `${row.Bill || "Bill"} needs bill action`,
        source: "bills",
        level: "Critical",
        proof: `${row.Bill || "Bill"} is ${row["Auto Alert"] || row.Status || "critical"} for ${money(number(row.Amount))}.`,
        action: "Pay, negotiate, or mark the bill with the true status today.",
      });
    });

  if (metrics.unpaidBills > 0) {
    alerts.push({
      title: "Unpaid bills are creating pressure",
      source: "bills",
      level: metrics.unpaidBills >= 3 ? "Critical" : "High",
      proof: `${metrics.unpaidBills} unpaid bill(s). Bill pressure: ${money(metrics.billsPressure)}.`,
      action: "Decide what gets paid now, delayed, or watched.",
    });
  }

  if (metrics.activeDebt > 0) {
    alerts.push({
      title: "Active debt is eating future cash",
      source: "debt",
      level: metrics.debtBlocksCash > 0 ? "Critical" : "High",
      proof: `${metrics.activeDebt} active debt item(s). Payment pressure: ${money(metrics.debtPressure)}. Current balance: ${money(metrics.totalDebtBalance)}.`,
      action: "Update balances and attack the debt that blocks the next check.",
    });
  }

  if (metrics.borrowedMoney > 0) {
    alerts.push({
      title: "Borrowed money is reducing safety",
      source: "debt",
      level: "High",
      proof: `Advances or borrowed-money rows total ${money(metrics.borrowedMoney)}.`,
      action: "Treat advances as pressure before calling cash safe.",
    });
  }

  if (metrics.savingsVault <= 0) {
    alerts.push({
      title: "No savings buffer yet",
      source: "savings",
      level: "High",
      proof: "Savings Vault is currently zero.",
      action: "Build even a small emergency buffer after survival pressure is handled.",
    });
  }

  getInventoryBuyNextRows(inventory.rows).forEach((row) => {
    const alert = (row.Alert ?? "").toLowerCase();
    alerts.push({
      title: `${row.Item || "Inventory item"} needs attention`,
      source: "inventory",
      level: alert === "critical" ? "Critical" : "High",
      proof: `${row.Item || "Item"} is marked ${row.Alert || "Low"} in ${row.Category || "inventory"}.`,
      action: "Buy Next: handle this first if spendable cash allows it.",
    });
  });

  buyNext.rows
    .filter((row) => {
      const status = (row.Status ?? "").toLowerCase();
      return (row.Item ?? "").trim() && !["done", "closed", "bought", "handled"].includes(status);
    })
    .forEach((row) => {
      const priority = (row.Priority ?? "").toLowerCase();
      alerts.push({
        title: `${row.Item || "Buy Next item"} is open`,
        source: "buyNext",
        level: priority === "critical" ? "Critical" : priority === "low" ? "Medium" : "High",
        proof: `${row.Item || "Item"} is listed in Buy Next${row["Estimated Cost"] ? ` for ${money(number(row["Estimated Cost"]))}` : ""}.`,
        action: "Decide whether to buy, delay, or close this item before adding new spending.",
      });
    });

  goals.rows.filter((row) => hasAnyValue(row, ["Goal", "Target", "Current", "Progress %", "Next Step"])).forEach((row) => {
    const priority = (row.Priority ?? "").toLowerCase();
    const progress = number(row["Progress %"]);
    if (priority === "high" && progress < 25) {
      alerts.push({
        title: `${row.Goal || "Goal"} is behind`,
        source: "goals",
        level: "High",
        proof: `${row.Goal || "Goal"} is high priority but only ${progress}% complete.`,
        action: "Set the next small step or adjust the goal.",
      });
    }
  });

  if (financialState.goals.goalProgress > 0) {
    alerts.push({
      title: "Goals are funded",
      source: "goals",
      level: "Medium",
      proof: `Goal progress is ${financialState.goals.goalProgress}%.`,
      action: "Keep funding progress visible and current.",
    });
  }

  const priorityAlerts = alerts.sort((a, b) => levelWeight(b.level) - levelWeight(a.level));
  const recommendedMove = getRecommendedMove(financialState, priorityAlerts, { overdueBills, carOverdue, phoneOverdue });

  return {
    todayMission: priorityAlerts[0],
    recommendedMove,
    priorityAlerts,
    missionStack: priorityAlerts,
    financialStatus: getHealthStatus(financialState.health.financialHealthScore),
    protectionStatus: financialState.money.protectedSavings > 0 ? "Savings Protected" : "Savings Unprotected",
    cashStatus: financialState.money.spendableCash < 0 ? "Cash Negative" : "Cash Stable",
    debtStatus: financialState.debt.remainingDebt > 0 ? "Debt Active" : "Debt Clear",
    inventoryStatus: financialState.inventory.criticalItems > 0 ? "Inventory Critical" : "Inventory Stable",
    savingsStatus: financialState.money.protectedSavings > 0 ? "Savings Protected" : "Savings Needed",
  };
}

function getRecommendedMove(
  financialState: FinancialState,
  alerts: Alert[],
  bills: { overdueBills: Row[]; carOverdue: Row | undefined; phoneOverdue: Row | undefined }
): RecommendedMove {
  const metrics = financialState.metrics;
  const oldestOverdueBill = [...bills.overdueBills].sort((a, b) => String(a["Due Date"] ?? "").localeCompare(String(b["Due Date"] ?? "")))[0];

  if (metrics.foodNeeded <= 0) {
    return {
      title: "Get food money first",
      why: "Food money is not confirmed in Money Snapshot.",
      doFirst: "Open Money Snapshot and secure food money before any lower-priority move.",
      doNotDo: "Do not spend on wants while food money is missing.",
      checkpoint: "Update Food Needed once food money is handled.",
      source: "money",
      tone: "danger",
    };
  }

  if (oldestOverdueBill) {
    return {
      title: "Pay oldest overdue bill",
      why: `${oldestOverdueBill.Bill || "A bill"} is overdue and should be handled before lower-impact spending.`,
      doFirst: "Open Bills and pay, negotiate, or update the oldest overdue bill.",
      doNotDo: "Do not let overdue pressure stack without a status update.",
      checkpoint: "Update bill status after action is taken.",
      source: "bills",
      tone: "danger",
    };
  }

  if (metrics.spendableCash < 0) {
    return {
      title: "Stop spending",
      why: `Spendable Cash is ${money(metrics.spendableCash)} and needs protection.`,
      doFirst: "Open Money Snapshot and identify the biggest pressure item.",
      doNotDo: "Do not add new spending, trading risk, or nonessential purchases.",
      checkpoint: "Get Spendable Cash back to zero or higher.",
      source: "money",
      tone: "danger",
    };
  }

  if (financialState.inventory.buyNextItems.length > 0) {
    return {
      title: `Buy next: ${metrics.buyNext || "inventory"}`,
      why: `${financialState.inventory.buyNextItems.length} inventory item(s) are below Min Needed.`,
      doFirst: "Open Inventory and handle the Critical items first, then Low items.",
      doNotDo: "Do not ignore small survival items until they become emergencies.",
      checkpoint: "Mark inventory items handled once covered.",
      source: "inventory",
      tone: "warning",
    };
  }

  if (metrics.buyNext) {
    return {
      title: `Review Buy Next: ${metrics.buyNext}`,
      why: "There are open Buy Next items waiting for a decision.",
      doFirst: "Open Buy Next and mark the item bought, delayed, or handled.",
      doNotDo: "Do not add new purchases until the open Buy Next list is current.",
      checkpoint: "Close or reprioritize the Buy Next row after action.",
      source: "buyNext",
      tone: "warning",
    };
  }

  if (metrics.cashOnHand === 0 && metrics.weeklyIncome === 0 && metrics.otherIncome === 0) {
    return {
      title: "Enter cash before spending",
      why: "Cash data is incomplete, so VCC cannot safely prove what is spendable.",
      doFirst: "Open Money Snapshot and enter Cash On Hand plus expected income.",
      doNotDo: "Do not spend freely until cash-on-hand is confirmed.",
      checkpoint: "After cash-on-hand is confirmed, return to Dashboard for a cleaner safe-to-spend read.",
      source: "money",
      tone: "danger",
    };
  }

  if (metrics.debtBlocksCash > 0 && metrics.spendableCash >= 0) {
    return {
      title: "Protect the next check from debt",
      why: `${money(metrics.debtBlocksCash)} in active debt payments is marked as blocking future cash.`,
      doFirst: "Open Debt and handle the payment or advance that protects the next paycheck.",
      doNotDo: "Do not count advances as safe money until their payback is covered.",
      checkpoint: "Update Debt status and payment due after action is taken.",
      source: "debt",
      tone: "warning",
    };
  }

  if (metrics.spendableCash < 0 && metrics.allowedWithdrawal > 0) {
    return {
      title: "Use only the approved savings pull if necessary",
      why: `Spendable Cash is ${money(metrics.spendableCash)}, but ${money(metrics.allowedWithdrawal)} is approved for withdrawal.`,
      doFirst: "Use operating cash first. Pull only the approved amount for the listed reason.",
      doNotDo: "Do not treat the whole Savings Vault like spending money.",
      checkpoint: "After using the withdrawal, lower the Allowed Withdrawal amount.",
      source: "savings",
      tone: "warning",
    };
  }

  if (metrics.unpaidBills > 0) {
    return {
      title: "Plan unpaid bills before spending",
      why: `${metrics.unpaidBills} bill(s) are unpaid, with ${money(metrics.billsPressure)} in bill pressure.`,
      doFirst: "Open Bills and decide what gets paid from spendable cash.",
      doNotDo: "Do not spend leftover cash until bill priority is clear.",
      checkpoint: "Update Paid/Unpaid statuses after payment decisions.",
      source: "bills",
      tone: "warning",
    };
  }

  if (metrics.savingsVault <= 0 && metrics.spendableCash > 0) {
    return {
      title: "Start the emergency buffer",
      why: "Spendable Cash is positive, but the Savings Vault is empty.",
      doFirst: "Move a small amount into Emergency Fund after survival needs are covered.",
      doNotDo: "Do not over-save if it leaves food, gas, or bills short.",
      checkpoint: "Update Emergency Fund Current Amount.",
      source: "savings",
      tone: "stable",
    };
  }

  if (metrics.openMissions > 0) {
    return {
      title: "Execute the next open mission",
      why: `${metrics.openMissions} mission(s) are still open and the money pressure is manageable right now.`,
      doFirst: "Open Missions and complete the smallest high-priority action.",
      doNotDo: "Do not drift just because no crisis is flashing.",
      checkpoint: "Mark one mission Done before adding more.",
      source: "missions",
      tone: "stable",
    };
  }

  return {
    title: "VCC is clear",
    why: "No critical blocker is leading right now.",
    doFirst: "Keep numbers current and protect savings from random spending.",
    doNotDo: "Do not create new pressure just because the dashboard looks stable.",
    checkpoint: "Update VCC again after the next money move.",
    source: alerts[0]?.source ?? "missions",
    tone: "stable",
  };
}

function getHealthStatus(score: number): HealthStatus {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Stable";
  if (score >= 35) return "Warning";
  return "Critical";
}

function getSection(data: Section[], key: SectionKey) {
  return data.find((section) => section.key === key) ?? {
    key,
    label: "",
    subtitle: "",
    columns: [],
    rows: [],
  };
}

function daysUntil(date: string | undefined) {
  if (!date) return null;
  const dueDate = new Date(`${date}T23:59:59`);
  if (Number.isNaN(dueDate.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function hasAnyValue(row: Record<string, string>, keys: string[]) {
  return keys.some((key) => (row[key] ?? "").trim() !== "");
}
