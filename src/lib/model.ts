export interface Usage { kmPerYear: number; highwayShare: number; homeChargeShare: number; years: number } // shares are 0-1
export interface Prices { fuelPerL: number; homeKwh: number; publicKwh: number }
export interface Assumptions { evHighwayUplift: number; evLoss: number; iceUplift: number } // fractions, e.g. 0.3
export interface Car {
  price: number; resale: number; // resale = fraction of price kept after the period
  maintenance: number; insurance: number; tax: number; // per year
}
export interface Ev extends Car { incentive: number; kwhPer100: number }
export interface Ice extends Car { lPer100: number }

export type BreakEven = { kind: 'km'; value: number } | { kind: 'always-ev' } | { kind: 'none' };

export function compare(u: Usage, p: Prices, a: Assumptions, ev: Ev, ice: Ice) {
  const realKwh = ev.kwhPer100 * (1 + a.evHighwayUplift * u.highwayShare) * (1 + a.evLoss);
  const evKm = (realKwh / 100) * (u.homeChargeShare * p.homeKwh + (1 - u.homeChargeShare) * p.publicKwh);
  const iceKm = (ice.lPer100 * (1 + a.iceUplift) / 100) * p.fuelPerL;

  const fixed = (c: Car, incentive = 0) =>
    c.price - incentive - c.price * c.resale + u.years * (c.maintenance + c.insurance + c.tax);
  const evFix = fixed(ev, ev.incentive);
  const iceFix = fixed(ice);

  const evTotal = evFix + u.years * u.kmPerYear * evKm;
  const iceTotal = iceFix + u.years * u.kmPerYear * iceKm;

  let breakEven: BreakEven;
  if (iceKm > evKm) {
    const km = (evFix - iceFix) / (u.years * (iceKm - evKm));
    breakEven = km <= 0 ? { kind: 'always-ev' } : { kind: 'km', value: km };
  } else {
    breakEven = evFix <= iceFix ? { kind: 'always-ev' } : { kind: 'none' };
  }

  return { realKwh, evKm, iceKm, evTotal, iceTotal, difference: iceTotal - evTotal, breakEven };
}