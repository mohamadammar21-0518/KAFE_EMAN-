import { Plus, Trash2 } from "lucide-react";
import { AdminFormField, adminInputClass } from "@/admin/components/AdminFormField";
import {
  formatHoursRules,
  newHoursRule,
  validateHoursRules,
  WEEKDAYS,
  type HoursRule,
  type Weekday,
} from "@/admin/lib/branchHours";
export function BranchHoursEditor({
  rules,
  onChange,
}: {
  rules: HoursRule[];
  onChange: (rules: HoursRule[]) => void;
}) {
  const preview = formatHoursRules(rules);
  const validation = validateHoursRules(rules);

  function updateRule(id: string, patch: Partial<HoursRule>) {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function setDayFrom(id: string, dayFrom: Weekday) {
    onChange(
      rules.map((r) => {
        if (r.id !== id) return r;
        const useRange = r.dayTo !== r.dayFrom;
        return {
          ...r,
          dayFrom,
          dayTo: useRange ? r.dayTo : dayFrom,
        };
      }),
    );
  }

  function toggleRange(id: string, useRange: boolean) {
    onChange(
      rules.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          dayTo: useRange ? (r.dayTo === r.dayFrom ? "friday" : r.dayTo) : r.dayFrom,
        };
      }),
    );
  }

  return (
    <AdminFormField label="Opening hours *">
      <div className="space-y-3">
        {rules.map((rule, index) => {
          if (rule.legacyLine) {
            return (
              <div
                key={rule.id}
                className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-3 space-y-2"
              >
                <p className="text-xs text-muted">
                  Existing hours line — remove and add a new schedule below to edit with day/time
                  pickers.
                </p>
                <p className="text-sm font-medium text-on-surface">{rule.legacyLine}</p>
                {rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onChange(rules.filter((r) => r.id !== rule.id))}
                    className="text-xs font-medium text-red-600"
                  >
                    Remove this line
                  </button>
                )}
              </div>
            );
          }

          const useRange = rule.dayTo !== rule.dayFrom;
          return (
            <div
              key={rule.id}
              className="rounded-xl border border-outline/40 bg-cream/20 p-3 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  Schedule {index + 1}
                </span>
                {rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onChange(rules.filter((r) => r.id !== rule.id))}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                    title="Remove schedule"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="text-muted">Type</span>
                  <select
                    value={rule.type}
                    onChange={(e) =>
                      updateRule(rule.id, {
                        type: e.target.value as HoursRule["type"],
                      })
                    }
                    className={adminInputClass}
                  >
                    <option value="open">Open hours</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>

                <label className="flex items-end gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useRange}
                    onChange={(e) => toggleRange(rule.id, e.target.checked)}
                  />
                  <span>Day range</span>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="text-muted">{useRange ? "From day" : "Day"}</span>
                  <select
                    value={rule.dayFrom}
                    onChange={(e) => setDayFrom(rule.id, e.target.value as Weekday)}
                    className={adminInputClass}
                  >
                    {WEEKDAYS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>

                {useRange && (
                  <label className="grid gap-1.5 text-sm">
                    <span className="text-muted">To day</span>
                    <select
                      value={rule.dayTo}
                      onChange={(e) =>
                        updateRule(rule.id, { dayTo: e.target.value as Weekday })
                      }
                      className={adminInputClass}
                    >
                      {WEEKDAYS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {rule.type === "open" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm">
                    <span className="text-muted">Opens</span>
                    <input
                      type="time"
                      required
                      value={rule.openTime}
                      onChange={(e) => updateRule(rule.id, { openTime: e.target.value })}
                      className={adminInputClass}
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span className="text-muted">Closes</span>
                    <input
                      type="time"
                      required
                      value={rule.closeTime}
                      onChange={(e) => updateRule(rule.id, { closeTime: e.target.value })}
                      className={adminInputClass}
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => onChange([...rules, newHoursRule()])}
          className="inline-flex items-center gap-2 rounded-full border border-outline/40 bg-white px-4 py-2 text-sm font-medium text-on-surface hover:bg-cream"
        >
          <Plus className="h-4 w-4" />
          Add schedule
        </button>

        {preview.length > 0 && (
          <div className="rounded-xl border border-outline/30 bg-white/80 px-3 py-2 text-sm">
            <p className="text-xs font-medium text-muted">Preview (shown on website)</p>
            <ul className="mt-1 space-y-0.5 text-on-surface">
              {preview.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {validation && (
          <p className="text-xs text-amber-700">{validation}</p>
        )}
      </div>
    </AdminFormField>
  );
}

export function hoursRulesFromForm(rules: HoursRule[]): string[] {
  return formatHoursRules(rules);
}
