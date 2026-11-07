import { FOODS } from './data/nutrition.js';
import { phaseForWeek, DELOAD_WEEKS, DIET_BREAK_WEEKS } from './data/exercises.js';

export const PROFILE = { age: 24, height: 180, startWeight: 95, sex: 'Kişi', goalWeight: 85 };
export const DEFAULT_START = '2026-11-09';
export const JAN_SWITCH = new Date(2027, 0, 1);

const pad = (n) => String(n).padStart(2, '0');
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const daysBetween = (a, b) => Math.round((fromISO(toISO(b)) - fromISO(toISO(a))) / 86400000);
export const mondayOf = (d) => { const x = fromISO(toISO(d)); const dow = (x.getDay() + 6) % 7; return addDays(x, -dow); };

export const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
export const MON_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
export const DOW_NAMES = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];
export const DOW_SHORT = ['B.', 'B.e.', 'Ç.a.', 'Ç.', 'C.a.', 'C.', 'Ş.'];
export const fmtDate = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const fmtDateY = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
export const fmtNum = (n, digits = 1) => (n == null || Number.isNaN(n) ? '—' : Number(n).toFixed(digits).replace('.', ','));
export const fmtInt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
export const round5 = (n) => Math.round(n / 5) * 5;
export const round50 = (n) => Math.round(n / 50) * 50;

export function programWeek(startISO, today = new Date()) {
  const d = daysBetween(fromISO(startISO), today);
  if (d < 0) return 0;
  return Math.min(52, Math.floor(d / 7) + 1);
}

export function weekContext(week) {
  const phase = phaseForWeek(Math.max(1, week));
  return { phase, deload: DELOAD_WEEKS.includes(week), dietBreak: DIET_BREAK_WEEKS.includes(week) };
}

export function stepsTarget(phaseN) {
  return phaseN === 1 ? 7000 : phaseN === 2 ? 8500 : 10000;
}

// Mifflin-St Jeor + aktivlik əmsalı 1.45 (ofis işi + addımlar + həftədə 3 məşq)
export function computeTargets(weight, phaseN = 1, dietBreak = false) {
  const bmr = 10 * weight + 6.25 * PROFILE.height - 5 * PROFILE.age + 5;
  const tdee = bmr * 1.45;
  const adj = phaseN === 5 ? 150 : dietBreak ? 0 : -450;
  const base = Math.max(1900, round50(tdee + adj));
  const protein = 180;
  const fat = Math.max(60, Math.round(weight * 0.75));
  const train = base + 100;
  const rest = base - 75;
  const carbs = (k) => Math.max(100, Math.round((k - protein * 4 - fat * 9) / 4));
  return {
    bmr: Math.round(bmr), tdee: Math.round(tdee), base, train, rest, protein, fat,
    carbsTrain: carbs(train), carbsRest: carbs(rest), ...water(weight),
    mode: phaseN === 5 ? 'surplus' : dietBreak ? 'maintenance' : 'deficit',
  };
}

// Su: çəkinin hər kq-na 33 ml (istirahət günü) + məşq günü 0.6 l. 1 stəkan = 250 ml.
export const GLASS_ML = 250;
export function water(weight) {
  const restL = Math.round(weight * 0.033 * 10) / 10;
  const trainL = Math.round((restL + 0.6) * 10) / 10;
  return { waterRest: restL, waterTrain: trainL, glassesRest: Math.round((restL * 1000) / GLASS_ML), glassesTrain: Math.round((trainL * 1000) / GLASS_ML) };
}

export function macrosOf(foodId, grams) {
  const f = FOODS[foodId];
  if (!f) return { kcal: 0, p: 0, c: 0, f: 0 };
  const k = grams / 100;
  return { kcal: f.v[0] * k, p: f.v[1] * k, c: f.v[2] * k, f: f.v[3] * k };
}

export function sumMacros(list) {
  return list.reduce((a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f }), { kcal: 0, p: 0, c: 0, f: 0 });
}

export function mealItems(option, restDay) {
  return option.items.map(([id, g, flex]) => {
    const grams = flex && restDay ? round5(g * 0.75) : g;
    return { id, grams, flex: !!flex, ...macrosOf(id, grams) };
  });
}

export function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
export function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* yaddaş bağlıdır */ }
}

export function dayPlan(dow, schedKey, phaseN) {
  const home = schedKey === 'jan' ? [5, 6, 0] : [1, 6, 0];
  const atHome = home.includes(dow);
  const steps = fmtInt(stepsTarget(phaseN));
  const items = [];
  if (dow === 2) items.push({ k: 'train', t: 'Məşq A · 18:30', s: 'Tam bədən' });
  if (dow === 4) items.push({ k: 'train', t: 'Məşq B · 18:30', s: 'Tam bədən' });
  if (dow === 6) items.push({ k: 'train', t: 'Məşq C · 11:00', s: 'Tam bədən' });
  const swimDay = schedKey === 'jan' ? 5 : 1;
  if (dow === swimDay) items.push({ k: 'swim', t: 'Üzgüçülük 30–40 dəq', s: 'Yüngül temp, fasilələrlə' });
  if (dow === 0) {
    items.push({ k: 'measure', t: 'Ölçmə: çəki + bel', s: 'Səhər, ac qarına' });
    items.push({ k: 'walk', t: 'Uzun gəzinti 45–60 dəq', s: phaseN >= 3 ? 'və ya 2-ci üzgüçülük' : 'Bulvar və ya park' });
    items.push({ k: 'prep', t: 'Həftəlik yemək hazırlığı', s: 'Toyuq, qarabaşaq, salat' });
  }
  if (dow === 3 || (dow === 5 && schedKey !== 'jan') || (dow === 1 && schedKey === 'jan')) {
    items.push({ k: 'walk', t: 'Aktiv istirahət', s: 'İşdən sonra Bulvarda 30 dəq gəzinti' });
  }
  items.push({ k: 'steps', t: `${steps}+ addım`, s: '' });
  return { atHome, work: !atHome, items };
}
