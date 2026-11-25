/** Avatar URL: Clerk/Google photo first, then Gravatar for the account email. */
export function resolveUserAvatarUrl(
  imageUrl?: string | null,
  email?: string | null,
): string | undefined {
  const fromProvider = imageUrl?.trim();
  if (fromProvider) return fromProvider;

  const normalized = email?.trim().toLowerCase();
  if (!normalized) return undefined;

  return `https://unavatar.io/${encodeURIComponent(normalized)}`;
}

export function userInitials(name?: string | null, email?: string | null): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const local = email?.split("@")[0]?.trim();
  if (local) return local.slice(0, 2).toUpperCase();
  return "?";
}
