import type { ReactNode } from "react";

export function AdminFormField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className ?? "grid gap-2 text-sm"}>
      <span className="font-medium text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}

export const adminInputClass =
  "admin-input w-full rounded-xl border border-outline/40 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40";
