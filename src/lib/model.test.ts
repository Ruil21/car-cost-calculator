import { describe, it, expect } from 'vitest';
import { compare, type Usage, type Prices, type Assumptions, type Ev, type Ice } from './model';

const usage: Usage = { kmPerYear: 15000, highwayShare: 0.4, homeChargeShare: 0.7, years: 6 };
const prices: Prices = { fuelPerL: 1.75, homeKwh: 0.2, publicKwh: 0.55 };
const a: Assumptions = { evHighwayUplift: 0.3, evLoss: 0.15, iceUplift: 0.1 };
const ev: Ev = { price: 38000, incentive: 0, kwhPer100: 16.5, resale: 0.5, maintenance: 350, insurance: 700, tax: 0 };
const ice: Ice = { price: 28000, lPer100: 5.8, resale: 0.48, maintenance: 650, insurance: 600, tax: 150 };

describe('compare', () => {
  it('totals are equal at the break-even distance', () => {
    const r = compare(usage, prices, a, ev, ice);
    expect(r.breakEven.kind).toBe('km');
    if (r.breakEven.kind !== 'km') return;
    const at = compare({ ...usage, kmPerYear: r.breakEven.value }, prices, a, ev, ice);
    expect(Math.abs(at.evTotal - at.iceTotal)).toBeLessThan(1);
  });

  it('EV is always cheaper when it is cheaper upfront and per km', () => {
    const r = compare(usage, prices, a, { ...ev, price: 20000 }, ice);
    expect(r.breakEven.kind).toBe('always-ev');
  });

  it('there is no break-even when the combustion car is cheaper upfront and per km', () => {
    const r = compare(usage, { ...prices, fuelPerL: 0.5 }, a, ev, ice);
    expect(r.breakEven.kind).toBe('none');
  });

  it('more highway driving raises real EV consumption', () => {
    const city = compare({ ...usage, highwayShare: 0 }, prices, a, ev, ice);
    const hwy = compare({ ...usage, highwayShare: 1 }, prices, a, ev, ice);
    expect(hwy.realKwh).toBeGreaterThan(city.realKwh);
  });
});

describe('home charging setup', () => {
  it('wallbox adds its cost to the EV total', () => {
    const base = compare(usage, prices, a, ev, ice);
    const withWb = compare(usage, prices, a, { ...ev, wallbox: 1200 }, ice);
    expect(withWb.evTotal - base.evTotal).toBeCloseTo(1200);
  });

  it('extra contracted power cost scales with the ownership period', () => {
    const base = compare(usage, prices, a, ev, ice);
    const withPower = compare(usage, prices, a, { ...ev, extraFixedPerYear: 78 }, ice);
    expect(withPower.evTotal - base.evTotal).toBeCloseTo(78 * usage.years);
  });
});
