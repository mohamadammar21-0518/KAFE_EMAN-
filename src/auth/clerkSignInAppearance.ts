/** Shared Clerk `<SignIn />` styling for modal and `/login` page. */
export const clerkSignInAppearance = {
  elements: {
    rootBox: "w-full",
    card: "shadow-none border-0 bg-white p-0 w-full",
    cardBox: "w-full",
    headerTitle: "text-coffee-dark",
    headerSubtitle: "text-muted",
    socialButtonsBlockButton:
      "border border-outline/40 bg-white text-coffee-dark hover:bg-cream/50 rounded-xl py-3 font-medium",
    socialButtonsProviderIcon__google: "h-5 w-5",
    dividerLine: "bg-outline/30",
    dividerText: "text-muted text-xs",
    formButtonPrimary: "bg-coffee-dark hover:bg-coffee-hover text-white",
    formFieldInput: "border border-outline/40",
    footerActionLink: "text-brand-green",
  },
} as const;
