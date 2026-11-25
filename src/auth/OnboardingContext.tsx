import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  OnboardingContext,
  type OnboardingSource,
} from "@/auth/onboarding-context";

export type { OnboardingSource } from "@/auth/onboarding-context";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState<OnboardingSource>("general");
  const [resumeCheckout, setResumeCheckout] = useState(false);
  const [onboardingFinished, setOnboardingFinished] = useState(false);

  const markOnboardingFinished = useCallback(() => setOnboardingFinished(true), []);

  const openOnboarding = useCallback((nextSource: OnboardingSource = "general") => {
    setSource(nextSource);
    setIsOpen(true);
  }, []);

  const closeOnboarding = useCallback(() => setIsOpen(false), []);

  const prepareCheckoutAfterAuth = useCallback(() => {
    setResumeCheckout(true);
    setSource("cart");
  }, []);

  const clearResumeCheckout = useCallback(() => setResumeCheckout(false), []);

  const value = useMemo(
    () => ({
      isOpen,
      source,
      resumeCheckout,
      onboardingFinished,
      markOnboardingFinished,
      openOnboarding,
      closeOnboarding,
      prepareCheckoutAfterAuth,
      clearResumeCheckout,
    }),
    [
      isOpen,
      source,
      resumeCheckout,
      onboardingFinished,
      markOnboardingFinished,
      openOnboarding,
      closeOnboarding,
      prepareCheckoutAfterAuth,
      clearResumeCheckout,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}
