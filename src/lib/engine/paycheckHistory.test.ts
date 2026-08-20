import { describe, expect, it } from "vitest";
import type { PaycheckHistoryRow } from "../types/app";
import { sortPaycheckHistory } from "./paycheckHistory";

function history(id: string, payDate: string, weekEnd = "", weekStart = ""): PaycheckHistoryRow {
  return {
    id,
    payDate,
    income: "100.00",
    spotMe: "0.00",
    myPay: "0.00",
    remaining: "100.00",
    weekStart,
    weekEnd,
    locked: true,
  };
}

describe("paycheck history sorting", () => {
  it("sorts chronologically without mutating the stored records", () => {
    const rows = [
      history("middle", "2026-08-15"),
      history("oldest", "2026-08-01"),
      history("newest", "2026-08-22"),
    ];

    expect(sortPaycheckHistory(rows, "newest").map((row) => row.id)).toEqual(["newest", "middle", "oldest"]);
    expect(sortPaycheckHistory(rows, "oldest").map((row) => row.id)).toEqual(["oldest", "middle", "newest"]);
    expect(rows.map((row) => row.id)).toEqual(["middle", "oldest", "newest"]);
  });

  it("uses the locked week as a fallback and leaves undated records last", () => {
    const rows = [
      history("undated", ""),
      history("week-fallback", "", "2026-08-09", "2026-08-03"),
      history("dated", "2026-08-10"),
    ];

    expect(sortPaycheckHistory(rows, "newest").map((row) => row.id)).toEqual(["dated", "week-fallback", "undated"]);
    expect(sortPaycheckHistory(rows, "oldest").map((row) => row.id)).toEqual(["week-fallback", "dated", "undated"]);
  });
});
