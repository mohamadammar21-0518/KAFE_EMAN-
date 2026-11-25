import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  CalendarClock,
  UserCircle,
  Shield,
  Mail,
  ShoppingBag,
  CircleDollarSign,
  CircleHelp,
  Settings2,
  UserRound,
  MessageSquareQuote,
  Bot,
} from "lucide-react";
import type { ComponentType } from "react";

export type AdminNavItem = {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
};

export type AdminNavSection = {
  /** Sidebar group label — omit for the main menu block */
  title?: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_MAIN: AdminNavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Branches", to: "/admin/branches", icon: Store },
  { label: "Menu", to: "/admin/menu", icon: UtensilsCrossed },
  { label: "Orders", to: "/admin/orders", icon: ShoppingBag },
  { label: "Finance", to: "/admin/finance", icon: CircleDollarSign },
  { label: "Reservations", to: "/admin/reservations", icon: CalendarClock },
  { label: "FAQ", to: "/admin/faqs", icon: CircleHelp },
  { label: "Get In Touch", to: "/admin/messages", icon: Mail },
  { label: "Testimonials", to: "/admin/testimonials", icon: MessageSquareQuote },
  { label: "Content & contact", to: "/admin/content", icon: Settings2 },
  { label: "AI & Integrations", to: "/admin/ai", icon: Bot },
];

export const ADMIN_NAV_PEOPLE: AdminNavItem[] = [
  { label: "Clients", to: "/admin/clients", icon: UserCircle },
  { label: "Staff", to: "/admin/staff", icon: Shield },
];

export const ADMIN_NAV_ACCOUNT: AdminNavItem[] = [
  { label: "My account", to: "/admin/account", icon: UserRound },
];

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  { items: ADMIN_NAV_MAIN },
  { title: "People", items: ADMIN_NAV_PEOPLE },
  { title: "Account", items: ADMIN_NAV_ACCOUNT },
];

/** @deprecated Use ADMIN_NAV_SECTIONS */
export const ADMIN_NAV = [...ADMIN_NAV_MAIN, ...ADMIN_NAV_PEOPLE];
