import { Link, useNavigate } from "react-router-dom";
import { useAuth, useClerk } from "@clerk/react";
import { UserRound } from "lucide-react";
import { useAuthModal } from "@/auth/AuthModalContext";
import { UserAvatar } from "@/components/user/UserAvatar";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { hasClerk } from "@/providers/AppProviders";

export function NavbarAccountButton({ onNavigate }: { onNavigate?: () => void }) {
  if (!hasClerk()) {
    return (
      <button
        type="button"
        className="group inline-flex h-10 items-center gap-2.5 rounded-full border border-white/90 bg-surface/95 px-3.5 backdrop-blur-[8px]"
        aria-label="Account"
        title="Set VITE_CLERK_PUBLISHABLE_KEY to enable accounts"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/40 bg-cream text-coffee-title">
          <UserRound className="h-4.5 w-4.5" />
        </span>
        <span className="text-sm font-normal text-coffee-title">Account</span>
      </button>
    );
  }

  return <NavbarAccountButtonClerk onNavigate={onNavigate} />;
}

function NavbarAccountButtonClerk({ onNavigate }: { onNavigate?: () => void }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { email, imageUrl, name } = useUserAvatar();
  const clerk = useClerk();
  const { openSignIn } = useAuthModal();
  const navigate = useNavigate();

  if (!isLoaded) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex h-10 items-center gap-2.5 rounded-full border border-white/90 bg-surface/95 px-3.5 opacity-70 backdrop-blur-[8px]"
        aria-label="Loading account"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/40 bg-cream text-coffee-title">
          <UserRound className="h-4.5 w-4.5" />
        </span>
        <span className="text-sm font-normal text-coffee-title">Account</span>
      </button>
    );
  }

  if (isSignedIn) {
    const label = name?.split(" ")[0] || email?.split("@")[0] || "My account";

    return (
      <Link
        to="/account"
        onClick={onNavigate}
        className="group inline-flex h-10 items-center gap-2.5 rounded-full border border-white/90 bg-surface/95 px-3.5 backdrop-blur-[8px] transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface hover:shadow-[0_8px_20px_rgba(0,0,0,0.07)] no-underline"
      >
        <UserAvatar imageUrl={imageUrl} email={email} name={name} size="sm" priority />
        <span className="text-sm font-normal text-coffee-title">{label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        onNavigate?.();
        if (!clerk.loaded) {
          navigate("/login", { state: { from: "/account" } });
          return;
        }
        openSignIn("account", "/account");
      }}
      className="group inline-flex h-10 items-center gap-2.5 rounded-full border border-white/90 bg-surface/95 px-3.5 backdrop-blur-[8px] transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface hover:shadow-[0_8px_20px_rgba(0,0,0,0.07)]"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/40 bg-cream text-coffee-title transition-colors duration-300 group-hover:bg-white">
        <UserRound className="h-4.5 w-4.5" />
      </span>
      <span className="text-sm font-normal text-coffee-title">Log in</span>
    </button>
  );
}
