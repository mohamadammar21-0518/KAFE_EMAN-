export function formatSuspensionEnd(untilMs: number): string {
  return new Date(untilMs).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function isSuspendedNow(
  user: { suspendedUntil?: number | null } | null | undefined,
  now = Date.now(),
): boolean {
  return user?.suspendedUntil != null && user.suspendedUntil > now;
}

export function suspensionMessage(untilMs: number): string {
  return `Your account is suspended. You cannot place orders until ${formatSuspensionEnd(untilMs)}. Thanks for your patience.`;
}
