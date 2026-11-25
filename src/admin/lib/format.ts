import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BRANCHES } from "@/data/content";
import { hasConvex } from "@/providers/AppProviders";

/** Reads branch slug from orders/reservations (supports legacy branchId field). */
export function resolveBranchSlug(row: {
  branchSlug?: string | null;
  branchId?: string | null;
}) {
  return row.branchSlug ?? row.branchId ?? "";
}

export function formatBranchLabel(branchSlug: string, labels?: Map<string, string>) {
  if (labels?.has(branchSlug)) {
    return labels.get(branchSlug)!;
  }
  return BRANCHES.find((b) => b.id === branchSlug)?.label ?? branchSlug.replace(/-/g, " ");
}

/** Resolves branch slugs to labels from Convex (falls back to static BRANCHES). */
export function useBranchLabelMap() {
  const branches = useQuery(api.branches.listActive, hasConvex() ? {} : "skip");
  const map = new Map<string, string>();
  if (branches) {
    for (const b of branches) {
      map.set(b.slug, b.label);
    }
  } else {
    for (const b of BRANCHES) {
      map.set(b.id, b.label);
    }
  }
  return map;
}

export function useFormatBranchLabel() {
  const labels = useBranchLabelMap();
  return (branchSlug: string) => formatBranchLabel(branchSlug, labels);
}

/** Short display for Convex document ids in admin tables. */
export function formatShortId(id: string, visible = 8) {
  if (id.length <= visible + 1) return id;
  return `${id.slice(0, visible)}…`;
}

export function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString("en-MY", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const FINANCE_PERIODS = [
  { id: "daily" as const, label: "Daily" },
  { id: "weekly" as const, label: "Weekly" },
  { id: "monthly" as const, label: "Monthly" },
  { id: "quarterly" as const, label: "Quarterly" },
  { id: "yearly" as const, label: "Yearly" },
];
