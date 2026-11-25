import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@clerk/react";
import { useCallback, useMemo } from "react";
import { api } from "../../convex/_generated/api";
import type { MenuCategory, MenuItem } from "@/data/content";
import { hasConvex } from "@/providers/AppProviders";

export function useFavoriteMenuIds(): Set<string> {
  const { isSignedIn } = useAuth();
  const ids = useQuery(
    api.userFavorites.myFavoriteIds,
    hasConvex() && isSignedIn ? {} : "skip",
  );
  return useMemo(() => new Set(ids ?? []), [ids]);
}

export function useToggleFavorite() {
  const { isSignedIn } = useAuth();
  const toggle = useMutation(api.userFavorites.toggle);

  const toggleFavorite = useCallback(
    async (item: Pick<MenuItem, "_id" | "name" | "price" | "imageUrl" | "description" | "category">, branchSlug?: string) => {
      if (!isSignedIn) {
        throw new Error("SIGN_IN_REQUIRED");
      }
      return await toggle({
        menuItemId: item._id,
        branchSlug,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        description: item.description,
        category: item.category,
      });
    },
    [isSignedIn, toggle],
  );

  return { toggleFavorite, isSignedIn };
}

export type FavoriteMenuRow = {
  _id: string;
  menuItemId: string;
  branchSlug?: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  category?: string;
  outOfStock?: boolean;
  createdAt: number;
};

export function useMyFavorites(): FavoriteMenuRow[] | undefined {
  const { isSignedIn } = useAuth();
  const rows = useQuery(
    api.userFavorites.myFavorites,
    hasConvex() && isSignedIn ? {} : "skip",
  );
  return rows as FavoriteMenuRow[] | undefined;
}

export function favoriteToMenuItem(row: FavoriteMenuRow): MenuItem {
  return {
    _id: row.menuItemId,
    name: row.name,
    price: row.price,
    description: row.description,
    imageUrl: row.imageUrl,
    category: (row.category ?? "signature") as MenuCategory,
    featured: false,
    sortOrder: 0,
  };
}
