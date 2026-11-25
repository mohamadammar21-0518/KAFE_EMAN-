import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useOnboarding } from "@/auth/useOnboarding";
import { hasConvex } from "@/providers/AppProviders";

/** Opens onboarding once per sign-in when profile setup is incomplete. */
export function OnboardingGate() {
  const { isSignedIn } = useAuth();
  const profile = useQuery(api.users.getMe, isSignedIn && hasConvex() ? {} : "skip");
  const syncProfile = useMutation(api.users.syncProfile);
  const { openOnboarding, isOpen, resumeCheckout } = useOnboarding();
  const promptedThisSession = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !hasConvex()) return;
    void syncProfile({});
  }, [isSignedIn, syncProfile]);

  useEffect(() => {
    if (!isSignedIn) {
      promptedThisSession.current = false;
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (
      !isSignedIn ||
      profile === undefined ||
      profile === null ||
      !profile.needsOnboarding ||
      isOpen ||
      promptedThisSession.current
    ) {
      return;
    }
    promptedThisSession.current = true;
    openOnboarding(resumeCheckout ? "cart" : "account");
  }, [isSignedIn, profile, isOpen, resumeCheckout, openOnboarding]);

  return null;
}
