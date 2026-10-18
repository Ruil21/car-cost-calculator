import { useState } from 'react';
import { compare } from './lib/model';
import { REGIONS, PROFILES, pricesOf, type Prices } from './data/regions';
import './App.css';

const DEFAULTS = {
  km: 15000, hw: 40, years: 6, home: 80, fast: 30,
  evHw: 30, evLoss: 15, iceUp: 10,
  evP: 38000, evI: 0, evC: 16.5, evR: 50, evM: 350, evS: 700, evT: 0,
  icP: 28000, icC: 5.8, icR: 48, icM: 650, icS: 600, icT: 150,
};
type Key = keyof typeof DEFAULTS;

const GROUPS: { title: string; fields: [Key, string, string][] }[] = [
  { title: 'Ownership', fields: [['years', 'Ownership period', 'yrs']] },
  { title: 'Electric car', fields: [['evP', 'Purchase price', '€'], ['evI', 'Incentive', '€'], ['evC', 'WLTP consumption', 'kWh/100km'], ['evR', 'Resale after period', '%'], ['evM', 'Maintenance / yr', '€'], ['evS', 'Insurance / yr', '€'], ['evT', 'Road tax / yr', '€']] },
  { title: 'Combustion car', fields: [['icP', 'Purchase price', '€'], ['icC', 'WLTP consumption', 'L/100km'], ['icR', 'Resale after period', '%'], ['icM', 'Maintenance / yr', '€'], ['icS', 'Insurance / yr', '€'], ['icT', 'Road tax / yr', '€']] },
  { title: 'Real-world assumptions', fields: [['evHw', 'EV extra use on highway', '%'], ['evLoss', 'EV winter + charging losses', '%'], ['iceUp', 'Combustion real-world vs WLTP', '%']] },
];

const PRICE_FIELDS: [keyof Prices, string, string][] = [
  ['fuel', 'Fuel', '€/L'], ['home', 'Home electricity (standard)', '€/kWh'], ['offPeak', 'Home electricity (off-peak)', '€/kWh'],
  ['ac', 'Public AC (slow)', '€/kWh'], ['dc', 'Public DC (fast)', '€/kWh'],
];

const eur = (n: number) => `${n < 0 ? '-' : ''}€${Math.abs(Math.round(n)).toLocaleString('en-GB')}`;

export default function App() {
  const [v, setV] = useState(DEFAULTS);
  const [region, setRegion] = useState('pt');
  const [prices, setPrices] = useState<Prices>(pricesOf('pt'));
  const [hasHome, setHasHome] = useState(true);
  const [offPeak, setOffPeak] = useState(false);
  const [custom, setCustom] = useState(false);

  const homePrice = offPeak ? prices.offPeak : prices.home;
  const publicPrice = (1 - v.fast / 100) * prices.ac + (v.fast / 100) * prices.dc;

  const r = compare(
    { kmPerYear: v.km, highwayShare: v.hw / 100, homeChargeShare: hasHome ? v.home / 100 : 0, years: Math.max(1, v.years) },
    { fuelPerL: prices.fuel, homeKwh: homePrice, publicKwh: publicPrice },
    { evHighwayUplift: v.evHw / 100, evLoss: v.evLoss / 100, iceUplift: v.iceUp / 100 },
    { price: v.evP, incentive: v.evI, kwhPer100: v.evC, resale: v.evR / 100, maintenance: v.evM, insurance: v.evS, tax: v.evT },
    { price: v.icP, lPer100: v.icC, resale: v.icR / 100, maintenance: v.icM, insurance: v.icS, tax: v.icT },
  );

  const winner = r.difference > 0 ? 'Electric' : 'Combustion';
  const be =
    r.breakEven.kind === 'km' ? `${Math.round(r.breakEven.value / 100) * 100} km/year`
    : r.breakEven.kind === 'always-ev' ? 'EV wins at any mileage'
    : 'No break-even (combustion wins)';

  const num = (val: number, set: (n: number) => void) => (
    <input type="number" step="any" value={val} onChange={(e) => set(e.target.valueAsNumber || 0)} />
  );

  return (
    <main>
      <h1>⚡ EV vs Combustion: what will it really cost?</h1>

      <section className="results">
        <div className="card"><h2>Electric</h2><p className="big ev">{eur(r.evTotal)}</p><p className="sub">{(r.evKm * 100).toFixed(1)} € / 100 km</p></div>
        <div className="card"><h2>Combustion</h2><p className="big ice">{eur(r.iceTotal)}</p><p className="sub">{(r.iceKm * 100).toFixed(1)} € / 100 km</p></div>
        <div className="card"><h2>Verdict</h2><p className="big">{winner} by {eur(Math.abs(r.difference))}</p></div>
        <div className="card"><h2>Break-even</h2><p className="big">{be}</p></div>
      </section>

      <section className="card situation">
        <h2>Your situation</h2>

        <p className="q">1. Where do you live?</p>
        <select value={region} onChange={(e) => { setRegion(e.target.value); setPrices(pricesOf(e.target.value)); }}>
          {Object.entries(REGIONS).map(([k, x]) => <option key={k} value={k}>{x.name}</option>)}
        </select>

        <p className="q">2. How do you drive?</p>
        <div className="choices">
          {Object.entries(PROFILES).map(([k, p]) => (
            <button
              key={k}
              className={!custom && v.km === p.km && v.hw === p.hw ? 'active' : ''}
              onClick={() => { setCustom(false); setV({ ...v, km: p.km, hw: p.hw }); }}
            >
              {p.label}<small>{p.km.toLocaleString('en-GB')} km/yr, {p.hw}% highway</small>
            </button>
          ))}
          <button className={custom ? 'active' : ''} onClick={() => setCustom(true)}>
            Custom<small>enter your own numbers</small>
          </button>
        </div>

        {custom && (
          <>
            <label>Distance per year <span>{num(v.km, (n) => setV({ ...v, km: n }))} km</span></label>
            <label>Highway share <span>{num(v.hw, (n) => setV({ ...v, hw: Math.min(100, n) }))} %</span></label>
          </>
        )}

        <p className="q">3. Can you charge an EV at home?</p>
        <div className="choices">
          <button className={hasHome ? 'active' : ''} onClick={() => setHasHome(true)}>Yes<small>garage, driveway or own parking</small></button>
          <button className={!hasHome ? 'active' : ''} onClick={() => setHasHome(false)}>No<small>public chargers only</small></button>
        </div>

        {hasHome ? (
          <>
            <label>Share of charging done at home <span>{num(v.home, (n) => setV({ ...v, home: Math.min(100, n) }))} %</span></label>
            <label className="check"><input type="checkbox" checked={offPeak} onChange={(e) => setOffPeak(e.target.checked)} /> I charge mostly overnight on an off-peak / bi-hourly tariff</label>
            <label>Share of public charging that is fast (DC) <span>{num(v.fast, (n) => setV({ ...v, fast: Math.min(100, n) }))} %</span></label>
            <p className="sub">Home electricity: {homePrice.toFixed(2)} €/kWh · public: {publicPrice.toFixed(2)} €/kWh</p>
          </>
        ) : (
          <>
            <label>Share of public charging that is fast (DC) <span>{num(v.fast, (n) => setV({ ...v, fast: Math.min(100, n) }))} %</span></label>
            <p className="sub">Your average charging price: {publicPrice.toFixed(2)} €/kWh. Public charging can be much more expensive than home electricity, so the EV advantage often shrinks without home charging.</p>
          </>
        )}
      </section>

      <section className="inputs">
        {GROUPS.map((g) => (
          <div className="card" key={g.title}>
            <h2>{g.title}</h2>
            {g.fields.map(([k, label, unit]) => (
              <label key={k}>{label}<span>{num(v[k], (n) => setV({ ...v, [k]: n }))} {unit}</span></label>
            ))}
          </div>
        ))}
      </section>

      <details>
        <summary>Advanced prices (editable)</summary>
        <div className="card">
          {PRICE_FIELDS.map(([k, label, unit]) => (
            <label key={k}>{label}<span>{num(prices[k], (n) => setPrices({ ...prices, [k]: n }))} {unit}</span></label>
          ))}
          <p className="sub">Defaults are ballpark values for the chosen country. Check them against your own bills and local charger prices.</p>
        </div>
      </details>
    </main>
  );
}