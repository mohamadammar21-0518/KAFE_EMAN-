import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useOnboarding } from "@/auth/useOnboarding";
import { useBranch } from "@/branch/BranchContext";
import {
  joinPhoneNumber,
  PHONE_DIAL_CODES,
  splitPhoneNumber,
} from "@/lib/phoneDialCodes";
import {
  isAddressSelectionComplete,
  profileToAddressFields,
  resolveStreetLine,
} from "@/lib/addressLocations";
import {
  AddressLocationFields,
  type AddressLocationValue,
} from "@/components/auth/AddressLocationFields";
import { UserAvatar } from "@/components/user/UserAvatar";
import { useCart } from "@/cart/CartContext";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { cn } from "@/lib/utils";

type Step = "name" | "details" | "phone" | "done";

export function OnboardingModal() {
  const navigate = useNavigate();
  const { isOpen, source, closeOnboarding, markOnboardingFinished } = useOnboarding();
  const { openCart } = useCart();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { imageUrl: clerkAvatar, email: clerkEmail, name: clerkName } = useUserAvatar();
  const profile = useQuery(api.users.getMe, isSignedIn ? {} : "skip");

  // Reset initialized flag when modal closes so next open re-reads profile
  useEffect(() => {
    if (!isOpen) setInitialized(false);
  }, [isOpen]);

  const sendPhoneCode = useMutation(api.users.sendPhoneCode);
  const verifyPhoneCode = useMutation(api.users.verifyPhoneCode);
  const updateProfile = useMutation(api.users.updateProfile);
  const setHomeBranch = useMutation(api.users.setHomeBranch);
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const { branchId } = useBranch();

  useLockBodyScroll(isOpen);

  const [step, setStep] = useState<Step>("name");
  const [useClerkName, setUseClerkName] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [addressFields, setAddressFields] = useState<AddressLocationValue>({
    country: "",
    region: "",
    city: "",
    addressLine: "",
    customAddress: "",
  });
  const [dialCode, setDialCode] = useState("+60");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [code, setCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [welcomePoints, setWelcomePoints] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fullPhone = useMemo(
    () => joinPhoneNumber(dialCode, phoneLocal),
    [dialCode, phoneLocal],
  );

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    if (initialized) return; // Don't reset after first load
    setFirstName(user.firstName ?? profile?.firstName ?? "");
    setLastName(user.lastName ?? profile?.lastName ?? "");
    setEmail(user.primaryEmailAddress?.emailAddress ?? profile?.email ?? "");
    const existingPhone = profile?.phone ?? user.primaryPhoneNumber?.phoneNumber ?? "";
    const split = splitPhoneNumber(existingPhone);
    setDialCode(split.dial);
    setPhoneLocal(split.local);
    setDateOfBirth(profile?.dateOfBirth ?? "");
    setAddressFields(
      profileToAddressFields({
        country: profile?.country,
        region: profile?.region,
        city: profile?.city,
        address: profile?.address,
      }),
    );
    setPhoneVerified(profile?.phoneVerified ?? false);
    setCodeSent(false);
    setCode("");
    setStep("name");
    setError(null);
    setDevCode(null);
    setWelcomePoints(0);
    setInitialized(true);
  }, [isOpen, user, profile, initialized]);

  useEffect(() => {
    if (profile && !profile.needsOnboarding && isOpen) {
      closeOnboarding();
      setInitialized(false);
    }
  }, [profile, isOpen, closeOnboarding]);

  if (!isSignedIn) return null;

  async function handleSendCode() {
    setBusy(true);
    setError(null);
    try {
      const result = await sendPhoneCode({ phone: fullPhone });
      setDevCode(result.devCode);
      setPhoneVerified(false);
      setCodeSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode() {
    setBusy(true);
    setError(null);
    try {
      await verifyPhoneCode({ phone: fullPhone, code });
      setPhoneVerified(true);
      setDevCode(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  function goToAccountDashboard() {
    markOnboardingFinished();
    closeOnboarding();
    navigate("/account", { replace: true });
    if (source === "cart") {
      openCart();
    }
  }

  async function handleSaveDetails() {
    setBusy(true);
    setError(null);
    try {
      const streetLine = resolveStreetLine(
        addressFields.addressLine,
        addressFields.customAddress,
      );
      console.log("Step 1: calling updateProfile...");
      await updateProfile({
        firstName,
        lastName: lastName || undefined,
        email,
        dateOfBirth,
        country: addressFields.country,
        region: addressFields.region,
        city: addressFields.city,
        address: streetLine,
      });
      console.log("Step 2: updateProfile done, calling setHomeBranch with branchId:", branchId);
      if (branchId) {
        await setHomeBranch({ branchSlug: branchId });
      }
      console.log("Step 3: all done, moving to phone step");
      setStep("phone");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save your details.";
      console.error("handleSaveDetails error:", e);
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleFinish() {
    setBusy(true);
    setError(null);
    try {
      const streetLine = resolveStreetLine(
        addressFields.addressLine,
        addressFields.customAddress,
      );
      const result = await completeOnboarding({
        firstName,
        lastName: lastName || undefined,
        email,
        dateOfBirth,
        country: addressFields.country,
        region: addressFields.region,
        city: addressFields.city,
        address: streetLine,
        phone: fullPhone,
        branchSlug: branchId,
      });
      setWelcomePoints(result.welcomeBonusPoints);
      setStep("done");
      goToAccountDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setBusy(false);
    }
  }

  const clerkFullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            className="fixed inset-x-4 top-[8vh] z-[101] mx-auto max-h-[84vh] max-w-lg overflow-y-auto rounded-3xl border border-outline/40 bg-surface shadow-2xl md:inset-x-auto md:left-1/2 md:w-full md:-translate-x-1/2"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
          >
            <div className="flex items-start justify-between border-b border-outline/40 px-6 py-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                  Step {step === "name" ? 1 : step === "details" ? 2 : step === "phone" ? 3 : 4} of 4
                </p>
                <h2 id="onboarding-title" className="mt-1 text-headline-md text-coffee-dark">
                  {step === "name" && "Welcome to Kafe Eman"}
                  {step === "details" && "Delivery details"}
                  {step === "phone" && "Verify your phone"}
                  {step === "done" && "You're all set!"}
                </h2>
                {source === "cart" && step !== "done" && (
                  <p className="mt-1 text-xs text-muted">
                    Complete your profile, then we will continue your order.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeOnboarding}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-outline/40 text-muted hover:bg-cream"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {error && (
                <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              {step === "name" && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <UserAvatar
                      imageUrl={clerkAvatar ?? profile?.avatarUrl}
                      email={clerkEmail ?? email}
                      name={clerkName}
                      size="lg"
                    />
                  </div>
                  <p className="text-sm text-muted">
                    We fetched your profile from Google. Is this the name we should use for your
                    orders?
                  </p>
                  {clerkFullName && (
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-outline/40 bg-white/70 p-4">
                      <input
                        type="radio"
                        checked={useClerkName}
                        onChange={() => {
                          setUseClerkName(true);
                          setFirstName(user?.firstName ?? "");
                          setLastName(user?.lastName ?? "");
                        }}
                      />
                      <span className="text-sm">
                        <span className="font-medium text-coffee-dark">Use my sign-in name</span>
                        <br />
                        <span className="text-muted">{clerkFullName}</span>
                      </span>
                    </label>
                  )}
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-outline/40 bg-white/70 p-4">
                    <input
                      type="radio"
                      checked={!useClerkName}
                      onChange={() => setUseClerkName(false)}
                    />
                    <span className="text-sm font-medium text-coffee-dark">Use a different name</span>
                  </label>
                  {!useClerkName && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="rounded-xl border border-outline/40 bg-white px-4 py-3 text-sm"
                      />
                      <input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="rounded-xl border border-outline/40 bg-white px-4 py-3 text-sm"
                      />
                    </div>
                  )}
                  <label className="grid gap-2 text-sm">
                    <span className="text-muted">Email from your account</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl border border-outline/40 bg-white px-4 py-3"
                    />
                  </label>
                </div>
              )}

              {step === "details" && (
                <div className="grid gap-3">
                  <label className="grid gap-2 text-sm">
                    <span className="text-muted">Date of birth</span>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="rounded-xl border border-outline/40 bg-white px-4 py-3"
                      required
                    />
                  </label>
                  <p className="text-sm text-muted">
                    Choose your country, region, city, then pick your street address from the
                    list (or enter a custom one).
                  </p>
                  <AddressLocationFields
                    value={addressFields}
                    onChange={setAddressFields}
                  />
                </div>
              )}

              {step === "phone" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted">
                    Verify your mobile number, then tap <strong className="text-coffee-dark">Finish</strong>{" "}
                    to open your account dashboard (orders, rewards, and profile).
                  </p>
                  <div className="flex gap-2">
                    <label className="grid shrink-0 gap-1 text-sm">
                      <span className="text-muted">Code</span>
                      <select
                        value={dialCode}
                        disabled={phoneVerified}
                        onChange={(e) => {
                          setDialCode(e.target.value);
                          setPhoneVerified(false);
                          setCodeSent(false);
                          setDevCode(null);
                          setCode("");
                        }}
                        className="rounded-xl border border-outline/40 bg-white px-3 py-3 text-sm"
                      >
                        {PHONE_DIAL_CODES.map((c) => (
                          <option key={c.dial} value={c.dial}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid min-w-0 flex-1 gap-1 text-sm">
                      <span className="text-muted">Phone number</span>
                      <input
                        value={phoneLocal}
                        disabled={phoneVerified}
                        onChange={(e) => {
                          setPhoneLocal(e.target.value);
                          setPhoneVerified(false);
                          setCodeSent(false);
                          setDevCode(null);
                          setCode("");
                        }}
                        placeholder="12 345 6789"
                        className="w-full rounded-xl border border-outline/40 bg-white px-4 py-3 text-sm"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted">
                    Full number: <span className="font-medium text-coffee-dark">{fullPhone}</span>
                  </p>
                  {!phoneVerified && !codeSent && (
                    <button
                      type="button"
                      disabled={busy || phoneLocal.replace(/\D/g, "").length < 8}
                      onClick={handleSendCode}
                      className="text-sm font-medium text-brand-green underline disabled:opacity-50"
                    >
                      {busy ? "Sending…" : "Send verification code"}
                    </button>
                  )}
                  {devCode && !phoneVerified && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      Dev mode: your code is <strong>{devCode}</strong>
                    </p>
                  )}
                  {codeSent && !phoneVerified && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder="6-digit code"
                          className="flex-1 rounded-xl border border-outline/40 bg-white px-4 py-3 text-sm"
                        />
                        <button
                          type="button"
                          disabled={busy || code.length < 4}
                          onClick={handleVerifyCode}
                          className="btn-ref-primary shrink-0 rounded-full px-5 py-3 text-sm font-medium text-white"
                        >
                          Verify
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-muted underline"
                        onClick={() => {
                          setCodeSent(false);
                          setDevCode(null);
                          setCode("");
                        }}
                      >
                        Change phone number
                      </button>
                    </div>
                  )}
                  {phoneVerified && (
                    <p className="text-sm font-medium text-brand-green">Phone verified</p>
                  )}
                </div>
              )}

              {step === "done" && (
                <div className="text-center">
                  <p className="text-sm text-on-surface">
                    Your customer profile is ready. Track orders, rewards, and coupons from your
                    account dashboard.
                  </p>
                  {source === "cart" && (
                    <p className="mt-2 text-sm text-muted">Returning to your cart to place the order…</p>
                  )}
                  {welcomePoints > 0 && (
                    <p className="mt-4 rounded-2xl border border-brand-green/25 bg-brand-green/10 px-4 py-3 text-sm font-medium text-brand-green">
                      Welcome gift: +{welcomePoints} reward points!
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-outline/40 px-6 py-4">
              {step !== "done" && step !== "name" && (
                <button
                  type="button"
                  className="rounded-full px-4 py-2.5 text-sm text-muted hover:bg-cream"
                  onClick={() =>
                    setStep(step === "phone" ? "details" : "name")
                  }
                >
                  Back
                </button>
              )}
              {step === "name" && (
                <button
                  type="button"
                  disabled={!firstName.trim() || !email.trim()}
                  onClick={() => setStep("details")}
                  className={cn(
                    "btn-ref-primary rounded-full px-6 py-2.5 text-sm font-medium text-white",
                    (!firstName.trim() || !email.trim()) && "opacity-50",
                  )}
                >
                  Continue
                </button>
              )}
              {step === "details" && (
                <button
                  type="button"
                  disabled={
                    busy || !dateOfBirth || !isAddressSelectionComplete(addressFields)
                  }
                  onClick={() => {
                    console.log("Details state:", {
                      dateOfBirth,
                      addressFields,
                      isComplete: isAddressSelectionComplete(addressFields),
                      busy,
                    });
                    void handleSaveDetails();
                  }}
                  className={cn(
                    "btn-ref-primary rounded-full px-6 py-2.5 text-sm font-medium text-white",
                    (busy ||
                      !dateOfBirth ||
                      !isAddressSelectionComplete(addressFields)) &&
                      "opacity-50",
                  )}
                >
                  {busy ? "Saving…" : "Save & continue"}
                </button>
              )}
              {step === "phone" && (
                <button
                  type="button"
                  disabled={!phoneVerified || busy}
                  onClick={handleFinish}
                  className={cn(
                    "btn-ref-primary rounded-full px-6 py-2.5 text-sm font-medium text-white",
                    !phoneVerified && "opacity-50",
                  )}
                >
                  {busy ? "Saving…" : "Finish"}
                </button>
              )}
              {step === "done" && (
                <button
                  type="button"
                  onClick={goToAccountDashboard}
                  className="btn-ref-primary rounded-full px-6 py-2.5 text-sm font-medium text-white"
                >
                  {source === "cart" ? "Continue to checkout" : "Open my dashboard"}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
