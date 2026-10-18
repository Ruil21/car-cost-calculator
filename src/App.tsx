import { useState } from 'react';
import { compare } from './lib/model';
import './App.css';

const DEFAULTS = {
  km: 15000, hw: 40, home: 70, years: 6,
  fuel: 1.75, hp: 0.2, pp: 0.55,
  evHw: 30, evLoss: 15, iceUp: 10,
  evP: 38000, evI: 0, evC: 16.5, evR: 50, evM: 350, evS: 700, evT: 0,
  icP: 28000, icC: 5.8, icR: 48, icM: 650, icS: 600, icT: 150,
};
type Key = keyof typeof DEFAULTS;

const GROUPS: { title: string; fields: [Key, string, string][] }[] = [
  { title: 'Your usage', fields: [['km', 'Distance / year', 'km'], ['hw', 'Highway share', '%'], ['home', 'Home charging share', '%'], ['years', 'Ownership period', 'yrs']] },
  { title: 'Energy prices', fields: [['fuel', 'Fuel', '€/L'], ['hp', 'Home electricity', '€/kWh'], ['pp', 'Public charging', '€/kWh']] },
  { title: 'Electric car', fields: [['evP', 'Purchase price', '€'], ['evI', 'Incentive', '€'], ['evC', 'WLTP consumption', 'kWh/100km'], ['evR', 'Resale after period', '%'], ['evM', 'Maintenance / yr', '€'], ['evS', 'Insurance / yr', '€'], ['evT', 'Road tax / yr', '€']] },
  { title: 'Combustion car', fields: [['icP', 'Purchase price', '€'], ['icC', 'WLTP consumption', 'L/100km'], ['icR', 'Resale after period', '%'], ['icM', 'Maintenance / yr', '€'], ['icS', 'Insurance / yr', '€'], ['icT', 'Road tax / yr', '€']] },
  { title: 'Real-world assumptions', fields: [['evHw', 'EV extra use on highway', '%'], ['evLoss', 'EV winter + charging losses', '%'], ['iceUp', 'Combustion real-world vs WLTP', '%']] },
];

const eur = (n: number) => `${n < 0 ? '-' : ''}€${Math.abs(Math.round(n)).toLocaleString('en-GB')}`;

export default function App() {
  const [v, setV] = useState(DEFAULTS);

  const r = compare(
    { kmPerYear: v.km, highwayShare: v.hw / 100, homeChargeShare: v.home / 100, years: Math.max(1, v.years) },
    { fuelPerL: v.fuel, homeKwh: v.hp, publicKwh: v.pp },
    { evHighwayUplift: v.evHw / 100, evLoss: v.evLoss / 100, iceUplift: v.iceUp / 100 },
    { price: v.evP, incentive: v.evI, kwhPer100: v.evC, resale: v.evR / 100, maintenance: v.evM, insurance: v.evS, tax: v.evT },
    { price: v.icP, lPer100: v.icC, resale: v.icR / 100, maintenance: v.icM, insurance: v.icS, tax: v.icT },
  );

  const winner = r.difference > 0 ? 'Electric' : 'Combustion';
  const be =
    r.breakEven.kind === 'km' ? `${Math.round(r.breakEven.value / 100) * 100} km/year`
    : r.breakEven.kind === 'always-ev' ? 'EV wins at any mileage'
    : 'No break-even (combustion wins)';

  return (
    <main>
      <h1>⚡ EV vs Combustion: what will it really cost?</h1>

      <section className="results">
        <div className="card"><h2>Electric</h2><p className="big ev">{eur(r.evTotal)}</p></div>
        <div className="card"><h2>Combustion</h2><p className="big ice">{eur(r.iceTotal)}</p></div>
        <div className="card"><h2>Verdict</h2><p className="big">{winner} by {eur(Math.abs(r.difference))}</p></div>
        <div className="card"><h2>Break-even</h2><p className="big">{be}</p></div>
      </section>

      <section className="inputs">
        {GROUPS.map((g) => (
          <div className="card" key={g.title}>
            <h2>{g.title}</h2>
            {g.fields.map(([k, label, unit]) => (
              <label key={k}>
                {label}
                <span>
                  <input type="number" step="any" value={v[k]}
                    onChange={(e) => setV({ ...v, [k]: e.target.valueAsNumber || 0 })} /> {unit}
                </span>
              </label>
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}