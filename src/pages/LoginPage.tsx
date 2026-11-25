import { useEffect } from "react";
import { SignIn, useAuth } from "@clerk/react";
import { useMutation } from "convex/react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { clerkSignInAppearance } from "@/auth/clerkSignInAppearance";
import { hasClerk, hasConvex } from "@/providers/AppProviders";

/** Clerk OAuth / dashboard sign-in URL — hosts embedded SignIn (Google, email, phone). */
export function LoginPage() {
  if (!hasClerk()) {
    return <Navigate to="/" replace />;
  }
  return <LoginPageClerk />;
}

function LoginPageClerk() {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const syncProfile = useMutation(api.users.syncProfile);

  const returnPath =
    (location.state as { from?: string } | null)?.from ?? "/account";
  const redirectUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${returnPath}`
      : returnPath;

  useEffect(() => {
    if (isSignedIn && hasConvex()) void syncProfile({});
  }, [isSignedIn, syncProfile]);

  if (isLoaded && isSignedIn) {
    return <Navigate to={returnPath} replace />;
  }

  return (
    <section className="container-main flex justify-center py-16 md:py-24">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-outline/40 bg-white/90 shadow-card">
        <div className="border-b border-outline/40 bg-cream/40 px-6 pb-4 pt-8 text-center">
          <h1 className="text-headline-md text-coffee-dark">Your Kafe Eman account</h1>
          <p className="mt-2 text-sm text-muted">
            Continue with Google, email, or the phone option configured in Clerk.
          </p>
        </div>
        <div className="flex justify-center px-4 py-6">
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/login"
            forceRedirectUrl={redirectUrl}
            signUpForceRedirectUrl={redirectUrl}
            appearance={clerkSignInAppearance}
            oauthFlow="redirect"
          />
        </div>
        <p className="border-t border-outline/40 px-6 py-3 text-center text-xs text-muted">
          Customer sign-in only — not for staff.
        </p>
      </div>
    </section>
  );
}
