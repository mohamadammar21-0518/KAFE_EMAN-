import { useAuth, useClerk } from "@clerk/react";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { useAuthModal } from "@/auth/AuthModalContext";
import { clerkSignInAppearance } from "@/auth/clerkSignInAppearance";
import { hasConvex } from "@/providers/AppProviders";

function authRedirectUrl(path: string | null) {
  if (!path || typeof window === "undefined") return undefined;
  return `${window.location.origin}${path}`;
}

/**
 * Opens Clerk's built-in sign-in modal (Google / email / phone).
 * Avoids embedding <SignIn /> in a custom shell, which stays blank when signInUrl is /login.
 */
export function SignInModal() {
  const location = useLocation();
  const clerk = useClerk();
  const { isOpen, returnPath, closeSignIn } = useAuthModal();
  const { isLoaded, isSignedIn } = useAuth();
  const syncProfile = useMutation(api.users.syncProfile);
  const navigate = useNavigate();
  const handledSignInRef = useRef(false);
  const openedClerkRef = useRef(false);

  const onDedicatedLoginPage =
    location.pathname === "/login" || location.pathname === "/sign-in";

  useEffect(() => {
    if (!isOpen) {
      openedClerkRef.current = false;
      handledSignInRef.current = false;
      if (clerk.loaded) clerk.closeSignIn();
      return;
    }

    if (onDedicatedLoginPage || !clerk.loaded || !isLoaded || isSignedIn) return;
    if (openedClerkRef.current) return;

    openedClerkRef.current = true;
    const redirectUrl =
      authRedirectUrl(returnPath ?? "/account") ?? window.location.href;

    clerk.openSignIn({
      forceRedirectUrl: redirectUrl,
      fallbackRedirectUrl: redirectUrl,
      appearance: clerkSignInAppearance,
      oauthFlow: "redirect",
    });
  }, [
    isOpen,
    clerk,
    clerk.loaded,
    isLoaded,
    isSignedIn,
    returnPath,
    onDedicatedLoginPage,
  ]);

  useEffect(() => {
    if (!isOpen || !clerk.loaded || isSignedIn) return;

    let sawClerkModal = false;
    const observer = new MutationObserver(() => {
      const clerkModal = document.querySelector(
        ".cl-modalBackdrop, .cl-modal, [data-clerk-modal]",
      );
      if (clerkModal) {
        sawClerkModal = true;
        return;
      }
      if (sawClerkModal) closeSignIn();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isOpen, clerk.loaded, isSignedIn, closeSignIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !isOpen || handledSignInRef.current) return;
    handledSignInRef.current = true;

    const path = returnPath;
    closeSignIn();
    if (clerk.loaded) clerk.closeSignIn();

    if (hasConvex()) void syncProfile({});

    if (path) navigate(path, { replace: true });
  }, [
    isLoaded,
    isSignedIn,
    isOpen,
    returnPath,
    closeSignIn,
    navigate,
    syncProfile,
    clerk,
  ]);

  return null;
}
