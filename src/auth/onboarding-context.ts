import { createContext } from "react";

export type OnboardingSource = "cart" | "account" | "general";

export type OnboardingContextValue = {
  isOpen: boolean;
  source: OnboardingSource;
  resumeCheckout: boolean;
  onboardingFinished: boolean;
  markOnboardingFinished: () => void;
  openOnboarding: (source?: OnboardingSource) => void;
  closeOnboarding: () => void;
  prepareCheckoutAfterAuth: () => void;
  clearResumeCheckout: () => void;
};

export const OnboardingContext = createContext<OnboardingContextValue | null>(null);
