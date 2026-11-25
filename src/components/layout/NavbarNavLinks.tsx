import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { NAV_LINKS } from "@/data/content";
import { NavRollLink } from "@/components/layout/NavRollLink";
import { navSpring } from "@/motion/presets";
import { cn } from "@/lib/utils";

type IndicatorState = {
  left: number;
  width: number;
  top: number;
  height: number;
  ready: boolean;
};

const INDICATOR_HIDDEN: IndicatorState = {
  left: 0,
  width: 0,
  top: 0,
  height: 0,
  ready: false,
};

function matchNavHref(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavbarNavLinks({
  className,
  layout = "horizontal",
  linkClassName,
}: {
  className?: string;
  layout?: "horizontal" | "vertical";
  linkClassName?: string;
}) {
  const { pathname } = useLocation();
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [indicator, setIndicator] = useState<IndicatorState>(INDICATOR_HIDDEN);

  const updateIndicator = useCallback(() => {
    const list = listRef.current;
    if (!list) return;

    const activeLink = NAV_LINKS.find((link) => matchNavHref(pathname, link.href));
    const el = activeLink ? itemRefs.current.get(activeLink.href) : undefined;

    if (!el) {
      setIndicator(INDICATOR_HIDDEN);
      return;
    }

    const listRect = list.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    if (layout === "horizontal") {
      setIndicator({
        left: elRect.left - listRect.left,
        width: elRect.width,
        top: elRect.bottom - listRect.top - 2,
        height: 2,
        ready: true,
      });
      return;
    }

    setIndicator({
      left: 0,
      width: 3,
      top: elRect.top - listRect.top,
      height: elRect.height,
      ready: true,
    });
  }, [layout, pathname]);

  useLayoutEffect(() => {
    updateIndicator();

    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateIndicator);
      return () => window.removeEventListener("resize", updateIndicator);
    }

    const observer = new ResizeObserver(() => updateIndicator());
    observer.observe(list);
    window.addEventListener("resize", updateIndicator);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator]);

  return (
    <ul
      ref={listRef}
      className={cn(
        "relative list-none",
        layout === "horizontal" ? "flex items-center gap-6 pb-0.5" : "flex flex-col gap-5",
        className,
      )}
    >
      {indicator.ready && (
        <motion.span
          className="pointer-events-none absolute z-10 rounded-full bg-primary"
          initial={false}
          animate={{
            left: indicator.left,
            width: indicator.width,
            top: indicator.top,
            height: indicator.height,
          }}
          transition={navSpring}
          aria-hidden
        />
      )}

      {NAV_LINKS.map((link) => (
        <li key={link.href}>
          <NavRollLink
            to={link.href}
            className={linkClassName}
            ref={(node) => {
              if (node) itemRefs.current.set(link.href, node);
              else itemRefs.current.delete(link.href);
            }}
          >
            {link.label}
          </NavRollLink>
        </li>
      ))}
    </ul>
  );
}
