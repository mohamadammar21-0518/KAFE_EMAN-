import { FadeInView } from "@/components/motion/FadeInView";
import { REF_ABOUT_MOSAIC_IMAGES } from "@/data/refAssets";

export function AboutMosaic() {
  const [a, b, c, d] = REF_ABOUT_MOSAIC_IMAGES;

  return (
    <FadeInView y={18}>
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-4 md:grid-cols-12 md:gap-5">
          <div className="relative md:col-span-7 md:row-span-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <img src={a.src} alt={a.alt} width={a.width} height={a.height} className="h-full w-full object-cover" loading="lazy" decoding="async" />
              <div className="pointer-events-none absolute inset-4 rounded-md border border-cream opacity-40" />
            </div>
          </div>

          <div className="relative md:col-span-5">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
              <img src={b.src} alt={b.alt} width={b.width} height={b.height} className="h-full w-full object-cover" loading="lazy" decoding="async" />
              <div className="pointer-events-none absolute inset-4 rounded-md border border-cream opacity-40" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:col-span-5 md:gap-5">
            <div className="relative">
              <div className="relative aspect-square overflow-hidden rounded-xl">
                <img src={c.src} alt={c.alt} width={c.width} height={c.height} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                <div className="pointer-events-none absolute inset-3 rounded-md border border-cream opacity-40" />
              </div>
            </div>
            <div className="relative">
              <div className="relative aspect-square overflow-hidden rounded-xl">
                <img src={d.src} alt={d.alt} width={d.width} height={d.height} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                <div className="pointer-events-none absolute inset-3 rounded-md border border-cream opacity-40" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </FadeInView>
  );
}

