import countriesRaw from "./countries-data.json";

export interface CountryMetadata {
  code: string; // ISO 3166-1 alpha-2 (e.g. "BR", "JP")
  code3: string; // ISO 3166-1 alpha-3 (e.g. "BRA", "JPN")
  name: string; // Common name (e.g. "Brazil", "Japan")
  formalName: string;
  continent: string;
  flag: string; // Emoji flag (e.g. "🇧🇷", "🇯🇵")
  lat: number; // Centroid latitude
  lng: number; // Centroid longitude
  bbox: number[]; // [minLng, minLat, maxLng, maxLat]
}

export const COUNTRIES_MAP: Record<string, CountryMetadata> = countriesRaw as unknown as Record<
  string,
  CountryMetadata
>;

// Pre-indexed lookup map for O(1) instantaneous access across all identifier types:
// 2-letter ISO, 3-letter ISO, lowercase common name, and lowercase formal name.
const COUNTRY_LOOKUP = new Map<string, CountryMetadata>();
export const ALL_COUNTRIES_LIST: CountryMetadata[] = Object.values(COUNTRIES_MAP);
export const ALL_COUNTRIES_SORTED: CountryMetadata[] = [...ALL_COUNTRIES_LIST].sort((a, b) =>
  a.name.localeCompare(b.name)
);

for (const country of ALL_COUNTRIES_LIST) {
  if (country.code) COUNTRY_LOOKUP.set(country.code.toUpperCase(), country);
  if (country.code3) COUNTRY_LOOKUP.set(country.code3.toUpperCase(), country);
  if (country.name) COUNTRY_LOOKUP.set(country.name.toLowerCase().trim(), country);
  if (country.formalName) COUNTRY_LOOKUP.set(country.formalName.toLowerCase().trim(), country);
}

/**
 * Returns metadata for a country by its 2-letter or 3-letter code or name in O(1) time.
 */
export function getCountry(codeOrName: string): CountryMetadata | undefined {
  if (!codeOrName) return undefined;
  const trimmed = codeOrName.trim();
  const direct = COUNTRY_LOOKUP.get(trimmed.toUpperCase());
  if (direct) return direct;
  return COUNTRY_LOOKUP.get(trimmed.toLowerCase());
}

/**
 * Returns a cached array of all countries.
 */
export function getAllCountries(): CountryMetadata[] {
  return ALL_COUNTRIES_LIST;
}

/**
 * Checks if a point [lat, lng] is roughly within a country's bounding box.
 */
export function isPointInCountryBBox(
  lat: number,
  lng: number,
  country: CountryMetadata
): boolean {
  const [minLng, minLat, maxLng, maxLat] = country.bbox;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}
