import { describe, expect, it } from "vitest";
import { resetAllData } from "./localStore";

describe("full VCC reset", () => {
  it("returns a blank financial workspace and account identity", () => {
    const reset = resetAllData();

    expect(Object.values(reset.sections).every((rows) => rows.length === 0)).toBe(true);
    expect(reset.paycheckPlanner).toEqual({
      paycheckAmount: "",
      payDate: "",
      weekStart: "",
      weekEnd: "",
      spotMeRepayment: "",
      myPayRepayment: "",
      locked: false,
    });
    expect(reset.paycheckHistory).toEqual([]);
    expect(reset.sortBy).toEqual({});
    expect(reset.settings.accountName).toBe("");
    expect(reset.settings.profileLabel).toBe("");
    expect(reset.settings.notificationsEnabled).toBe(false);
  });
});
