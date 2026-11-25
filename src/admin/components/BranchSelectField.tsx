import { Link } from "react-router-dom";
import { AdminFormField, adminInputClass } from "@/admin/components/AdminFormField";

type BranchOption = { slug: string; label: string };

export function BranchSelectField({
  label = "Select branch *",
  value,
  onChange,
  branches,
  disabled,
}: {
  label?: string;
  value: string;
  onChange: (slug: string) => void;
  branches: BranchOption[] | undefined;
  disabled?: boolean;
}) {
  return (
    <AdminFormField label={label}>
      <select
        required
        value={value}
        disabled={disabled || !branches?.length}
        onChange={(e) => onChange(e.target.value)}
        className={adminInputClass}
      >
        {!branches?.length && <option value="">No branches yet</option>}
        {branches?.map((b) => (
          <option key={b.slug} value={b.slug}>
            {b.label}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-muted">
        Branch not listed?{" "}
        <Link
          to="/admin/branches"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Add new branch
        </Link>
      </p>
    </AdminFormField>
  );
}
