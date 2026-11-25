import { useEffect, useMemo } from "react";
import { useBranch } from "@/branch/BranchContext";
import { REF_HERO_VIDEO, resolveMenuImageUrl } from "@/data/refAssets";
import { SITE_MEDIA } from "@/data/siteAssets";
import { useMenuItems } from "@/hooks/useData";
import { useBranchMenuCatalog } from "@/hooks/useConvexData";
import { prefetchImages } from "@/lib/prefetchImages";

/**
 * Starts menu catalog subscription early and prefetches product images
 * so the menu page feels instant after navigation.
 */
export function MenuImagePrefetch() {
  const { branchId } = useBranch();
  useBranchMenuCatalog(branchId);
  const items = useMenuItems({ branchId });

  const urls = useMemo(() => {
    const fromItems = items
      .filter((i) => i.featured)
      .concat(items.filter((i) => !i.featured))
      .slice(0, 18)
      .map((i) => resolveMenuImageUrl(i.name, i.imageUrl, i.category));

    return [REF_HERO_VIDEO, SITE_MEDIA.heritage.src, ...fromItems];
  }, [items]);

  useEffect(() => {
    if (!urls.length) return;
    prefetchImages(urls, 22);
  }, [urls]);

  return null;
}
