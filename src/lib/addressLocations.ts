/** Cascading location data for profile / onboarding address selects. */

export const CUSTOM_ADDRESS_VALUE = "__custom__";

export type AddressCity = {
  name: string;
  addresses: string[];
};

export type AddressRegion = {
  name: string;
  cities: AddressCity[];
};

export type AddressCountry = {
  code: string;
  name: string;
  regions: AddressRegion[];
};

export const ADDRESS_COUNTRIES: AddressCountry[] = [
  {
    code: "MY",
    name: "Malaysia",
    regions: [
      {
        name: "Kedah",
        cities: [
          {
            name: "Alor Setar",
            addresses: [
              "22-A Bawah, Taman Koperasi, Jalan Tun Razak, Taman Mutiara, 05200",
              "Jalan Putra, 05100 Alor Setar",
              "Jalan Sultanah, Bandar Alor Setar, 05000",
            ],
          },
          {
            name: "Kepala Batas",
            addresses: [
              "Rasa-Rasa Food Court, Jalan Bukit Tinggi, Taman Kepala Batas, 06200",
              "Taman Seri Delima, 06200 Kepala Batas",
            ],
          },
          {
            name: "Changlun (UUM)",
            addresses: [
              "School of Business Management (SBM), Universiti Utara Malaysia, 06050",
              "Taman Desa Murni, 06010 Changlun",
            ],
          },
        ],
      },
      {
        name: "Penang",
        cities: [
          {
            name: "George Town",
            addresses: [
              "Lebuh Armenian, 10200 George Town",
              "Jalan Macalister, 10400 George Town",
            ],
          },
          {
            name: "Butterworth",
            addresses: ["Jalan Raja Uda, 12300 Butterworth", "Seberang Jaya, 13700"],
          },
        ],
      },
      {
        name: "Kuala Lumpur",
        cities: [
          {
            name: "Kuala Lumpur",
            addresses: [
              "Bukit Bintang, 55100 Kuala Lumpur",
              "KLCC, Jalan Ampang, 50450 Kuala Lumpur",
            ],
          },
        ],
      },
    ],
  },
  {
    code: "SG",
    name: "Singapore",
    regions: [
      {
        name: "Central",
        cities: [
          {
            name: "Singapore",
            addresses: ["Orchard Road", "Marina Bay", "Chinatown"],
          },
        ],
      },
    ],
  },
  {
    code: "TH",
    name: "Thailand",
    regions: [
      {
        name: "Bangkok",
        cities: [
          {
            name: "Bangkok",
            addresses: ["Sukhumvit", "Silom", "Chatuchak"],
          },
        ],
      },
    ],
  },
];

const countryByName = new Map(ADDRESS_COUNTRIES.map((c) => [c.name, c]));
const countryByCode = new Map(ADDRESS_COUNTRIES.map((c) => [c.code, c]));

export function findCountry(nameOrCode: string | undefined) {
  if (!nameOrCode) return undefined;
  return countryByName.get(nameOrCode) ?? countryByCode.get(nameOrCode);
}

export function listRegions(country: AddressCountry | undefined) {
  return country?.regions ?? [];
}

export function findRegion(country: AddressCountry | undefined, regionName: string | undefined) {
  if (!country || !regionName) return undefined;
  return country.regions.find((r) => r.name === regionName);
}

export function listCities(region: AddressRegion | undefined) {
  return region?.cities ?? [];
}

export function findCity(region: AddressRegion | undefined, cityName: string | undefined) {
  if (!region || !cityName) return undefined;
  return region.cities.find((c) => c.name === cityName);
}

export function listAddressLines(city: AddressCity | undefined) {
  return city?.addresses ?? [];
}

/** Street line only (selected preset or custom text). */
export function resolveStreetLine(addressLine: string, customAddress: string) {
  if (addressLine === CUSTOM_ADDRESS_VALUE) return customAddress.trim();
  return addressLine.trim();
}

export function formatDeliveryAddress(parts: {
  country: string;
  region: string;
  city: string;
  streetLine: string;
}) {
  const street = parts.streetLine.trim();
  const locality = [parts.city, parts.region, parts.country].filter(Boolean).join(", ");
  if (street && locality) return `${street}, ${locality}`;
  return street || locality;
}

export function isAddressSelectionComplete(parts: {
  country: string;
  region: string;
  city: string;
  addressLine: string;
  customAddress: string;
}) {
  const street = resolveStreetLine(parts.addressLine, parts.customAddress);
  return Boolean(
    parts.country.trim() && parts.region.trim() && parts.city.trim() && street,
  );
}

/** Map saved profile fields back into select state. */
export function profileToAddressFields(profile: {
  country?: string;
  region?: string;
  city?: string;
  address?: string;
}) {
  const country = findCountry(profile.country);
  const region = findRegion(country, profile.region);
  const city = findCity(region, profile.city);
  const street = profile.address?.trim() ?? "";
  const preset = city?.addresses.find((a) => a === street);
  return {
    country: country?.name ?? profile.country ?? "",
    region: region?.name ?? profile.region ?? "",
    city: city?.name ?? profile.city ?? "",
    addressLine: preset ? preset : street ? CUSTOM_ADDRESS_VALUE : "",
    customAddress: preset ? "" : street,
  };
}
