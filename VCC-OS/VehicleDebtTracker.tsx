import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Calendar, DollarSign, TrendingDown, Zap } from "lucide-react";
import { format } from "date-fns";

interface VehicleDebtTrackerProps {
  debtId: number;
}

export default function VehicleDebtTracker({ debtId }: VehicleDebtTrackerProps) {
  const { data: tracker, isLoading } = trpc.debt.getVehicleTracker.useQuery({ id: debtId });

  if (isLoading || !tracker) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </Card>
    );
  }

  const isOverdue = tracker.paymentStatus === "overdue";
  const isDueSoon = tracker.paymentStatus === "due_soon";

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">{tracker.vehicleDisplay}</h3>
          {isOverdue && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-semibold text-red-600">OVERDUE</span>
            </div>
          )}
          {isDueSoon && !isOverdue && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-semibold text-yellow-600">DUE SOON</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Auto Loan Payoff Tracker</p>
      </div>

      {/* Current Balance & Weekly Payment */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            Current Balance
          </div>
          <p className="text-2xl font-bold">${tracker.currentBalance.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingDown className="w-4 h-4" />
            Weekly Payment
          </div>
          <p className="text-2xl font-bold text-green-600">${tracker.weeklyPayment.toFixed(2)}</p>
        </div>
      </div>

      {/* Payoff Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Payoff Progress</span>
          <span className="text-sm font-semibold text-muted-foreground">{Math.round(tracker.payoffProgress)}%</span>
        </div>
        <Progress value={tracker.payoffProgress} className="h-2" />
      </div>

      {/* Next Due Date */}
      <div className="p-4 bg-muted/30 rounded-lg border border-muted space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          Next Payment Due
        </div>
        <div className="flex items-center justify-between">
          <p className="font-semibold">{format(new Date(), "MMM d, yyyy")}</p>
          <span className={`text-sm font-bold ${isOverdue ? "text-red-600" : isDueSoon ? "text-yellow-600" : "text-green-600"}`}>
            {tracker.daysUntilDue === 0 ? "Today" : tracker.daysUntilDue === 1 ? "Tomorrow" : `${tracker.daysUntilDue} days`}
          </span>
        </div>
      </div>

      {/* Payoff Estimate */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 space-y-2">
          <p className="text-xs font-semibold text-blue-600 uppercase">Payoff Timeline</p>
          <p className="text-2xl font-bold text-blue-600">{tracker.payoffWeeks} weeks</p>
          <p className="text-xs text-muted-foreground">{(tracker.payoffWeeks / 52).toFixed(1)} years</p>
        </div>
        <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20 space-y-2">
          <p className="text-xs font-semibold text-purple-600 uppercase">Est. Payoff Date</p>
          <p className="text-lg font-bold text-purple-600">{format(tracker.estimatedPayoffDate, "MMM d, yyyy")}</p>
          <p className="text-xs text-muted-foreground">
            {Math.round((tracker.estimatedPayoffDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days away
          </p>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
        <p className="text-sm font-semibold">Payment Breakdown</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Weekly Payment</span>
            <span className="font-semibold">${tracker.weeklyPayment.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monthly Equivalent</span>
            <span className="font-semibold">${tracker.monthlyEquivalent.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-muted-foreground">Annual Payment</span>
            <span className="font-semibold text-green-600">${tracker.annualPayment.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Interest Rate */}
      <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20 flex items-center justify-between">
        <span className="text-sm text-orange-700 font-medium">Interest Rate</span>
        <span className="font-bold text-orange-600">{tracker.interestRate}%</span>
      </div>
    </Card>
  );
}
