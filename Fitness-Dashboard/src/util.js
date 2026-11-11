import { FOODS, MEALS } from './data/nutrition.js';
import { phaseForWeek, DELOAD_WEEKS, DIET_BREAK_WEEKS } from './data/exercises.js';

export const PROFILE = { age: 24, height: 183, startWeight: 95, startWaist: 109, sex: 'Kişi', goalWeight: 85, goalWaist: 96 };
// Nisbi yağ kütləsi (RFM, kişi): 64 − 20 × boy/bel — yalnız boy və beldən təxmini bədən yağı %
export const rfm = (waist, height = PROFILE.height) => (waist ? 64 - 20 * (height / waist) : null);
export const DEFAULT_START = '2026-11-09';
export const JAN_SWITCH = new Date(2027, 0, 1);

const pad = (n) => String(n).padStart(2, '0');
// Saat köməkçiləri: "HH:MM" ↔ dəqiqə (gecə yarısını keçən vaxtlar üçün 1440-dan böyük ola bilər)
export const toMin = (s) => { const [h, m] = String(s || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
export const hmOf = (m) => { const r = ((Math.round(m) % 1440) + 1440) % 1440; return `${pad(Math.floor(r / 60))}:${pad(r % 60)}`; };
// Ev günləri (iş yoxdur): bütün plan oyanma vaxtından hesablanır
export const DEFAULT_HOME_WAKE = '11:00';
export function homeTimes(wake = DEFAULT_HOME_WAKE) {
  const w = toMin(wake || DEFAULT_HOME_WAKE);
  return { wake: w, b: w + 30, act: w + 180, l: w + 285, s: w + 450, d: w + 600, late: w + 750, sleep: w + 840 };
}
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
// Ağıllı kalori düzəlişi: hədəfi və karbohidrat porsiyalarını birlikdə dəyişir
export function applyAdj(t, adj = 0) {
  if (!adj) return { ...t, adj: 0, carbScale: 1 };
  const carbs = (k) => Math.max(100, Math.round((k - t.protein * 4 - t.fat * 9) / 4));
  const train = t.train + adj; const rest = t.rest + adj;
  return { ...t, base: t.base + adj, train, rest, carbsTrain: carbs(train), carbsRest: carbs(rest), adj, carbScale: Math.max(0.55, Math.min(1.4, 1 + adj / 800)) };
}

// Gündəlik kalori fərqi fazaya görə: hədəf xətti (TARGET_WAYPOINTS) ilə eyni tempi verir.
// Faza 1–2: ≈ −0,4 kq/həftə; faza 3–4: ≈ −0,2 kq/həftə (əzələ artımına yer qalır); faza 5: yüngül artıq.
export const DEFICIT = { 1: -450, 2: -450, 3: -250, 4: -250, 5: 150 };
export function computeTargets(weight, phaseN = 1, dietBreak = false) {
  const bmr = 10 * weight + 6.25 * PROFILE.height - 5 * PROFILE.age + 5;
  const tdee = bmr * 1.45;
  const adj = phaseN === 5 ? DEFICIT[5] : dietBreak ? 0 : DEFICIT[phaseN] ?? -450;
  const base = Math.max(1900, round50(tdee + adj));
  const protein = 180;
  const fat = Math.max(60, Math.round(weight * 0.75));
  const train = base + 100;
  const rest = base - 75;
  const carbs = (k) => Math.max(100, Math.round((k - protein * 4 - fat * 9) / 4));
  return {
    bmr: Math.round(bmr), tdee: Math.round(tdee), base, train, rest, protein, fat,
    carbsTrain: carbs(train), carbsRest: carbs(rest), ...water(weight), deficit: adj,
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

// Gündəlik ölçü: "1½ dilim", "½ xörək qaşığı" və s.
function frac(q) {
  const r = Math.round(q * 2) / 2;
  const whole = Math.floor(r); const half = r - whole >= 0.5;
  if (r === 0) return '¼';
  return `${whole || ''}${half ? '½' : ''}`;
}
export function household(id, grams) {
  const f = FOODS[id];
  if (!f || !f.u) return '';
  const [name, g] = f.u;
  let q = grams / g;
  if (name === 'xörək qaşığı' && q < 0.75) return `${frac(grams / 5)} çay qaşığı`;
  if (q >= 8) return `${Math.round(q)} ${name}`;
  return `${frac(q)} ${name}`;
}

export function sumMacros(list) {
  return list.reduce((a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f }), { kcal: 0, p: 0, c: 0, f: 0 });
}

export function mealItems(option, restDay, scale = 1) {
  return option.items.map(([id, g, flex]) => {
    const grams = flex ? round5(g * (restDay ? 0.75 : 1) * scale) : g;
    return { id, grams, flex: !!flex, ...macrosOf(id, grams) };
  });
}

// Günün menyusu hədəf kaloriyə uyğunlaşdırılır: karbohidrat mənbələrinin (flex) porsiyası
// elə seçilir ki, 5 öyünün cəmi günün hədəfinə bərabər olsun.
export function dayMeals(idx, kTarget) {
  const opts = MEALS.map((m, i) => m.options[Math.min((idx || [])[i] ?? 0, m.options.length - 1)]);
  let fixed = 0; let flex = 0;
  opts.forEach((o) => o.items.forEach(([id, g, fx]) => { const k = macrosOf(id, g).kcal; if (fx) flex += k; else fixed += k; }));
  const s = flex && kTarget ? Math.max(0.5, Math.min(1.9, (kTarget - fixed) / flex)) : 1;
  return opts.map((o) => o.items.map(([id, g, fx]) => {
    const grams = fx ? Math.max(5, round5(g * s)) : g;
    return { id, grams, flex: !!fx, ...macrosOf(id, grams) };
  }));
}
// «Başqa şey yedim» qeydlərinin (Claude-un təxmini) cəmi
export function altEaten(dayDoc) {
  const meals = (dayDoc && dayDoc.meals) || {}; const alt = (dayDoc && dayDoc.mealAlt) || {};
  return sumMacros(Object.keys(alt).filter((i) => meals[i] === 'other' && alt[i] && alt[i].kcal != null).map((i) => ({ kcal: alt[i].kcal || 0, p: alt[i].p || 0, c: alt[i].c || 0, f: alt[i].f || 0 })));
}
// Gündəlikdə «Yedim» işarələnmiş plan öyünlərinin cəmi
export function planEaten(dayDoc, idx, kTarget) {
  const meals = (dayDoc && dayDoc.meals) || {};
  const fitted = dayMeals(idx, kTarget);
  return sumMacros(fitted.filter((_, i) => meals[i] === 'yes').map((items) => sumMacros(items)));
}

export function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
export function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* yaddaş bağlıdır */ }
}

export function dayPlan(dow, schedKey, phaseN, homeWake = DEFAULT_HOME_WAKE) {
  const home = schedKey === 'jan' ? [5, 6, 0] : [1, 6, 0];
  const atHome = home.includes(dow);
  const steps = fmtInt(stepsTarget(phaseN));
  const items = [];
  if (dow === 2) items.push({ k: 'train', t: 'Məşq A · 18:30', s: 'Tam bədən' });
  if (dow === 4) items.push({ k: 'train', t: 'Məşq B · 18:30', s: 'Tam bədən' });
  if (dow === 6) items.push({ k: 'train', t: `Məşq C · ${hmOf(homeTimes(homeWake).act)}`, s: 'Tam bədən' });
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
