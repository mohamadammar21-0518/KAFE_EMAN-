/** Weekday keys — order matches calendar week starting Monday for ranges. */
export const WEEKDAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
] as const;

export type Weekday = (typeof WEEKDAYS)[number]["value"];

const DAY_LABEL: Record<Weekday, string> = Object.fromEntries(
  WEEKDAYS.map((d) => [d.value, d.label]),
) as Record<Weekday, string>;

export type HoursRule = {
  id: string;
  type: "open" | "closed";
  dayFrom: Weekday;
  /** Same as dayFrom = single day */
  dayTo: Weekday;
  openTime: string;
  closeTime: string;
  /** Preserved when an existing line cannot be parsed into fields */
  legacyLine?: string;
};

export function newHoursRule(partial?: Partial<HoursRule>): HoursRule {
  return {
    id: crypto.randomUUID(),
    type: "open",
    dayFrom: "monday",
    dayTo: "monday",
    openTime: "11:00",
    closeTime: "23:00",
    ...partial,
  };
}

export function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time24;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

function isRange(rule: HoursRule) {
  return rule.dayTo !== rule.dayFrom;
}

function formatDaySpan(from: Weekday, to: Weekday) {
  if (from === to) return DAY_LABEL[from];
  return `${DAY_LABEL[from]} – ${DAY_LABEL[to]}`;
}

/** Formats rules into strings stored on `branches.hours` (storefront display). */
export function formatHoursRules(rules: HoursRule[]): string[] {
  return rules.map((rule) => {
    if (rule.legacyLine) return rule.legacyLine;

    if (rule.type === "closed") {
      if (!isRange(rule)) {
        return rule.dayFrom === "monday"
          ? "Closed on Mondays"
          : `Closed on ${DAY_LABEL[rule.dayFrom]}`;
      }
      if (rule.dayFrom === "saturday" && rule.dayTo === "sunday") {
        return "Closed Saturday & Sunday";
      }
      return `Closed ${formatDaySpan(rule.dayFrom, rule.dayTo)}`;
    }

    const open = formatTime12h(rule.openTime);
    const close = formatTime12h(rule.closeTime);
    if (isRange(rule)) {
      return `${formatDaySpan(rule.dayFrom, rule.dayTo)}: ${open} – ${close}`;
    }
    return `${DAY_LABEL[rule.dayFrom]}: ${open} – ${close}`;
  });
}

function findWeekday(name: string): Weekday | null {
  const n = name.trim().toLowerCase();
  const hit = WEEKDAYS.find(
    (d) => d.label.toLowerCase() === n || d.label.toLowerCase().startsWith(n),
  );
  return hit?.value ?? null;
}

const OPEN_LINE =
  /^(.+?):\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*[–-]\s*(\d{1,2}:\d{2}\s*(?:AM|PM))\s*$/i;

function parseTime12to24(t: string): string {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return "09:00";
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return `${h.toString().padStart(2, "0")}:${m[2]}`;
}

function parseDaySpan(span: string): { from: Weekday; to: Weekday } | null {
  const parts = span.split(/\s*[–-]\s*/);
  if (parts.length === 1) {
    const d = findWeekday(parts[0]);
    return d ? { from: d, to: d } : null;
  }
  const from = findWeekday(parts[0]);
  const to = findWeekday(parts[1]);
  if (!from || !to) return null;
  return { from, to };
}

/** Best-effort parse of existing `hours` strings for edit forms. */
export function parseHoursLines(lines: string[]): HoursRule[] {
  const rules: HoursRule[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const closedOn = trimmed.match(/^Closed on (.+)$/i);
    if (closedOn) {
      const day = findWeekday(closedOn[1].replace(/s$/i, ""));
      if (day) {
        rules.push(newHoursRule({ type: "closed", dayFrom: day, dayTo: day }));
        continue;
      }
    }

    const closedAmp = trimmed.match(/^Closed (.+) & (.+)$/i);
    if (closedAmp) {
      const a = findWeekday(closedAmp[1]);
      const b = findWeekday(closedAmp[2]);
      if (a && b) {
        rules.push(newHoursRule({ type: "closed", dayFrom: a, dayTo: b }));
        continue;
      }
    }

    const closedRange = trimmed.match(/^Closed (.+)$/i);
    if (closedRange && !closedOn) {
      const span = parseDaySpan(closedRange[1]);
      if (span) {
        rules.push(
          newHoursRule({
            type: "closed",
            dayFrom: span.from,
            dayTo: span.to,
          }),
        );
        continue;
      }
    }

    const openMatch = trimmed.match(OPEN_LINE);
    if (openMatch) {
      const span = parseDaySpan(openMatch[1]);
      if (span) {
        rules.push(
          newHoursRule({
            type: "open",
            dayFrom: span.from,
            dayTo: span.to,
            openTime: parseTime12to24(openMatch[2]),
            closeTime: parseTime12to24(openMatch[3]),
          }),
        );
        continue;
      }
    }

    rules.push(newHoursRule({ legacyLine: trimmed }));
  }

  return rules.length ? rules : [newHoursRule()];
}

export function validateHoursRules(rules: HoursRule[]): string | null {
  if (!rules.length) return "Add at least one opening hours schedule.";
  for (const rule of rules) {
    if (rule.legacyLine) continue;
    if (rule.type !== "open") continue;
    if (!rule.openTime || !rule.closeTime) return "Set open and close times for each schedule.";
    if (rule.openTime >= rule.closeTime) {
      return "Close time must be after open time.";
    }
  }
  return null;
}


/** YYYY-MM-DD for a calendar selection without conversion through UTC. */
export function calendarDate(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T12:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Hourly arrival slots inside the published opening hours, excluding closing time. */
export function bookingTimes(lines: readonly string[], date: string): string[] {
  if (!isCalendarDate(date)) return [];
  const day = (new Date(date + "T12:00:00Z").getUTCDay() + 6) % 7;
  const isDayIncluded = (from: number, to: number) =>
    from <= to ? day >= from && day <= to : day >= from || day <= to;
  const slots = new Set<string>();
  for (const line of lines) {
    const closed = line.trim().match(/^Closed\s+(?:on\s+)?(.+)$/i);
    if (closed) {
      const span = parseDaySpan(closed[1].replace(/Mondays/i, "Monday").replace(/\s*&\s*/, " – "));
      if (span && isDayIncluded(WEEKDAYS.findIndex((d) => d.value === span.from), WEEKDAYS.findIndex((d) => d.value === span.to))) return [];
    }
    const match = line.trim().match(OPEN_LINE);
    if (!match) continue;
    const days = parseDaySpan(match[1]);
    if (!days) continue;
    const from = WEEKDAYS.findIndex((d) => d.value === days.from);
    const to = WEEKDAYS.findIndex((d) => d.value === days.to);
    const included = isDayIncluded(from, to);
    if (!included) continue;
    const open = parseTime12to24(match[2]);
    const close = parseTime12to24(match[3]);
    const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
    const end = minutes(close) <= minutes(open) ? 1440 : minutes(close);
    for (let time = minutes(open); time < end; time += 60) {
      slots.add(String(Math.floor(time / 60)).padStart(2, "0") + ":" + String(time % 60).padStart(2, "0"));
    }
  }
  return [...slots].sort();
}

/** All confirmed shop branches use Asia/Kuala_Lumpur. */
export function shopDate(now = Date.now()): string {
  return new Date(now + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
