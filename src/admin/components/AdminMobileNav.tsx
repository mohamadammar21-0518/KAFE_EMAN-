import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { ADMIN_NAV_SECTIONS } from "@/admin/adminNav";
import { cn } from "@/lib/utils";

export function AdminMobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
      <button
        type="button"
        className="absolute inset-0 bg-coffee-dark/40 backdrop-blur-[2px]"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 left-0 flex w-[min(100vw-3rem,280px)] flex-col border-r border-outline/40 bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-outline/40 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-outline/50 bg-white shadow-soft">
              <span className="text-sm font-semibold text-coffee-title">KE</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-coffee-dark">Kafe Eman</p>
              <p className="text-xs text-muted">Admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-outline/40 bg-white text-coffee-dark"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div
              key={section.title ?? "main"}
              className={cn(
                section.title && "mt-4 border-t border-outline/30 pt-4 first:mt-0 first:border-0 first:pt-0",
              )}
            >
              {section.title && (
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {section.title}
                </p>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === "/admin"}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary/12 text-coffee-dark"
                              : "text-on-surface active:bg-primary/10",
                          )
                        }
                      >
                        <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                        {item.label}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}
