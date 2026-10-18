import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'data/sources/portugal.json';
// 'PrecoMedio' = average incl. standard discounts; 'PrecoMedioSDesc' = pump price before discounts
const FIELD = 'PrecoMedio';
const FUELS = { petrol95: 'Gasolina simples 95', diesel: 'Gasóleo simples' };

const iso = (d) => d.toISOString().slice(0, 10);
const end = new Date();
const start = new Date(end.getTime() - 10 * 86400000);

const url = new URL('https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/PMD');
url.search = new URLSearchParams({
  idsTiposComb: '3201,2101',
  dataIni: iso(start),
  dataFim: iso(end),
  qtdPorPagina: '7',
  pagina: '1',
  orderDesc: '1',
}).toString();

const res = await fetch(url);
if (!res.ok) throw new Error(`DGEG request failed: ${res.status}`);
const body = await res.json();
if (!body.status || !Array.isArray(body.resultado)) throw new Error('Unexpected DGEG response shape');

// "2,144 €" -> 2.144
const toNumber = (s) => parseFloat(String(s).replace('€', '').replace(',', '.'));

const latest = {};
for (const [key, name] of Object.entries(FUELS)) {
  const rows = body.resultado
    .filter((r) => r.TipoCombustivel === name)
    .sort((a, b) => b.Data.localeCompare(a.Data));
  if (!rows.length) throw new Error(`No rows for ${name}`);
  const price = toNumber(rows[0][FIELD]);
  const ageDays = (Date.now() - new Date(rows[0].Data).getTime()) / 86400000;
  if (!Number.isFinite(price) || price < 0.8 || price > 3.5) throw new Error(`Suspicious ${name} price: ${price}`);
  if (ageDays > 7) throw new Error(`${name} data is stale (${rows[0].Data})`);
  latest[key] = { date: rows[0].Data, price };
}

const src = JSON.parse(readFileSync(FILE, 'utf8'));
src.fuel.petrol95 = latest.petrol95.price;
src.fuel.diesel = latest.diesel.price;
const dates = [...new Set([latest.petrol95.date, latest.diesel.date])].join(' / ');
const kind = FIELD === 'PrecoMedio' ? 'includes standard station discounts' : 'pump price before discounts';
src.fuel.source = `DGEG daily national average (${kind}), ${dates}`;
src.updated = iso(new Date());

writeFileSync(FILE, JSON.stringify(src, null, 2) + '\n');
console.log('Updated fuel prices:', latest);
