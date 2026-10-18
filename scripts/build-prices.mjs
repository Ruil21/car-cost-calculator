import { readFileSync, writeFileSync } from 'node:fs';

const src = JSON.parse(readFileSync('data/sources/portugal.json', 'utf8'));
const round3 = (n) => Math.round(n * 1000) / 1000;
const vat = 1 + src.vat;
const adj = src.electricity.octoberAdjustment ?? 0;

const prices = {
  petrol: src.fuel.petrol95,
  diesel: src.fuel.diesel,
  home: round3((src.electricity.simple + adj) * vat),
  offPeak: round3((src.electricity.offPeak + adj) * vat),
  ac: src.publicCharging.ac,
  dc: src.publicCharging.dc,
};

// Sanity checks catch typos before they reach the site
const limits = { petrol: [0.8, 3.5], diesel: [0.8, 3.5], home: [0.05, 0.8], offPeak: [0.03, 0.8], ac: [0.05, 1.5], dc: [0.1, 1.5] };
for (const [k, [lo, hi]] of Object.entries(limits)) {
  if (!Number.isFinite(prices[k]) || prices[k] < lo || prices[k] > hi) {
    throw new Error(`Suspicious value for ${k}: ${prices[k]}`);
  }
}

const out = {
  pt: {
    name: src.name,
    updated: src.updated,
    sources: [src.fuel.source, src.electricity.source, src.publicCharging.source],
    ...prices,
  },
};

writeFileSync('src/data/prices.json', JSON.stringify(out, null, 2) + '\n');
console.log('Wrote src/data/prices.json', prices);
