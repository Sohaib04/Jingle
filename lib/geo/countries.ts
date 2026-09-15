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

/**
 * Returns metadata for a country by its 2-letter or 3-letter code.
 */
export function getCountry(codeOrName: string): CountryMetadata | undefined {
  if (!codeOrName) return undefined;
  const upper = codeOrName.toUpperCase().trim();

  // Try 2-letter ISO
  if (COUNTRIES_MAP[upper]) {
    return COUNTRIES_MAP[upper];
  }

  // Try 3-letter ISO or Name match
  for (const country of Object.values(COUNTRIES_MAP)) {
    if (
      country.code3.toUpperCase() === upper ||
      country.name.toLowerCase() === codeOrName.toLowerCase() ||
      country.formalName.toLowerCase() === codeOrName.toLowerCase()
    ) {
      return country;
    }
  }

  return undefined;
}

/**
 * Returns an array of all countries.
 */
export function getAllCountries(): CountryMetadata[] {
  return Object.values(COUNTRIES_MAP);
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
