import { useUser } from "@clerk/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { hasConvex } from "@/providers/AppProviders";

/** Clerk profile photo + Convex copy + account email for avatar fallbacks. */
export function useUserAvatar() {
  const { user, isLoaded, isSignedIn } = useUser();
  const profile = useQuery(
    api.users.getMe,
    isSignedIn && hasConvex() ? {} : "skip",
  );

  const email =
    user?.primaryEmailAddress?.emailAddress ??
    profile?.email ??
    undefined;

  const imageUrl = user?.imageUrl ?? profile?.avatarUrl ?? undefined;

  const name =
    [profile?.firstName ?? user?.firstName, profile?.lastName ?? user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    user?.fullName ||
    undefined;

  return {
    isLoaded,
    isSignedIn,
    email,
    imageUrl,
    name,
  };
}
