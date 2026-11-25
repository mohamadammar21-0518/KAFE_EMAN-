import { forwardRef, useState } from "react";
import { NavLink, useLocation, type NavLinkProps } from "react-router-dom";
import type { ReactNode } from "react";
import { RollText } from "@/components/motion/RollText";
import { cn } from "@/lib/utils";
import { SITE } from "@/data/content";

type NavRollLinkProps = {
  to: NavLinkProps["to"];
  children: ReactNode;
  className?: string;
  capitalize?: boolean;
  textClassName?: string;
};

export const NavRollLink = forwardRef<HTMLAnchorElement, NavRollLinkProps>(
  function NavRollLink(
    { to, children, className, capitalize = true, textClassName },
    ref,
  ) {
    const [hovered, setHovered] = useState(false);
    const location = useLocation();

    function pathFromTo(value: NavLinkProps["to"]) {
      if (typeof value === "string") return value.split("#")[0] || "/";
      if (typeof value === "object" && value.pathname) return value.pathname;
      return "/";
    }

    function scrollPageToTop() {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }

    return (
      <NavLink
        ref={ref}
        to={to}
        onClick={() => {
          const target = pathFromTo(to);
          const onSamePath =
            target === "/"
              ? location.pathname === "/"
              : location.pathname === target ||
                location.pathname.startsWith(`${target}/`);
          if (onSamePath) scrollPageToTop();
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={({ isActive }) =>
          cn(
            "nav-link no-underline",
            isActive && "nav-link--active",
            !isActive && hovered && "nav-link--hover",
            className,
          )
        }
      >
        {({ isActive }) => (
          <RollText
            hovered={hovered}
            height={25}
            gap={13}
            capitalize={capitalize}
            textClassName={cn(
              "text-sm font-normal leading-[1.2] transition-colors duration-200",
              isActive ? "text-primary font-medium" : hovered ? "text-primary" : "text-on-surface",
              textClassName,
            )}
          >
            {children}
          </RollText>
        )}
      </NavLink>
    );
  },
);

export function BrandLogo({ className }: { className?: string }) {
  return (
    <NavLink
      to="/"
      className={cn(
        "nav-pill-logo flex h-10 shrink-0 items-center px-5 py-2.5 no-underline transition-colors duration-200 hover:bg-primary/8",
        className,
      )}
    >
      <span className="font-display text-base font-medium leading-none tracking-[-0.02em] text-coffee-dark transition-colors duration-200 hover:text-primary">
        {SITE.name}
      </span>
    </NavLink>
  );
}
