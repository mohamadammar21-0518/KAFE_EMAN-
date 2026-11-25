import type { Doc } from "../../convex/_generated/dataModel";

export type ReservationStatus = Doc<"reservations">["status"];
export type ReservationClosureOutcome = NonNullable<Doc<"reservations">["closureOutcome"]>;

export type ReservationAdminTab = "in_progress" | "cancelled" | "closed";

export const RESERVATION_CLOSURE_OPTIONS: {
  value: ReservationClosureOutcome;
  label: string;
}[] = [
  { value: "followed_up", label: "Followed up" },
  { value: "completed", label: "Visit completed" },
  { value: "no_show", label: "No show" },
  { value: "other", label: "Other" },
];

export function reservationStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "progressing":
      return "In progress";
    case "cancelled":
      return "Cancelled";
    case "closed":
      return "Closed";
    case "confirmed":
      return "In progress";
    case "rejected":
      return "Cancelled";
    default:
      return status;
  }
}

export function reservationClosureLabel(outcome: string): string {
  return RESERVATION_CLOSURE_OPTIONS.find((o) => o.value === outcome)?.label ?? outcome;
}

/** Normalize legacy statuses for grouping and display. */
export function normalizeReservationStatus(status: string): ReservationStatus {
  if (status === "confirmed") return "progressing";
  if (status === "rejected") return "cancelled";
  return status as ReservationStatus;
}

export function reservationAdminTab(status: string): ReservationAdminTab {
  const normalized = normalizeReservationStatus(status);
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "closed") return "closed";
  return "in_progress";
}

export function reservationMatchesTab(row: Doc<"reservations">, tab: ReservationAdminTab): boolean {
  return reservationAdminTab(row.status) === tab;
}
