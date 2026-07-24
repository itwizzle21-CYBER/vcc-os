import { describe, expect, it } from "vitest";
import { compareCellValues, nextSortValue, parseSort } from "./Spreadsheet";

describe("spreadsheet column sorting", () => {
  it("cycles a column through ascending, descending, and unsorted", () => {
    expect(nextSortValue(undefined, "amount")).toBe("amount");
    expect(nextSortValue("amount", "amount")).toBe("-amount");
    expect(nextSortValue("-amount", "amount")).toBe("");
  });

  it("starts ascending when a different column title is selected", () => {
    expect(nextSortValue("-amount", "date")).toBe("date");
  });

  it("reads persisted ascending and descending sort values", () => {
    expect(parseSort("date")).toEqual({ columnKey: "date", direction: "ascending" });
    expect(parseSort("-date")).toEqual({ columnKey: "date", direction: "descending" });
  });

  it("orders formatted currency and plain numbers by numeric value", () => {
    const values = ["$12,800.00", "$450.00", "$2,840.32", "$640.00", "$1,250.00"];
    expect(values.sort(compareCellValues)).toEqual([
      "$450.00",
      "$640.00",
      "$1,250.00",
      "$2,840.32",
      "$12,800.00",
    ]);
    expect(["10", "2", "30"].sort(compareCellValues)).toEqual(["2", "10", "30"]);
  });
});
