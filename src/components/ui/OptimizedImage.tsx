import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type OptimizedImageProps = {
  src: string;
  alt: string;
  className?: string;
  /** Above-the-fold or modal hero — eager load + high fetch priority */
  priority?: boolean;
  width?: number;
  height?: number;
  objectPosition?: string;
  referrerPolicy?: ImgHTMLAttributes<HTMLImageElement>["referrerPolicy"];
  onError?: () => void;
};

export function OptimizedImage({
  src,
  alt,
  className,
  priority = false,
  width,
  height,
  objectPosition,
  referrerPolicy,
  onError,
}: OptimizedImageProps) {
  const isLocalAsset = src.startsWith("/");
  const [loaded, setLoaded] = useState(isLocalAsset);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-cream text-3xl text-muted/40",
          className,
        )}
        aria-hidden
      >
        ☕
      </div>
    );
  }

  return (
    <span className={cn("relative block h-full w-full overflow-hidden", className)}>
      <span
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-cream via-sand/80 to-cream",
          "animate-pulse motion-reduce:animate-none",
          loaded ? "opacity-0" : "opacity-100",
          "transition-opacity duration-300",
        )}
        aria-hidden
      />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        referrerPolicy={referrerPolicy}
        className={cn(
          "h-full w-full object-cover",
          "transition-opacity duration-300 motion-reduce:transition-none",
          loaded ? "opacity-100" : "opacity-0",
        )}
        style={objectPosition ? { objectPosition } : undefined}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setFailed(true);
          onError?.();
        }}
      />
    </span>
  );
}
