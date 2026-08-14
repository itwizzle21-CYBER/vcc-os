import { afterEach, describe, expect, it, vi } from "vitest";
import { createStarterData } from "./defaultData";
import {
  createVccBackup, loadRecoveryPoints, MAX_BACKUP_BYTES, parseVccBackup, RECOVERY_HISTORY_KEY,
  restoreRecoveryPoint, saveRecoveryPoint, serializeVccBackup, VCC_BACKUP_FORMAT_VERSION,
} from "./backup";

function installLocalStorage() {
  const values = new Map<string, string>();
  vi.stubGlobal("window", { localStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  } });
  return values;
}

afterEach(() => vi.unstubAllGlobals());

describe("versioned VCC backups", () => {
  it("round-trips app data and boolean smart-feature preferences", () => {
    const data = createStarterData();
    data.settings.accountName = "Recovery test";
    const restored = parseVccBackup(serializeVccBackup(data, { insights: true, ignored: false }));
    expect(restored.data.settings.accountName).toBe("Recovery test");
    expect(restored.smartFeatures).toEqual({ insights: true, ignored: false });
  });

  it("writes an explicit format version and data version", () => {
    const envelope = createVccBackup(createStarterData(), {}, "2026-08-14T12:00:00.000Z");
    expect(envelope).toMatchObject({ app: "VCC-OS", formatVersion: VCC_BACKUP_FORMAT_VERSION, dataVersion: 5, exportedAt: "2026-08-14T12:00:00.000Z" });
  });

  it("accepts legacy raw app-data exports", () => {
    const data = createStarterData();
    data.settings.accountName = "Legacy";
    expect(parseVccBackup(JSON.stringify(data)).data.settings.accountName).toBe("Legacy");
  });

  it("rejects foreign, future, and structurally incomplete files", () => {
    expect(() => parseVccBackup(JSON.stringify({ app: "Other", data: createStarterData() }))).toThrow(/another application/);
    expect(() => parseVccBackup(JSON.stringify({ app: "VCC-OS", formatVersion: 99, data: createStarterData() }))).toThrow(/newer/);
    expect(() => parseVccBackup(JSON.stringify({ app: "VCC-OS", data: { sections: {} } }))).toThrow(/missing/);
  });

  it("rejects oversized files before parsing attacker-controlled JSON", () => {
    expect(() => parseVccBackup("x".repeat(MAX_BACKUP_BYTES + 1))).toThrow(/5 MB safety limit/);
  });
});

describe("local recovery history", () => {
  it("keeps the three newest recoverable snapshots", () => {
    const values = installLocalStorage();
    for (let index = 0; index < 4; index += 1) {
      const data = createStarterData();
      data.settings.accountName = `Snapshot ${index}`;
      saveRecoveryPoint(data, `Reason ${index}`, `2026-08-14T12:00:0${index}.000Z`);
    }
    expect(loadRecoveryPoints().map(({ reason }) => reason)).toEqual(["Reason 3", "Reason 2", "Reason 1"]);
    expect(JSON.parse(values.get(RECOVERY_HISTORY_KEY) || "[]")).toHaveLength(3);
  });

  it("restores a selected normalized snapshot", () => {
    installLocalStorage();
    const data = createStarterData();
    data.settings.accountName = "Before import";
    const point = saveRecoveryPoint(data, "Before backup import", "2026-08-14T12:00:00.000Z");
    expect(point).not.toBeNull();
    expect(restoreRecoveryPoint(point!.id)?.settings.accountName).toBe("Before import");
  });
});
