import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, TrendingDown, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VehicleDebtTracker from "../components/VehicleDebtTracker";

interface Debt {
  id: number;
  name: string;
  balance: number;
  minimumPayment: number;
  interestRate: number;
  status: "active" | "paid_off" | "paused";
  category: string;
  dueDate?: Date;
}

export default function DebtPage() {
  const [debts, setDebts] = useState<Debt[]>([
    {
      id: 1,
      name: "Credit Card",
      balance: 4250.5,
      minimumPayment: 150,
      interestRate: 18.5,
      status: "active",
      category: "credit_card",
      dueDate: new Date(2026, 5, 20),
    },
    {
      id: 2,
      name: "Student Loan",
      balance: 12500,
      minimumPayment: 250,
      interestRate: 4.5,
      status: "active",
      category: "student_loan",
      dueDate: new Date(2026, 5, 1),
    },
    {
      id: 3,
      name: "Personal Loan",
      balance: 3200,
      minimumPayment: 200,
      interestRate: 8.0,
      status: "active",
      category: "personal_loan",
      dueDate: new Date(2026, 5, 15),
    },
  ]);

  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const monthlyPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const activeDebts = debts.filter((d) => d.status === "active").length;
  const averageInterestRate = debts.length > 0 ? debts.reduce((sum, d) => sum + d.interestRate, 0) / debts.length : 0;

  const sortedByInterest = [...debts].sort((a, b) => b.interestRate - a.interestRate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Debt Management</h1>
          <p className="text-slate-400">Track and manage your debts with smart payoff strategies</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Debt</p>
                <p className="text-3xl font-bold text-red-400">${totalDebt.toFixed(2)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400/50" />
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 p-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Active Debts</p>
              <p className="text-3xl font-bold text-white">{activeDebts}</p>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 p-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Monthly Payment</p>
              <p className="text-3xl font-bold text-orange-400">${monthlyPayment.toFixed(2)}</p>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 p-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Avg Interest Rate</p>
              <p className="text-3xl font-bold text-yellow-400">{averageInterestRate.toFixed(1)}%</p>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="bg-slate-800/50 border-slate-700/50">
            <TabsTrigger value="all">All Debts ({debts.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeDebts})</TabsTrigger>
            <TabsTrigger value="vehicle">Vehicle Tracker</TabsTrigger>
            <TabsTrigger value="strategy">Payoff Strategy</TabsTrigger>
          </TabsList>

          {/* All Debts Tab */}
          <TabsContent value="all" className="mt-6">
            <div className="space-y-4">
              {debts.map((debt) => (
                <Card key={debt.id} className="bg-slate-800/50 border-slate-700/50 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{debt.name}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Balance</p>
                          <p className="text-lg font-bold text-red-400">${debt.balance.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Min Payment</p>
                          <p className="text-lg font-bold text-white">${debt.minimumPayment.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Interest Rate</p>
                          <p className="text-lg font-bold text-yellow-400">{debt.interestRate}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Status</p>
                          <p className="text-lg font-bold text-green-400 capitalize">{debt.status}</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-4">
                      Edit
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Vehicle Tracker Tab */}
          <TabsContent value="vehicle" className="mt-6">
            <div className="space-y-6">
              <VehicleDebtTracker debtId={4} />
            </div>
          </TabsContent>

          {/* Active Debts Tab */}
          <TabsContent value="active" className="mt-6">
            <div className="space-y-4">
              {debts
                .filter((d) => d.status === "active")
                .map((debt) => (
                  <Card key={debt.id} className="bg-slate-800/50 border-slate-700/50 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{debt.name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Balance</p>
                            <p className="text-lg font-bold text-red-400">${debt.balance.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Min Payment</p>
                            <p className="text-lg font-bold text-white">${debt.minimumPayment.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Interest Rate</p>
                            <p className="text-lg font-bold text-yellow-400">{debt.interestRate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Due Date</p>
                            <p className="text-lg font-bold text-white">
                              {debt.dueDate?.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="ml-4">
                        Pay
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* Payoff Strategy Tab */}
          <TabsContent value="strategy" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700/50 p-6 mb-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Recommended Strategy: Avalanche Method</h3>
                  <p className="text-slate-300">
                    Pay off debts in order of highest interest rate first. This saves the most money on interest payments.
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Suggested Payoff Order</h3>
              {sortedByInterest.map((debt, index) => (
                <Card key={debt.id} className="bg-slate-800/50 border-slate-700/50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30">
                      <span className="text-blue-400 font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-2">{debt.name}</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Balance</p>
                          <p className="text-white font-semibold">${debt.balance.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Interest Rate</p>
                          <p className="text-yellow-400 font-semibold">{debt.interestRate}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Priority</p>
                          <p className="text-orange-400 font-semibold">High</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Button */}
        <div className="flex gap-4">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add New Debt
          </Button>
        </div>
      </div>
    </div>
  );
}
