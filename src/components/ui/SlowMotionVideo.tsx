import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

/** Hero / CTA background — very slow, smooth playback (~30% speed). */
export const HERO_VIDEO_PLAYBACK_RATE = 0.3;

type SlowMotionVideoProps = ComponentPropsWithoutRef<"video"> & {
  playbackRate?: number;
};

function applyPlaybackRate(video: HTMLVideoElement, rate: number) {
  try {
    video.defaultPlaybackRate = rate;
    video.playbackRate = rate;
  } catch {
    /* unsupported */
  }
}

export function SlowMotionVideo({
  playbackRate = HERO_VIDEO_PLAYBACK_RATE,
  onLoadedMetadata,
  onPlay,
  ...props
}: SlowMotionVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const syncRate = () => applyPlaybackRate(video, playbackRate);

    syncRate();
    video.addEventListener("play", syncRate);
    video.addEventListener("ratechange", syncRate);

    return () => {
      video.removeEventListener("play", syncRate);
      video.removeEventListener("ratechange", syncRate);
    };
  }, [playbackRate]);

  return (
    <video
      ref={ref}
      onLoadedMetadata={(event) => {
        if (ref.current) applyPlaybackRate(ref.current, playbackRate);
        onLoadedMetadata?.(event);
      }}
      onPlay={(event) => {
        if (ref.current) applyPlaybackRate(ref.current, playbackRate);
        onPlay?.(event);
      }}
      {...props}
    />
  );
}
