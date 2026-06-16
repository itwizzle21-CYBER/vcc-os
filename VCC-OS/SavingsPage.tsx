import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Target, TrendingUp, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SavingsGoal {
  id: number;
  name: string;
  currentAmount: number;
  goalAmount: number;
  targetDate?: Date;
  priority: "low" | "medium" | "high";
}

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([
    {
      id: 1,
      name: "Emergency Fund",
      currentAmount: 8500,
      goalAmount: 15000,
      targetDate: new Date(2027, 5, 30),
      priority: "high",
    },
    {
      id: 2,
      name: "Move Out Fund",
      currentAmount: 12300,
      goalAmount: 25000,
      targetDate: new Date(2027, 11, 31),
      priority: "high",
    },
    {
      id: 3,
      name: "Vehicle Fund",
      currentAmount: 5200,
      goalAmount: 20000,
      targetDate: new Date(2028, 5, 30),
      priority: "medium",
    },
  ]);

  const totalSavings = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalGoalAmount = goals.reduce((sum, g) => sum + g.goalAmount, 0);
  const savingsPercentage = totalGoalAmount > 0 ? (totalSavings / totalGoalAmount) * 100 : 0;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-blue-500";
    if (percentage >= 25) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Savings Goals</h1>
          <p className="text-slate-400">Track your Emergency Fund, Move Out Fund, Vehicle Fund, and custom goals</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Savings</p>
                <p className="text-3xl font-bold text-green-400">${totalSavings.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400/50" />
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 p-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Goal Amount</p>
              <p className="text-3xl font-bold text-white">${totalGoalAmount.toFixed(2)}</p>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700/50 p-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Progress</p>
              <p className="text-3xl font-bold text-blue-400">{savingsPercentage.toFixed(1)}%</p>
            </div>
          </Card>
        </div>

        {/* Goals List */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="bg-slate-800/50 border-slate-700/50">
            <TabsTrigger value="all">All Goals ({goals.length})</TabsTrigger>
            <TabsTrigger value="high">High Priority</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          {/* All Goals */}
          <TabsContent value="all" className="mt-6">
            <div className="space-y-4">
              {goals.map((goal) => {
                const percentage = (goal.currentAmount / goal.goalAmount) * 100;
                const remaining = goal.goalAmount - goal.currentAmount;

                return (
                  <Card key={goal.id} className="bg-slate-800/50 border-slate-700/50 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">{goal.name}</h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-slate-400">
                            ${goal.currentAmount.toFixed(2)} / ${goal.goalAmount.toFixed(2)}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${goal.priority === "high" ? "bg-red-500/20 text-red-400" : goal.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>
                            {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)} Priority
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">{percentage.toFixed(1)}% Complete</span>
                        <span className="text-sm text-slate-400">${remaining.toFixed(2)} Remaining</span>
                      </div>
                      <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${getProgressColor(percentage)} transition-all duration-500`} style={{ width: `${Math.min(100, percentage)}%` }} />
                      </div>
                    </div>

                    {/* Target Date */}
                    {goal.targetDate && (
                      <div className="text-xs text-slate-400">
                        Target: {goal.targetDate.toLocaleDateString()}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* High Priority */}
          <TabsContent value="high" className="mt-6">
            <div className="space-y-4">
              {goals
                .filter((g) => g.priority === "high")
                .map((goal) => {
                  const percentage = (goal.currentAmount / goal.goalAmount) * 100;

                  return (
                    <Card key={goal.id} className="bg-slate-800/50 border-slate-700/50 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">{goal.name}</h3>
                          <p className="text-sm text-slate-400">
                            ${goal.currentAmount.toFixed(2)} / ${goal.goalAmount.toFixed(2)}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Add Funds
                        </Button>
                      </div>

                      <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${getProgressColor(percentage)} transition-all duration-500`} style={{ width: `${Math.min(100, percentage)}%` }} />
                      </div>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>

          {/* Progress */}
          <TabsContent value="progress" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700/50 p-6">
              <div className="flex items-start gap-4 mb-6">
                <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Overall Progress</h3>
                  <p className="text-slate-300">You've saved {savingsPercentage.toFixed(1)}% of your total goal amount</p>
                </div>
              </div>

              <div className="space-y-4">
                {goals.map((goal) => {
                  const percentage = (goal.currentAmount / goal.goalAmount) * 100;

                  return (
                    <div key={goal.id} className="p-4 rounded-lg bg-slate-700/20 border border-slate-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-white">{goal.name}</span>
                        <span className="text-sm font-bold text-blue-400">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${getProgressColor(percentage)} transition-all duration-500`} style={{ width: `${Math.min(100, percentage)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Button */}
        <div className="flex gap-4">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Add New Goal
          </Button>
        </div>
      </div>
    </div>
  );
}
