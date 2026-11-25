import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { PageTransition } from "@/components/motion/PageTransition";
import { BranchProvider } from "@/branch/BranchContext";
import { BranchConvexSync } from "@/branch/BranchConvexSync";
import { BranchPickerModal } from "@/components/branch/BranchPickerModal";
import { CartProvider } from "@/cart/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AuthModalProvider } from "@/auth/AuthModalContext";
import { OnboardingProvider } from "@/auth/OnboardingContext";
import { OnboardingGate } from "@/components/auth/OnboardingGate";
import { OnboardingModal } from "@/components/auth/OnboardingModal";
import { SignInModal } from "@/components/auth/SignInModal";
import { MenuImagePrefetch } from "@/components/menu/MenuImagePrefetch";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { RewardEligibleModal } from "@/components/rewards/RewardEligibleModal";
import { AiChatFab } from "@/components/ai/AiChatFab";
import { hasClerk, hasConvex } from "@/providers/AppProviders";

function SiteShell() {
  const location = useLocation();
  return (
    <div className="site-shell flex min-h-screen flex-col bg-surface">
      <ScrollToTop />
      <MenuImagePrefetch />
      <Navbar />
      <main className="site-main flex-1" data-home={location.pathname === "/"}>
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
      <BranchPickerModal />
      <CartDrawer />
      {hasClerk() && (
        <>
          <BranchConvexSync />
          <RewardEligibleModal />
          <SignInModal />
          <OnboardingModal />
          <OnboardingGate />
          {hasConvex() && <AiChatFab />}
        </>
      )}
    </div>
  );
}

export function Layout() {
  const shell = (
    <CartProvider>
      <SiteShell />
    </CartProvider>
  );

  return (
    <BranchProvider>
      {hasClerk() ? (
        <AuthModalProvider>
          <OnboardingProvider>{shell}</OnboardingProvider>
        </AuthModalProvider>
      ) : (
        shell
      )}
    </BranchProvider>
  );
}
