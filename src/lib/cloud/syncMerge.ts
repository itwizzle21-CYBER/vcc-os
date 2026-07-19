import type { AppData } from "../types/app";

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function itemId(value: unknown): string | null {
  if (!isObject(value)) return null;
  const id = value.id;
  return typeof id === "string" || typeof id === "number" ? String(id) : null;
}

function canMergeById(...arrays: unknown[][]): boolean {
  const values = arrays.flat();
  return values.length > 0 && values.every((value) => itemId(value) !== null);
}

function mergeById(base: unknown[], local: unknown[], remote: unknown[]): unknown[] {
  const baseMap = new Map(base.map((value) => [itemId(value)!, value]));
  const localMap = new Map(local.map((value) => [itemId(value)!, value]));
  const remoteMap = new Map(remote.map((value) => [itemId(value)!, value]));
  const order = [...remoteMap.keys(), ...[...localMap.keys()].filter((id) => !remoteMap.has(id))];

  return order.flatMap((id) => {
    const baseValue = baseMap.get(id);
    const localValue = localMap.get(id);
    const remoteValue = remoteMap.get(id);

    if (localValue === undefined && remoteValue === undefined) return [];
    if (localValue === undefined) {
      if (baseValue === undefined || !isEqual(remoteValue, baseValue)) return [clone(remoteValue)];
      return [];
    }
    if (remoteValue === undefined) {
      if (baseValue === undefined || !isEqual(localValue, baseValue)) return [clone(localValue)];
      return [];
    }
    if (baseValue === undefined) return [mergeValue({}, localValue, remoteValue)];
    return [mergeValue(baseValue, localValue, remoteValue)];
  });
}

function mergeObjects(base: JsonObject, local: JsonObject, remote: JsonObject): JsonObject {
  const result: JsonObject = {};
  const keys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)]);

  for (const key of keys) {
    const baseHas = Object.prototype.hasOwnProperty.call(base, key);
    const localHas = Object.prototype.hasOwnProperty.call(local, key);
    const remoteHas = Object.prototype.hasOwnProperty.call(remote, key);

    if (!localHas && !remoteHas) continue;
    if (!localHas) {
      if (!baseHas || !isEqual(remote[key], base[key])) result[key] = clone(remote[key]);
      continue;
    }
    if (!remoteHas) {
      if (!baseHas || !isEqual(local[key], base[key])) result[key] = clone(local[key]);
      continue;
    }

    result[key] = mergeValue(base[key], local[key], remote[key]);
  }

  return result;
}

function mergeValue(base: unknown, local: unknown, remote: unknown): unknown {
  if (isEqual(local, remote)) return clone(local);
  if (isEqual(local, base)) return clone(remote);
  if (isEqual(remote, base)) return clone(local);

  if (Array.isArray(base) && Array.isArray(local) && Array.isArray(remote)) {
    return canMergeById(base, local, remote) ? mergeById(base, local, remote) : clone(remote);
  }

  if (isObject(base) && isObject(local) && isObject(remote)) {
    return mergeObjects(base, local, remote);
  }

  // Without per-field timestamps, the newer server revision is the safest tie-breaker.
  return clone(remote);
}

/**
 * Three-way merge for edits made on two devices since their last shared base.
 * Row additions, deletions, and independent cell edits are preserved by stable row id.
 */
export function mergeAppData(base: AppData, local: AppData, remote: AppData): AppData {
  return mergeValue(base, local, remote) as AppData;
}

export function appDataEqual(left: AppData, right: AppData): boolean {
  return isEqual(left, right);
}
