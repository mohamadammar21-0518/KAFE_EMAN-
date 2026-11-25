import type { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const convexUrl = (import.meta.env.VITE_CONVEX_URL as string | undefined)?.trim();

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
  if (!convex) {
    return (
      <main className="grid min-h-screen place-items-center bg-surface p-6">
        <section role="alert" className="max-w-lg rounded-2xl border border-outline-variant bg-white p-8 text-coffee-dark">
          <p className="font-serif text-3xl">The café website is temporarily unavailable.</p>
          <p className="mt-3 text-sm text-muted">Please try again later.</p>
          {import.meta.env.DEV && (
            <p className="mt-5 text-sm text-muted">
              Add VITE_CONVEX_URL to .env.local, then restart the development server.
            </p>
          )}
        </section>
      </main>
    );
  }

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
