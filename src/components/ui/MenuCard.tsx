import { motion, useReducedMotion } from "framer-motion";
import { formatPrice, type MenuCategory } from "@/data/content";
import { resolveMenuImageUrl } from "@/data/refAssets";
import { prefetchImage } from "@/lib/prefetchImages";
import { cardSpring } from "@/motion/presets";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { FavoriteButton } from "@/components/menu/FavoriteButton";
import type { MenuItem } from "@/data/content";
import { cn } from "@/lib/utils";

interface MenuCardProps {
  menuItem?: Pick<
    MenuItem,
    "_id" | "name" | "price" | "imageUrl" | "description" | "category"
  >;
  branchSlug?: string;
  showFavorite?: boolean;
  name: string;
  price: number;
  currency?: string;
  description?: string;
  imageUrl?: string;
  category?: MenuCategory;
  index?: number;
  /** `grid` = menu page (Coffee Bean–style tiles). `stack` = home signature column. */
  variant?: "grid" | "stack";
  featured?: boolean;
  priority?: boolean;
  onOpen?: () => void;
}

function MenuCardImage({
  name,
  imageUrl,
  category,
  variant,
  priority,
}: {
  name: string;
  imageUrl?: string;
  category?: MenuCategory;
  variant: "grid" | "stack";
  priority?: boolean;
}) {
  const image = resolveMenuImageUrl(name, imageUrl, category);

  function warmCache() {
    if (image) prefetchImage(image);
  }

  if (variant === "stack") {
    return (
      <div className="menu-card-stack__image" onMouseEnter={warmCache} onFocus={warmCache}>
        {image ? (
          <OptimizedImage src={image} alt={name} priority={priority} className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl opacity-30 sm:text-5xl">
            ☕
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="menu-retail-card__image"
      onMouseEnter={warmCache}
      onFocus={warmCache}
    >
      {image ? (
        <OptimizedImage
          src={image}
          alt={name}
          priority={priority}
          className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-surface-container text-4xl opacity-25">
          ☕
        </div>
      )}
    </div>
  );
}

export function MenuCard({
  menuItem,
  branchSlug,
  showFavorite = false,
  name,
  price,
  currency,
  description,
  imageUrl,
  category,
  index = 0,
  variant = "grid",
  featured = false,
  priority = false,
  onOpen,
}: MenuCardProps) {
  const favoriteItem =
    menuItem ??
    (showFavorite
      ? {
          _id: "",
          name,
          price,
          imageUrl,
          description,
          category: category ?? "signature",
        }
      : undefined);
  const reduceMotion = useReducedMotion();
  const interactive = Boolean(onOpen);
  const priceLabel = formatPrice(price, currency);

  if (variant === "stack") {
    return (
      <motion.article
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ ...cardSpring, delay: Math.min(index * 0.06, 0.24) }}
        className={cn("menu-card-stack group", interactive && "cursor-pointer")}
        onClick={onOpen}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={(e) => {
          if (!onOpen) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        <MenuCardImage
          name={name}
          imageUrl={imageUrl}
          category={category}
          variant="stack"
          priority={priority}
        />
        <div className="menu-card-stack__overlay">
          <h3 className="menu-card-stack__title">{name}</h3>
          <p className="menu-card-stack__price">{formatPrice(price, currency)}</p>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ ...cardSpring, delay: Math.min(index * 0.05, 0.2) }}
      whileHover={reduceMotion || !interactive ? undefined : { y: -4 }}
      className={cn(
        "menu-retail-card group",
        interactive && "menu-retail-card--interactive",
      )}
      onClick={onOpen}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `View ${name}, ${priceLabel}` : undefined}
      onKeyDown={(e) => {
        if (!onOpen) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      {featured && <span className="menu-retail-card__tag">Favourite</span>}
      {showFavorite && favoriteItem?._id ? (
        <FavoriteButton item={favoriteItem} branchSlug={branchSlug} variant="card" />
      ) : null}
      <MenuCardImage
        name={name}
        imageUrl={imageUrl}
        category={category}
        variant="grid"
        priority={priority}
      />
      <div className="menu-retail-card__body">
        <h3 className="menu-retail-card__title">{name}</h3>
        {description ? (
          <p className="menu-retail-card__desc">{description}</p>
        ) : null}
        <p className="menu-retail-card__price">{priceLabel}</p>
        {interactive ? (
          <p className="menu-retail-card__hint">Tap for details</p>
        ) : null}
      </div>
    </motion.article>
  );
}
