import { useRef, useState } from "react";

/** Prevents duplicate form submits before React re-renders with busy=true. */
export function useSubmitGuard() {
  const [busy, setBusy] = useState(false);
  const inFlightRef = useRef(false);

  async function run(fn: () => Promise<void>): Promise<boolean> {
    if (inFlightRef.current) return false;
    inFlightRef.current = true;
    setBusy(true);
    try {
      await fn();
      return true;
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  }

  function isLocked() {
    return inFlightRef.current || busy;
  }

  return { busy, run, isLocked };
}
