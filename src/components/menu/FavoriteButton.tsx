import { useState, type MouseEvent } from "react";
import { Heart } from "lucide-react";
import { useAuthModal } from "@/auth/AuthModalContext";
import { useFavoriteMenuIds, useToggleFavorite } from "@/hooks/useFavorites";
import type { MenuItem } from "@/data/content";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  item: Pick<MenuItem, "_id" | "name" | "price" | "imageUrl" | "description" | "category">;
  branchSlug?: string;
  /** `card` = overlay on menu tile; `inline` = next to title in modal */
  variant?: "card" | "inline";
  className?: string;
};

export function FavoriteButton({
  item,
  branchSlug,
  variant = "card",
  className,
}: FavoriteButtonProps) {
  const favoriteIds = useFavoriteMenuIds();
  const { toggleFavorite, isSignedIn } = useToggleFavorite();
  const { openSignIn } = useAuthModal();
  const [busy, setBusy] = useState(false);

  const favorited = favoriteIds.has(item._id);

  async function onClick(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;

    if (!isSignedIn) {
      openSignIn("general", "/menu");
      return;
    }

    setBusy(true);
    try {
      await toggleFavorite(item, branchSlug);
    } catch (err) {
      if (err instanceof Error && err.message === "SIGN_IN_REQUIRED") {
        openSignIn("general", "/menu");
      }
    } finally {
      setBusy(false);
    }
  }

  const label = favorited
    ? `Remove ${item.name} from favourites`
    : `Add ${item.name} to favourites`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={favorited}
      aria-label={label}
      title={favorited ? "Saved to favourites" : "Save to favourites"}
      className={cn(
        "inline-flex items-center justify-center rounded-full border transition",
        variant === "card" &&
          "absolute right-2 top-2 z-10 h-9 w-9 border-white/80 bg-white/90 text-coffee-dark shadow-sm backdrop-blur-sm hover:bg-white",
        variant === "inline" &&
          "h-9 w-9 border-outline-variant/50 bg-surface text-muted hover:border-primary/30 hover:text-primary",
        favorited && "border-red-200 bg-red-50 text-red-600 hover:bg-red-50",
        busy && "opacity-60",
        className,
      )}
    >
      <Heart
        className={cn("h-4 w-4", favorited && "fill-current")}
        aria-hidden
      />
    </button>
  );
}
