/** Common dial codes for café customers (Malaysia default). */
export const PHONE_DIAL_CODES = [
  { dial: "+60", label: "Malaysia (+60)" },
  { dial: "+966", label: "Saudi Arabia (+966)" },
  { dial: "+971", label: "UAE (+971)" },
  { dial: "+974", label: "Qatar (+974)" },
  { dial: "+965", label: "Kuwait (+965)" },
  { dial: "+973", label: "Bahrain (+973)" },
  { dial: "+968", label: "Oman (+968)" },
  { dial: "+65", label: "Singapore (+65)" },
  { dial: "+62", label: "Indonesia (+62)" },
  { dial: "+44", label: "United Kingdom (+44)" },
  { dial: "+1", label: "United States (+1)" },
] as const;

export function splitPhoneNumber(full: string): { dial: string; local: string } {
  const trimmed = full.trim();
  if (!trimmed) return { dial: "+60", local: "" };

  const match = PHONE_DIAL_CODES.map((c) => c.dial)
    .sort((a, b) => b.length - a.length)
    .find((dial) => trimmed.startsWith(dial));

  if (match) {
    return { dial: match, local: trimmed.slice(match.length).replace(/\s/g, "") };
  }

  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1);
    const dial = `+${digits.slice(0, 3)}`;
    return { dial, local: digits.slice(3) };
  }

  return { dial: "+60", local: trimmed.replace(/\s/g, "") };
}

export function joinPhoneNumber(dial: string, local: string) {
  const cleaned = local.replace(/\D/g, "").replace(/^0+/, "");
  return `${dial}${cleaned}`;
}
