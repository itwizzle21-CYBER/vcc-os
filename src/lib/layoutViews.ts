import type { LayoutView, LayoutViewPage, LayoutViews } from "./types/app";

export const availableLayoutViews = {
  dashboard: [3, 2],
  money: [5],
  bills: [5],
  inventory: [4, 3],
  transactions: [2],
  reports: [1],
} as const satisfies Record<LayoutViewPage, readonly LayoutView[]>;

export const defaultLayoutViews = Object.fromEntries(
  Object.entries(availableLayoutViews).map(([page, views]) => [page, views[0]]),
) as LayoutViews;

export function isAvailableLayoutView(page: LayoutViewPage, view: number): view is LayoutView {
  return (availableLayoutViews[page] as readonly number[]).includes(view);
}
