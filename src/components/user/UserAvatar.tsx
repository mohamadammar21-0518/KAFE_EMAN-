import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { prefetchImage } from "@/lib/prefetchImages";
import { resolveUserAvatarUrl, userInitials } from "@/lib/userAvatar";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
  xl: "h-20 w-20 text-lg",
} as const;

type UserAvatarProps = {
  imageUrl?: string | null;
  email?: string | null;
  name?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
  priority?: boolean;
};

export function UserAvatar({
  imageUrl,
  email,
  name,
  size = "md",
  className,
  priority = false,
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const src = resolveUserAvatarUrl(imageUrl, email);
  const initials = userInitials(name, email);
  const showImage = Boolean(src) && !failed;

  useEffect(() => {
    if (src) prefetchImage(src);
  }, [src]);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-outline-variant/40 bg-cream text-coffee-dark",
        sizeClasses[size],
        className,
      )}
      aria-hidden={!name && !email}
    >
      {showImage && src ? (
        <OptimizedImage
          src={src}
          alt=""
          priority={priority}
          referrerPolicy="no-referrer"
          className="h-full w-full [&_img]:rounded-full"
          onError={() => setFailed(true)}
        />
      ) : initials ? (
        <span className="font-semibold leading-none">{initials}</span>
      ) : (
        <UserRound className="h-[45%] w-[45%] opacity-70" />
      )}
    </span>
  );
}
