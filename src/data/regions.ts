import data from './prices.json';

export interface Prices { petrol: number; diesel: number; home: number; offPeak: number; ac: number; dc: number }
export interface Region extends Prices { name: string; updated: string; sources: string[]; power: Record<string, number> }

export const REGIONS = data as Record<string, Region>;

export const pricesOf = (key: string): Prices => {
  const { petrol, diesel, home, offPeak, ac, dc } = REGIONS[key];
  return { petrol, diesel, home, offPeak, ac, dc };
};

export const PROFILES = {
  city: { label: 'City commuter', km: 8000, hw: 10 },
  mixed: { label: 'Mixed driving', km: 15000, hw: 40 },
  long: { label: 'Long distance', km: 25000, hw: 70 },
};