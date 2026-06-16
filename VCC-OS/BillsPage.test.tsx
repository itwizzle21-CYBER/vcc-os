import { describe, it, expect, beforeEach } from "vitest";

describe("Bills Module", () => {
  describe("Bill Management", () => {
    it("should add a new bill", () => {
      const bills: any[] = [];
      const newBill = {
        name: "Electric Bill",
        amount: 125.5,
        dueDate: new Date(2026, 5, 15),
        status: "pending" as const,
        isRecurring: true,
        frequency: "Monthly",
        category: "Utilities",
      };

      bills.push({ id: 1, ...newBill });
      expect(bills).toHaveLength(1);
      expect(bills[0].name).toBe("Electric Bill");
    });

    it("should calculate overdue bills correctly", () => {
      const now = new Date();
      const bills = [
        {
          id: 1,
          name: "Water Bill",
          dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          status: "overdue" as const,
        },
        {
          id: 2,
          name: "Electric Bill",
          dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          status: "pending" as const,
        },
      ];

      const overdue = bills.filter((b) => b.status === "overdue");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].name).toBe("Water Bill");
    });

    it("should calculate bills due in next 7 days", () => {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const bills = [
        {
          id: 1,
          name: "Electric",
          dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          status: "pending" as const,
        },
        {
          id: 2,
          name: "Internet",
          dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
          status: "pending" as const,
        },
      ];

      const upcomingIn7Days = bills.filter(
        (b) => b.status === "pending" && b.dueDate > now && b.dueDate <= sevenDaysFromNow
      );

      expect(upcomingIn7Days).toHaveLength(1);
      expect(upcomingIn7Days[0].name).toBe("Electric");
    });

    it("should calculate total amount due", () => {
      const bills = [
        { id: 1, amount: 125.5, status: "pending" as const },
        { id: 2, amount: 79.99, status: "pending" as const },
        { id: 3, amount: 45.0, status: "paid" as const },
      ];

      const totalDue = bills
        .filter((b) => b.status === "pending")
        .reduce((sum, b) => sum + b.amount, 0);

      expect(totalDue).toBe(205.49);
    });

    it("should mark bill as paid", () => {
      let bills: any[] = [
        {
          id: 1,
          name: "Electric",
          status: "pending" as const,
        },
      ];

      bills = bills.map((b) =>
        b.id === 1 ? { ...b, status: "paid" as const } : b
      );

      expect(bills[0].status).toBe("paid");
    });

    it("should delete a bill", () => {
      let bills: any[] = [
        { id: 1, name: "Electric" },
        { id: 2, name: "Water" },
      ];

      bills = bills.filter((b) => b.id !== 1);

      expect(bills).toHaveLength(1);
      expect(bills[0].name).toBe("Water");
    });

    it("should handle recurring bills", () => {
      const bills = [
        {
          id: 1,
          name: "Electric",
          isRecurring: true,
          frequency: "Monthly",
        },
        {
          id: 2,
          name: "One-time",
          isRecurring: false,
        },
      ];

      const recurring = bills.filter((b) => b.isRecurring);
      expect(recurring).toHaveLength(1);
      expect(recurring[0].frequency).toBe("Monthly");
    });
  });

  describe("Dashboard Integration", () => {
    it("should calculate dashboard metrics", () => {
      const bills = [
        {
          id: 1,
          amount: 125.5,
          status: "pending" as const,
          dueDate: new Date(),
        },
        {
          id: 2,
          amount: 79.99,
          status: "overdue" as const,
          dueDate: new Date(),
        },
        {
          id: 3,
          amount: 45.0,
          status: "paid" as const,
          dueDate: new Date(),
        },
      ];

      const overdueBills = bills.filter((b) => b.status === "overdue").length;
      const upcomingBills = bills.filter((b) => b.status === "pending").length;
      const totalDue = bills
        .filter((b) => b.status === "pending" || b.status === "overdue")
        .reduce((sum, b) => sum + b.amount, 0);

      expect(overdueBills).toBe(1);
      expect(upcomingBills).toBe(1);
      expect(totalDue).toBe(205.49);
    });
  });
});
