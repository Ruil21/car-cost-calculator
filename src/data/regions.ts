export interface Region { name: string; fuel: number; home: number; offPeak: number; ac: number; dc: number }
export type Prices = Omit<Region, 'name'>;

// Ballpark defaults (EUR). Replace with real data (ERSE/DGEG etc.) later.
export const REGIONS: Record<string, Region> = {
  pt: { name: 'Portugal', fuel: 1.75, home: 0.20, offPeak: 0.12, ac: 0.45, dc: 0.65 },
  es: { name: 'Spain', fuel: 1.60, home: 0.20, offPeak: 0.10, ac: 0.40, dc: 0.55 },
  fr: { name: 'France', fuel: 1.80, home: 0.25, offPeak: 0.19, ac: 0.40, dc: 0.60 },
  de: { name: 'Germany', fuel: 1.75, home: 0.37, offPeak: 0.30, ac: 0.50, dc: 0.65 },
};

export const pricesOf = (key: string): Prices => {
  const { fuel, home, offPeak, ac, dc } = REGIONS[key];
  return { fuel, home, offPeak, ac, dc };
};

export const PROFILES = {
  city: { label: 'City commuter', km: 8000, hw: 10 },
  mixed: { label: 'Mixed driving', km: 15000, hw: 40 },
  long: { label: 'Long distance', km: 25000, hw: 70 },
};