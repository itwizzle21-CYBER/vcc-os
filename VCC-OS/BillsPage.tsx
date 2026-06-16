import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle,
  Calendar,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import BillForm from "../components/BillForm";

interface Bill {
  id: number;
  name: string;
  amount: number;
  dueDate: Date;
  status: "pending" | "paid" | "overdue";
  isRecurring: boolean;
  frequency?: string;
  category?: string;
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([
    {
      id: 1,
      name: "Electric Bill",
      amount: 125.5,
      dueDate: new Date(2026, 5, 15),
      status: "pending",
      isRecurring: true,
      frequency: "Monthly",
      category: "Utilities",
    },
    {
      id: 2,
      name: "Internet",
      amount: 79.99,
      dueDate: new Date(2026, 5, 10),
      status: "pending",
      isRecurring: true,
      frequency: "Monthly",
      category: "Utilities",
    },
    {
      id: 3,
      name: "Water Bill",
      dueDate: new Date(2026, 5, 5),
      amount: 45.0,
      status: "overdue",
      isRecurring: true,
      frequency: "Monthly",
      category: "Utilities",
    },
    {
      id: 4,
      name: "Gym Membership",
      amount: 50.0,
      dueDate: new Date(2026, 5, 20),
      status: "pending",
      isRecurring: true,
      frequency: "Monthly",
      category: "Health",
    },
    {
      id: 5,
      name: "Car Insurance",
      amount: 150.0,
      dueDate: new Date(2026, 6, 1),
      status: "pending",
      isRecurring: true,
      frequency: "Monthly",
      category: "Insurance",
    },
  ]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcomingBills = bills.filter(
    (b) => b.status === "pending" && b.dueDate > now && b.dueDate <= sevenDaysFromNow
  );

  const overdueBills = bills.filter((b) => b.status === "overdue");

  const paidThisMonth = bills.filter(
    (b) =>
      b.status === "paid" &&
      b.dueDate.getMonth() === now.getMonth() &&
      b.dueDate.getFullYear() === now.getFullYear()
  );

  const allUpcoming = bills.filter((b) => b.status === "pending" && b.dueDate > now);

  const handleAddBill = (bill: Omit<Bill, "id">) => {
    const newBill: Bill = {
      ...bill,
      id: Math.max(...bills.map((b) => b.id), 0) + 1,
    };
    setBills([...bills, newBill]);
    toast.success("Bill added successfully");
    setIsFormOpen(false);
  };

  const handleEditBill = (billData: Omit<Bill, "id">) => {
    if (!editingBill) return;
    const updatedBill: Bill = { ...billData, id: editingBill.id };
    setBills(bills.map((b) => (b.id === editingBill.id ? updatedBill : b)));
    toast.success("Bill updated successfully");
    setEditingBill(null);
  };

  const handleDeleteBill = (id: number) => {
    setBills(bills.filter((b) => b.id !== id));
    toast.success("Bill deleted successfully");
  };

  const handleMarkPaid = (id: number) => {
    setBills(
      bills.map((b) =>
        b.id === id ? { ...b, status: "paid" as const } : b
      )
    );
    toast.success("Bill marked as paid");
  };

  const totalDue = bills
    .filter((b) => b.status === "pending" || b.status === "overdue")
    .reduce((sum, b) => sum + b.amount, 0);

  const BillCard = ({ bill }: { bill: Bill }) => (
    <Card className="p-4 bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 transition-all">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-white">{bill.name}</h3>
            {bill.status === "overdue" && (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            {bill.status === "paid" && (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {bill.dueDate.toLocaleDateString()}
            </span>
            {bill.isRecurring && (
              <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs">
                {bill.frequency}
              </span>
            )}
            {bill.category && (
              <span className="text-slate-500">{bill.category}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xl font-bold text-white">${bill.amount.toFixed(2)}</p>
            <p
              className={`text-xs font-semibold ${
                bill.status === "overdue"
                  ? "text-red-400"
                  : bill.status === "paid"
                  ? "text-emerald-400"
                  : "text-yellow-400"
              }`}
            >
              {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
            </p>
          </div>

          <div className="flex gap-2">
            {bill.status !== "paid" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkPaid(bill.id)}
                className="text-xs"
              >
                Mark Paid
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingBill(bill)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteBill(bill.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Bills</h1>
            <p className="text-slate-400">Manage your recurring and one-time bills</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Bill
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
            <p className="text-slate-400 text-sm mb-2">Total Due</p>
            <p className="text-2xl font-bold text-white">${totalDue.toFixed(2)}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
            <p className="text-slate-400 text-sm mb-2">Overdue</p>
            <p className="text-2xl font-bold text-red-400">{overdueBills.length}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
            <p className="text-slate-400 text-sm mb-2">Due in 7 Days</p>
            <p className="text-2xl font-bold text-yellow-400">{upcomingBills.length}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
            <p className="text-slate-400 text-sm mb-2">Paid This Month</p>
            <p className="text-2xl font-bold text-emerald-400">{paidThisMonth.length}</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="upcoming">
              Upcoming ({allUpcoming.length})
            </TabsTrigger>
            <TabsTrigger value="overdue">
              Overdue ({overdueBills.length})
            </TabsTrigger>
            <TabsTrigger value="7days">
              Next 7 Days ({upcomingBills.length})
            </TabsTrigger>
            <TabsTrigger value="all">All Bills ({bills.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 mt-6">
            {allUpcoming.length > 0 ? (
              allUpcoming.map((bill) => <BillCard key={bill.id} bill={bill} />)
            ) : (
              <Card className="p-8 text-center bg-slate-800/50 border-slate-700/50">
                <p className="text-slate-400">No upcoming bills</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4 mt-6">
            {overdueBills.length > 0 ? (
              overdueBills.map((bill) => <BillCard key={bill.id} bill={bill} />)
            ) : (
              <Card className="p-8 text-center bg-slate-800/50 border-slate-700/50">
                <p className="text-emerald-400 font-semibold">✓ No overdue bills</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="7days" className="space-y-4 mt-6">
            {upcomingBills.length > 0 ? (
              upcomingBills.map((bill) => <BillCard key={bill.id} bill={bill} />)
            ) : (
              <Card className="p-8 text-center bg-slate-800/50 border-slate-700/50">
                <p className="text-slate-400">No bills due in the next 7 days</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-6">
            {bills.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bill Form Modal */}
      {(isFormOpen || editingBill) && (
        <BillForm
          bill={editingBill}
          onSave={editingBill ? handleEditBill : handleAddBill}
          onClose={() => {
            setIsFormOpen(false);
            setEditingBill(null);
          }}
        />
      )}
    </div>
  );
}
