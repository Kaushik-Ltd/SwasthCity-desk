/**
 * Civic Authority provider.
 *
 * Returns local municipality / department contact info for a given region.
 * Currently backed by curated mock data keyed by state (with a generic fallback).
 * Swap `lookupCivicAuthority` for a real government-portal API call later — the
 * return shape is the contract every consumer relies on.
 */

export type DepartmentKey =
  | "general"
  | "roads"
  | "sanitation"
  | "water"
  | "streetlights"
  | "drainage"
  | "public_health";

export interface DepartmentContact {
  key: DepartmentKey;
  name: string;
  phone?: string;
  email?: string;
}

export interface CivicAuthority {
  municipality: string;
  corporation?: string;
  ward?: string;
  address: string;
  lat?: number;
  lng?: number;
  helplines: {
    garbage?: string;
    roads?: string;
    general?: string;
    emergency?: string;
  };
  email?: string;
  website?: string;
  departments: DepartmentContact[];
  source: "mock" | "api";
}

export interface RegionQuery {
  state?: string | null;
  district?: string | null;
  city?: string | null;
  municipality?: string | null;
  pincode?: string | null;
  lat?: number | null;
  lng?: number | null;
}

/** Generic template used when we don't have curated data for the region. */
function genericFor(q: RegionQuery): CivicAuthority | null {
  if (!q.state && !q.city && !q.district && !q.municipality) return null;
  const place = q.municipality || q.city || q.district || q.state || "Local";
  return {
    municipality: `${place} Municipal Council`,
    corporation: q.city ? `${q.city} Municipal Corporation` : undefined,
    ward: undefined,
    address: [q.city, q.district, q.state].filter(Boolean).join(", "),
    helplines: {
      general: "1800-11-0031",
      emergency: "112",
      garbage: "1533",
      roads: "1073",
    },
    email: undefined,
    website: undefined,
    departments: [
      { key: "roads", name: "Road Department", phone: "1073" },
      { key: "sanitation", name: "Sanitation Department", phone: "1533" },
      { key: "water", name: "Water Supply", phone: "1916" },
      { key: "streetlights", name: "Street Lights" },
      { key: "drainage", name: "Drainage" },
      { key: "public_health", name: "Public Health", phone: "104" },
    ],
    source: "mock",
  };
}

/** Curated overrides for a handful of large cities — extend freely. */
const CITY_OVERRIDES: Record<string, Partial<CivicAuthority>> = {
  Bengaluru: {
    municipality: "Bruhat Bengaluru Mahanagara Palike",
    corporation: "BBMP",
    address: "N.R. Square, Bengaluru, Karnataka 560002",
    lat: 12.9762, lng: 77.5993,
    helplines: { general: "1533", garbage: "1533", roads: "080-22660000", emergency: "112" },
    email: "commr@bbmp.gov.in",
    website: "https://bbmp.gov.in",
  },
  Mumbai: {
    municipality: "Municipal Corporation of Greater Mumbai",
    corporation: "BMC / MCGM",
    address: "Mahapalika Marg, Fort, Mumbai, Maharashtra 400001",
    lat: 18.9398, lng: 72.8354,
    helplines: { general: "1916", garbage: "1916", roads: "1916", emergency: "108" },
    email: "mc@mcgm.gov.in",
    website: "https://portal.mcgm.gov.in",
  },
  Delhi: {
    municipality: "Municipal Corporation of Delhi",
    corporation: "MCD",
    address: "Dr. S.P. Mukherjee Civic Centre, Minto Rd, New Delhi 110002",
    lat: 28.6353, lng: 77.2250,
    helplines: { general: "155305", garbage: "155305", roads: "1800-11-8595", emergency: "112" },
    email: "info@mcd.nic.in",
    website: "https://mcdonline.nic.in",
  },
  Chennai: {
    municipality: "Greater Chennai Corporation",
    corporation: "GCC",
    address: "Rippon Building, EVR Periyar Salai, Chennai, Tamil Nadu 600003",
    lat: 13.0827, lng: 80.2707,
    helplines: { general: "1913", garbage: "1913", roads: "1913", emergency: "108" },
    email: "commissioner@chennaicorporation.gov.in",
    website: "https://chennaicorporation.gov.in",
  },
  Kolkata: {
    municipality: "Kolkata Municipal Corporation",
    corporation: "KMC",
    address: "5, S.N. Banerjee Rd, New Market Area, Kolkata 700013",
    lat: 22.5646, lng: 88.3540,
    helplines: { general: "18003453375", garbage: "18003453375", roads: "033-22861212", emergency: "100" },
    email: "mail@kmcgov.in",
    website: "https://www.kmcgov.in",
  },
  Hyderabad: {
    municipality: "Greater Hyderabad Municipal Corporation",
    corporation: "GHMC",
    address: "CC Complex, Tank Bund Rd, Lower Tank Bund, Hyderabad 500063",
    lat: 17.4239, lng: 78.4738,
    helplines: { general: "040-21111111", garbage: "040-21111111", roads: "040-23225397", emergency: "100" },
    email: "commissioner@ghmc.gov.in",
    website: "https://www.ghmc.gov.in",
  },
  Pune: {
    municipality: "Pune Municipal Corporation",
    corporation: "PMC",
    address: "PMC Main Building, Shivaji Nagar, Pune 411005",
    lat: 18.5308, lng: 73.8475,
    helplines: { general: "020-25501000", garbage: "020-25506800", roads: "020-25501000", emergency: "112" },
    email: "info@punecorporation.org",
    website: "https://www.pmc.gov.in",
  },
  Ahmedabad: {
    municipality: "Ahmedabad Municipal Corporation",
    corporation: "AMC",
    address: "Sardar Patel Bhavan, Danapith, Ahmedabad 380001",
    lat: 23.0225, lng: 72.5714,
    helplines: { general: "155303", garbage: "155303", roads: "155303", emergency: "108" },
    email: "info@ahmedabadcity.gov.in",
    website: "https://ahmedabadcity.gov.in",
  },
};

function fuzzy(target: string | null | undefined, keys: string[]): string | null {
  if (!target) return null;
  const t = target.trim().toLowerCase();
  return keys.find((k) => k.toLowerCase() === t || t.includes(k.toLowerCase())) ?? null;
}

/**
 * Resolve civic-authority info for a region. Currently synchronous mock lookup,
 * returned as a Promise so the call site is ready for a future async API.
 */
export async function lookupCivicAuthority(q: RegionQuery): Promise<CivicAuthority | null> {
  const cityKey = fuzzy(q.city, Object.keys(CITY_OVERRIDES))
    ?? fuzzy(q.municipality, Object.keys(CITY_OVERRIDES))
    ?? fuzzy(q.district, Object.keys(CITY_OVERRIDES));

  const base = genericFor(q);
  if (!cityKey) return base;

  const override = CITY_OVERRIDES[cityKey];
  const merged: CivicAuthority = {
    ...(base ?? {
      municipality: cityKey,
      address: cityKey,
      helplines: {},
      departments: [],
      source: "mock" as const,
    }),
    ...override,
    helplines: { ...(base?.helplines ?? {}), ...(override.helplines ?? {}) },
    departments: base?.departments ?? [],
    source: "mock",
  };
  return merged;
}
