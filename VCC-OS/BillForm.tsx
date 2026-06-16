import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Bill {
  id?: number;
  name: string;
  amount: number;
  dueDate: Date;
  status: "pending" | "paid" | "overdue";
  isRecurring: boolean;
  frequency?: string;
  category?: string;
}

interface BillFormProps {
  bill?: Bill | null;
  onSave: (bill: Omit<Bill, "id">) => void;
  onClose: () => void;
}

export default function BillForm({ bill, onSave, onClose }: BillFormProps) {
  const [formData, setFormData] = useState<Omit<Bill, "id">>({
    name: bill?.name || "",
    amount: bill?.amount || 0,
    dueDate: bill?.dueDate || new Date(),
    status: bill?.status || "pending",
    isRecurring: bill?.isRecurring || false,
    frequency: bill?.frequency || "Monthly",
    category: bill?.category || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {bill ? "Edit Bill" : "Add New Bill"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bill Name */}
          <div>
            <Label className="text-slate-300">Bill Name</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Electric Bill"
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <Label className="text-slate-300">Amount ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) })
              }
              placeholder="0.00"
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              required
            />
          </div>

          {/* Due Date */}
          <div>
            <Label className="text-slate-300">Due Date</Label>
            <Input
              type="date"
              value={formData.dueDate.toISOString().split("T")[0]}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dueDate: new Date(e.target.value),
                })
              }
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label className="text-slate-300">Category</Label>
            <Select value={formData.category} onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Insurance">Insurance</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Subscriptions">Subscriptions</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between">
            <Label className="text-slate-300">Recurring Bill</Label>
            <Switch
              checked={formData.isRecurring}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isRecurring: checked })
              }
            />
          </div>

          {/* Frequency */}
          {formData.isRecurring && (
            <div>
              <Label className="text-slate-300">Frequency</Label>
              <Select value={formData.frequency} onValueChange={(value) =>
                setFormData({ ...formData, frequency: value })
              }>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status */}
          <div>
            <Label className="text-slate-300">Status</Label>
            <Select value={formData.status} onValueChange={(value: any) =>
              setFormData({ ...formData, status: value })
            }>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-slate-300"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {bill ? "Update Bill" : "Add Bill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
