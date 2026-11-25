/** Kafe Eman chart palette — matches `src/index.css` Artisanal Sage tokens. */
export const CHART_THEME = {
  primary: "#355927",
  primaryDark: "#1e4112",
  primaryLight: "#a5cf90",
  secondary: "#a4b494",
  secondaryFill: "#d5e5c3",
  neutral: "#1c1f1a",
  neutralMuted: "#43493e",
  grid: "#c3c9bb",
  gridLight: "#edefe6",
  surface: "#f9faf2",
  white: "#ffffff",
  error: "#ba1a1a",
} as const;

export const CHART_SERIES = {
  revenue: CHART_THEME.primary,
  orders: CHART_THEME.secondary,
  avgTicket: CHART_THEME.primaryDark,
  signups: CHART_THEME.primary,
  menuItems: CHART_THEME.primaryDark,
} as const;

/** Donut / multi-series — harmonious sage greens */
export const CHART_PALETTE = [
  CHART_THEME.primary,
  CHART_THEME.primaryDark,
  CHART_THEME.secondary,
  CHART_THEME.primaryLight,
  CHART_THEME.secondaryFill,
  "#73796d",
  "#2e312c",
  "#a4b49499",
] as const;

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: CHART_THEME.secondary,
  confirmed: CHART_THEME.primaryLight,
  preparing: CHART_THEME.primary,
  ready: CHART_THEME.primaryDark,
  completed: CHART_THEME.primary,
  cancelled: CHART_THEME.error,
};
