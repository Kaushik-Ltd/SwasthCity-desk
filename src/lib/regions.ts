import raw from "@/data/india-regions.json";

export interface StateEntry {
  state: string;
  districts: string[];
}

export const INDIA_REGIONS: StateEntry[] = (raw as { states: StateEntry[] }).states;

export const STATES: string[] = INDIA_REGIONS.map((s) => s.state);

export function districtsFor(state: string): string[] {
  return INDIA_REGIONS.find((s) => s.state === state)?.districts ?? [];
}

export interface ReverseGeocodeResult {
  state: string | null;
  district: string | null;
  city: string | null;
  municipality: string | null;
  pincode: string | null;
  displayName: string;
  lat: number;
  lng: number;
}

/** Reverse-geocode using OpenStreetMap Nominatim (no key, rate-limited). */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Reverse geocode failed (${res.status})`);
  const data = await res.json();
  const a = data.address ?? {};
  const state: string | null = a.state ?? a.state_district ?? null;
  const district: string | null =
    a.state_district ?? a.county ?? a.district ?? a.city_district ?? null;
  const city: string | null =
    a.city ?? a.town ?? a.village ?? a.municipality ?? a.hamlet ?? a.suburb ?? null;
  const municipality: string | null =
    a.municipality ?? a.city ?? a.town ?? a.suburb ?? null;
  const pincode: string | null = a.postcode ?? null;
  return {
    state,
    district,
    city,
    municipality,
    pincode,
    displayName: String(data.display_name ?? ""),
    lat,
    lng,
  };
}

/** Best-effort match of a free-form state name to the bundled state list. */
export function matchState(name: string | null | undefined): string | null {
  if (!name) return null;
  const clean = name.trim().toLowerCase();
  const exact = STATES.find((s) => s.toLowerCase() === clean);
  if (exact) return exact;
  const contains = STATES.find(
    (s) => s.toLowerCase().includes(clean) || clean.includes(s.toLowerCase().replace(/\s*\(.*\)\s*/, "")),
  );
  return contains ?? null;
}
