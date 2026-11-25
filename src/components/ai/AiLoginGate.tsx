import { useClerk } from "@clerk/react";
import { LogIn } from "lucide-react";

/**
 * Shown to guests who open the AI chat widget before signing in.
 * Offers a login CTA that opens the Clerk sign-in modal.
 */
export function AiLoginGate() {
  const { openSignIn } = useClerk();

  return (
    <div className="flex h-full flex-col items-start gap-4 overflow-y-auto bg-[#faf6ed] p-5">
      <img src="/Images/eman-table.webp" alt="" className="min-h-16 max-h-48 w-full flex-1 rounded-2xl object-cover" />
      <div>
        <p className="font-serif text-3xl leading-tight text-[#243329]">Welcome to the café.</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">Sign in to explore the menu, find a branch, or ask about your orders and rewards.</p>
      </div>
      <button
        type="button"
        onClick={() => openSignIn({})}
        className="flex items-center gap-2 rounded-full bg-coffee-dark px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-coffee-dark/90"
      >
        <LogIn className="h-4 w-4" />
        Log in to your account
      </button>
    </div>
  );
}
