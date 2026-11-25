import { useMemo } from "react";
import {
  ADDRESS_COUNTRIES,
  CUSTOM_ADDRESS_VALUE,
  findCity,
  findCountry,
  findRegion,
  listAddressLines,
  listCities,
  listRegions,
} from "@/lib/addressLocations";
import { cn } from "@/lib/utils";

const selectClass =
  "w-full rounded-xl border border-outline/40 bg-white px-4 py-3 text-sm outline-none focus:border-brand-green/40";

export type AddressLocationValue = {
  country: string;
  region: string;
  city: string;
  addressLine: string;
  customAddress: string;
};

type AddressLocationFieldsProps = {
  value: AddressLocationValue;
  onChange: (next: AddressLocationValue) => void;
  className?: string;
};

export function AddressLocationFields({
  value,
  onChange,
  className,
}: AddressLocationFieldsProps) {
  const country = useMemo(() => findCountry(value.country), [value.country]);
  const region = useMemo(
    () => findRegion(country, value.region),
    [country, value.region],
  );
  const city = useMemo(() => findCity(region, value.city), [region, value.city]);
  const addressOptions = useMemo(() => listAddressLines(city), [city]);

  const showCustomAddress = value.addressLine === CUSTOM_ADDRESS_VALUE;

  return (
    <div className={cn("grid gap-3", className)}>
      <label className="grid gap-2 text-sm">
        <span className="text-muted">Country</span>
        <select
          value={value.country}
          onChange={(e) => {
            const nextCountry = e.target.value;
            onChange({
              country: nextCountry,
              region: "",
              city: "",
              addressLine: "",
              customAddress: "",
            });
          }}
          className={selectClass}
          required
        >
          <option value="">Select country</option>
          {ADDRESS_COUNTRIES.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted">State / region</span>
        <select
          value={value.region}
          disabled={!value.country}
          onChange={(e) => {
            onChange({
              ...value,
              region: e.target.value,
              city: "",
              addressLine: "",
              customAddress: "",
            });
          }}
          className={cn(selectClass, !value.country && "opacity-60")}
          required
        >
          <option value="">Select region</option>
          {listRegions(country).map((r) => (
            <option key={r.name} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted">City</span>
        <select
          value={value.city}
          disabled={!value.region}
          onChange={(e) => {
            onChange({
              ...value,
              city: e.target.value,
              addressLine: "",
              customAddress: "",
            });
          }}
          className={cn(selectClass, !value.region && "opacity-60")}
          required
        >
          <option value="">Select city</option>
          {listCities(region).map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted">Street address</span>
        <select
          value={value.addressLine}
          disabled={!value.city}
          onChange={(e) => {
            const line = e.target.value;
            onChange({
              ...value,
              addressLine: line,
              customAddress: line === CUSTOM_ADDRESS_VALUE ? value.customAddress : "",
            });
          }}
          className={cn(selectClass, !value.city && "opacity-60")}
          required
        >
          <option value="">Select address</option>
          {addressOptions.map((line) => (
            <option key={line} value={line}>
              {line}
            </option>
          ))}
          <option value={CUSTOM_ADDRESS_VALUE}>Enter a different address…</option>
        </select>
      </label>

      {showCustomAddress && (
        <label className="grid gap-2 text-sm">
          <span className="text-muted">Your address</span>
          <textarea
            value={value.customAddress}
            onChange={(e) => onChange({ ...value, customAddress: e.target.value })}
            rows={3}
            placeholder="Unit, street, building, postcode"
            className="resize-none rounded-xl border border-outline/40 bg-white px-4 py-3 text-sm outline-none focus:border-brand-green/40"
            required
          />
        </label>
      )}
    </div>
  );
}
