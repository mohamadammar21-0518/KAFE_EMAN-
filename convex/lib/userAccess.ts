import type { Doc } from "../_generated/dataModel";

export type UserAccessBlock =
  | { blocked: false }
  | { blocked: true; code: "deactivated" }
  | { blocked: true; code: "suspended"; until: number };

export function getUserAccess(
  user: Pick<Doc<"users">, "active" | "suspendedUntil">,
  now = Date.now(),
): UserAccessBlock {
  if (user.active === false) {
    return { blocked: true, code: "deactivated" };
  }
  if (user.suspendedUntil != null && user.suspendedUntil > now) {
    return { blocked: true, code: "suspended", until: user.suspendedUntil };
  }
  return { blocked: false };
}

export function formatSuspensionEnd(untilMs: number): string {
  return new Date(untilMs).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function assertUserCanPlaceOrder(user: Doc<"users">, now = Date.now()) {
  const access = getUserAccess(user, now);
  if (!access.blocked) return;

  if (access.code === "suspended") {
    throw new Error(
      `Your account is suspended. You cannot place orders until ${formatSuspensionEnd(access.until)}. Thanks for your patience.`,
    );
  }
  throw new Error("Your account is not active. Please contact Kafe Eman for help.");
}
