import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BRANCHES } from "@/data/content";
import { hasConvex } from "@/providers/AppProviders";

export type BranchId = string;

export type BranchInfo = {
  id: BranchId;
  label: string;
  subtitle?: string;
  address: string;
  concept?: string;
  hours: readonly string[];
  /** ISO 4217 code for menu, cart, and checkout (default USD). */
  currency?: string;
};

type BranchContextValue = {
  branches: BranchInfo[];
  branchId: BranchId;
  /** Update selected branch (localStorage). Convex sync runs in BranchConvexSync when signed in. */
  setBranchId: (id: BranchId) => void;
  /** Same as setBranchId but skips server write (used when loading profile branch). */
  setBranchIdLocal: (id: BranchId) => void;
  showBranchPicker: boolean;
  openBranchPicker: () => void;
  closeBranchPicker: () => void;
};

const BranchContext = createContext<BranchContextValue | null>(null);

const STORAGE_KEY = "kafeeman.branchId";

function staticBranches(): BranchInfo[] {
  return BRANCHES.map((b) => ({
    id: b.id,
    label: b.label,
    subtitle: b.subtitle,
    address: b.address,
    concept: "concept" in b ? b.concept : undefined,
    hours: b.hours,
    currency: b.currency,
  }));
}

function persistBranchId(id: BranchId) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const remote = useQuery(api.branches.listActive, hasConvex() ? {} : "skip");

  const branches = useMemo((): BranchInfo[] => {
    if (remote && remote.length > 0) {
      return remote.map((b) => ({
        id: b.slug,
        label: b.label,
        subtitle: b.subtitle,
        address: b.address,
        concept: b.concept,
        hours: b.hours,
        currency: b.currency,
      }));
    }
    return staticBranches();
  }, [remote]);

  const [branchId, setBranchIdState] = useState<BranchId>(branches[0]?.id ?? "alor-setar");
  const [showBranchPicker, setShowBranchPicker] = useState(false);

  useEffect(() => {
    if (!branches.length) return;
    if (!branches.some((b) => b.id === branchId)) {
      setBranchIdState(branches[0].id);
    }
  }, [branches, branchId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && branches.some((b) => b.id === saved)) {
        setBranchIdState(saved);
      } else if (!saved && window.location.pathname !== "/") {
        setShowBranchPicker(true);
      }
    } catch {
      // ignore
    }
  }, [branches]);

  const setBranchIdLocal = useCallback((id: BranchId) => {
    setBranchIdState(id);
    persistBranchId(id);
  }, []);

  const setBranchId = useCallback(
    (id: BranchId) => {
      setBranchIdLocal(id);
    },
    [setBranchIdLocal],
  );

  const value = useMemo(
    () => ({
      branches,
      branchId,
      setBranchId,
      setBranchIdLocal,
      showBranchPicker,
      openBranchPicker: () => setShowBranchPicker(true),
      closeBranchPicker: () => setShowBranchPicker(false),
    }),
    [branches, branchId, setBranchId, setBranchIdLocal, showBranchPicker],
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used inside BranchProvider");
  return ctx;
}
