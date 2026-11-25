import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useQuery } from "convex/react";
import { MessageSquareHeart } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { FeedbackSubmitModal } from "@/components/feedback/FeedbackSubmitModal";
import { useAuthModal } from "@/auth/AuthModalContext";
import { hasClerk, hasConvex } from "@/providers/AppProviders";

function displayName(
  profile: {
    firstName?: string;
    lastName?: string;
    email: string;
  } | null,
) {
  if (!profile) return "Guest";
  const parts = [profile.firstName, profile.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return profile.email.split("@")[0] || "Guest";
}

/** Inline feedback invite — lives inside the testimonials section (same visual language). */
export function FeedbackCtaStrip() {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useAuthModal();
  const profile = useQuery(api.users.getMe, isSignedIn && hasConvex() ? {} : "skip");
  const [modalOpen, setModalOpen] = useState(false);

  if (!hasClerk() || !hasConvex()) return null;

  const authorName = displayName(profile ?? null);

  function handleOpen() {
    if (!isSignedIn) {
      openSignIn("general", "/#testimonial");
      return;
    }
    setModalOpen(true);
  }

  return (
    <>
      <div
        id="feedback-cta"
        className="mx-auto mt-10 max-w-5xl rounded-xl border border-outline-variant/40 bg-sand/30 p-6 md:mt-12 md:p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p className="text-label-sm text-primary mb-1">Share your experience</p>
            <p className="text-body-md text-on-surface">
              Signed-in guests can rate the café, a category, or a menu item. We review submissions
              before they join the carousel above.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-outline-variant/50 bg-surface px-6 py-3 text-sm font-medium text-coffee-dark transition-colors hover:bg-white/80"
          >
            <MessageSquareHeart className="h-5 w-5 text-primary" aria-hidden />
            {isSignedIn ? "Share feedback" : "Sign in to share"}
          </button>
        </div>
      </div>

      {isSignedIn && (
        <FeedbackSubmitModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          authorName={authorName}
        />
      )}
    </>
  );
}
