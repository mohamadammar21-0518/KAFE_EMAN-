import type { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

function ConvexWithClerk({ children }: { children: ReactNode }) {
  if (!convex) return <>{children}</>;
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  let inner: ReactNode = children;

  if (convex && clerkKey) {
    inner = (
      <ClerkProvider
        publishableKey={clerkKey}
        afterSignOutUrl="/"
        signInFallbackRedirectUrl="/account"
        signUpFallbackRedirectUrl="/account"
      >
        <ConvexWithClerk>{children}</ConvexWithClerk>
      </ClerkProvider>
    );
  } else if (convex) {
    inner = <ConvexProvider client={convex}>{children}</ConvexProvider>;
  } else if (clerkKey) {
    inner = (
      <ClerkProvider
        publishableKey={clerkKey}
        afterSignOutUrl="/"
        signInFallbackRedirectUrl="/account"
        signUpFallbackRedirectUrl="/account"
      >
        {children}
      </ClerkProvider>
    );
  }

  return <>{inner}</>;
}

export function hasClerk() {
  return Boolean(clerkKey);
}

export function hasConvex() {
  return Boolean(convex);
}
