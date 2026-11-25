export function buildOrderNumber(existingCountToday: number, now = Date.now()) {
  const d = new Date(now);
  const prefix = `ORD-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const seq = String(existingCountToday + 1).padStart(3, "0");
  return `${prefix}-${seq}`;
}

export function buildMessageReference(existingCountToday: number, now = Date.now()) {
  const d = new Date(now);
  const prefix = `MSG-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const seq = String(existingCountToday + 1).padStart(3, "0");
  return `${prefix}-${seq}`;
}

/** Mask Clerk user id in list views — full id only in admin detail modal. */
export function maskClerkUserId(clerkUserId: string) {
  if (clerkUserId.startsWith("deleted_")) return "removed";
  if (clerkUserId.length <= 12) return clerkUserId;
  return `${clerkUserId.slice(0, 8)}…${clerkUserId.slice(-4)}`;
}
