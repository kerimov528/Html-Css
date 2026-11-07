import { Card, H2, Pill } from './ui.jsx';
import { EX } from './data/exercises.js';
import { dayScore } from './journal.jsx';
import { e1rm, doneSets } from './gym.jsx';
import { fromISO, toISO, addDays, mondayOf, daysBetween, fmtNum, fmtInt, fmtDate, MONTHS, MON_SHORT } from './util.js';

const { useState, useMemo } = React;
const TRAIN_DOW = [2, 4, 6];
const kgS = (n) => fmtNum(n, n % 1 ? 1 : 0);

// Bütün məşq qeydlərini hərəkət üzrə topla: [{iso, sets, top, best}]
export function liftHistory(days) {
  const out = {};
  for (const iso of Object.keys(days).sort()) {
    const lifts = (days[iso] || {}).lifts || {};
    for (const [id, arr] of Object.entries(lifts)) {
      const sets = doneSets(arr);
      if (!sets.length) continue;
      const top = Math.max(...sets.map((s) => Number(s.kg) || 0));
      const bestSet = sets.reduce((a, s) => (e1rm(s.kg, s.r) > e1rm(a.kg, a.r) ? s : a), sets[0]);
      (out[id] = out[id] || []).push({ iso, sets, top, best: e1rm(bestSet.kg, bestSet.r), bestSet });
    }
  }
  return out;
}

// ---------- 4. Güc qrafikləri və rekordlar ----------
function MiniChart({ pts, unit }) {
  if (pts.length < 2) return <div className="chart-empty">Qrafik üçün ən azı 2 məşq lazımdır.</div>;
  const W = 640; const H = 220; const P = { l: 44, r: 12, t: 14, b: 28 };
  const xs = pts.map((p) => fromISO(p.iso).getTime());
  const ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs); const x1 = Math.max(...xs);
  const y0 = Math.floor(Math.min(...ys) * 0.95); const y1 = Math.ceil(Math.max(...ys) * 1.05);
  const X = (x) => P.l + ((x - x0) / Math.max(1, x1 - x0)) * (W - P.l - P.r);
  const Y = (y) => H - P.b - ((y - y0) / Math.max(1, y1 - y0)) * (H - P.t - P.b);
  const ticks = [y0, Math.round((y0 + y1) / 2), y1];
  const maxY = Math.max(...ys);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mini-chart" role="img" aria-label={`Güc qrafiki, ${unit}`}>
      {ticks.map((t) => <g key={t}><line x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)} className="mc-grid" /><text x={P.l - 6} y={Y(t) + 4} textAnchor="end" className="mc-lab">{t}</text></g>)}
      <polyline points={pts.map((p, i) => `${X(xs[i])},${Y(p.y)}`).join(' ')} className="mc-line" />
      {pts.map((p, i) => (
        <g key={p.iso}>
          <circle cx={X(xs[i])} cy={Y(p.y)} r={p.y === maxY ? 6 : 4} className={p.y === maxY ? 'mc-dot pr' : 'mc-dot'}><title>{fmtDate(fromISO(p.iso))}: {kgS(p.y)} {unit}</title></circle>
        </g>
      ))}
      <text x={P.l} y={H - 8} className="mc-lab">{fmtDate(fromISO(pts[0].iso))}</text>
      <text x={W - P.r} y={H - 8} textAnchor="end" className="mc-lab">{fmtDate(fromISO(pts[pts.length - 1].iso))}</text>
    </svg>
  );
}

export function Strength({ days }) {
  const hist = useMemo(() => liftHistory(days), [days]);
  const ids = Object.keys(hist).sort((a, b) => hist[b].length - hist[a].length);
  const [sel, setSel] = useState('');
  const [mode, setMode] = useState('top');
  const id = ids.includes(sel) ? sel : ids[0];
  if (!ids.length) {
    return (
      <Card>
        <H2 sub="«Bu gün» səhifəsində hər hərəkətin altında «Dəftər» var — çəkini və təkrarı yaz, ✓ bas.">Güc artımı və rekordlar</H2>
        <div className="empty"><p className="text-sm text-ink2">Hələ məşq qeydi yoxdur. İlk məşqdən sonra burada qrafik və şəxsi rekordların görünəcək 🏆</p></div>
      </Card>
    );
  }
  const h = hist[id];
  const pts = h.map((x) => ({ iso: x.iso, y: mode === 'top' ? x.top : Math.round(x.best * 10) / 10 }));
  const first = h[0]; const lastH = h[h.length - 1];
  const gain = first.top ? ((lastH.top - first.top) / first.top) * 100 : 0;
  const prs = ids.map((eid) => {
    const arr = hist[eid];
    const best = arr.reduce((a, x) => (x.best > a.best ? x : a), arr[0]);
    return { eid, best, n: arr.length, up: arr[0].best ? ((best.best - arr[0].best) / arr[0].best) * 100 : 0 };
  });
  return (
    <Card>
      <H2 sub="Hər məşqdən sonra avtomatik yenilənir. Qırmızı nöqtə — şəxsi rekord." right={<Pill tone={gain > 0 ? 'good' : 'neutral'}>{gain > 0 ? '+' : ''}{Math.round(gain)}% ilk məşqdən bəri</Pill>}>Güc artımı və rekordlar</H2>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="field min-w-0 flex-1"><span>Hərəkət</span>
          <select value={id} onChange={(e) => setSel(e.target.value)}>{ids.map((eid) => <option key={eid} value={eid}>{EX[eid] ? EX[eid].az : eid} ({hist[eid].length} məşq)</option>)}</select>
        </label>
        <div className="seg seg-sm" role="radiogroup" aria-label="Göstərici">
          <button type="button" role="radio" aria-checked={mode === 'top'} className={mode === 'top' ? 'on' : ''} onClick={() => setMode('top')}>Ən ağır çəki</button>
          <button type="button" role="radio" aria-checked={mode === 'e1'} className={mode === 'e1' ? 'on' : ''} onClick={() => setMode('e1')}>Təxmini 1 təkrar max</button>
        </div>
      </div>
      <MiniChart pts={pts} unit="kq" />
      <h3 className="h4 mt-4">Şəxsi rekordlar</h3>
      <div className="tbl-wrap mt-2">
        <table className="tbl">
          <thead><tr><th>Hərəkət</th><th className="r">Ən yaxşı set</th><th className="r">1 təkrar max (təxmini)</th><th className="r">Artım</th></tr></thead>
          <tbody>
            {prs.map((p) => (
              <tr key={p.eid}>
                <td><b className="text-ink">{EX[p.eid] ? EX[p.eid].az : p.eid}</b><span className="block text-xs text-ink3">{fmtDate(fromISO(p.best.iso))} · {p.n} məşq</span></td>
                <td className="r num">{kgS(Number(p.best.bestSet.kg))} kq × {p.best.bestSet.r}</td>
                <td className="r num">{kgS(Math.round(p.best.best * 2) / 2)} kq</td>
                <td className={`r num ${p.up > 0 ? 'text-good' : 'text-ink3'}`}>{p.up > 0 ? `+${Math.round(p.up)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink3 mt-2">«1 təkrar max» Epley düsturu ilə hesablanır: çəki × (1 + təkrar/30). Onu yoxlamaq üçün maksimum qaldırmağa ehtiyac yoxdur.</p>
    </Card>
  );
}

// ---------- 10. Ağıllı kalori düzəlişi ----------
export function SmartKcal({ checkins, ctx, targets, kcalAdj = 0, kcalAdjAt, saveSettings, canWrite }) {
  const sorted = [...checkins].filter((c) => c.date && c.weight).sort((a, b) => (a.date < b.date ? -1 : 1));
  const last = sorted[sorted.length - 1];
  let rate = null; let span = 0; let pts = [];
  if (last) {
    const lastD = fromISO(last.date);
    pts = sorted.filter((c) => daysBetween(fromISO(c.date), lastD) <= 21);
    span = pts.length ? daysBetween(fromISO(pts[0].date), lastD) : 0;
    if (pts.length >= 3 && span >= 13) {
      const xs = pts.map((c) => daysBetween(fromISO(pts[0].date), fromISO(c.date))); const ys = pts.map((c) => c.weight);
      const mx = xs.reduce((a, b) => a + b, 0) / xs.length; const my = ys.reduce((a, b) => a + b, 0) / ys.length;
      const num = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0); const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
      rate = den ? (num / den) * 7 : null;
    }
  }
  const bw = last ? last.weight : 95;
  const pct = rate != null ? (rate / bw) * 100 : null;
  const sinceAdj = kcalAdjAt ? daysBetween(fromISO(kcalAdjAt), ctx.today) : 99;
  let verdict; let next = null; let tone = 'neutral';
  if (ctx.phase.n === 5) verdict = { h: 'Təmiz kütlə fazası', t: 'Bu fazada məqsəd həftədə +0,1–0,25 kq-dır. Çəki düşürsə, gündə +100 kcal əlavə et.' };
  else if (ctx.dietBreak) verdict = { h: 'Kalori fasiləsi həftəsi', t: 'Bu həftə kalori saxlanma səviyyəsindədir — heç nə dəyişmə.' };
  else if (rate == null) verdict = { h: 'Məlumat yığılır', t: `Qərar üçün son 3 həftədə ən azı 3 ölçmə lazımdır (indi: ${pts.length} ölçmə, ${span} gün). Hər bazar səhər çəkini yaz.` };
  else if (sinceAdj < 14) verdict = { h: 'Son düzəlişin nəticəsini gözlə', t: `Kalori ${fmtDate(fromISO(kcalAdjAt))} tarixində dəyişdirilib. Bədənin uyğunlaşması üçün 2 həftə gözlə (${14 - sinceAdj} gün qalıb).` };
  else if (rate > -0.2) { tone = 'warn'; next = Math.max(-400, kcalAdj - 150); verdict = { h: 'Çəki yerində sayır', t: `Son ${span} gündə tempin ${rate > 0 ? '+' : ''}${fmtNum(rate, 2)} kq/həftədir (hədəf −0,5…−0,9). Təklif: gündəlik kalorini 150 azalt — sistem karbohidrat porsiyalarını (düyü, kartof, çörək, yulaf) avtomatik kiçildəcək. Alternativ: hər gün +1500 addım.` }; }
  else if (pct < -1.1) { tone = 'warn'; next = Math.min(300, kcalAdj + 150); verdict = { h: 'Çəki çox sürətlə düşür', t: `Tempin ${fmtNum(rate, 2)} kq/həftədir (bədən çəkisinin ${fmtNum(-pct, 1)}%-i). Bu sürətdə əzələ də itir. Təklif: gündəlik +150 kcal.` }; }
  else { tone = 'good'; verdict = { h: 'Plan üzrəsən ✓', t: `Tempin ${fmtNum(rate, 2)} kq/həftədir — ideal aralıqdadır. Heç nəyi dəyişmə.` }; }
  return (
    <Card className={`smart smart-${tone}`}>
      <H2 sub="Hər bazar ölçməsindən sonra son 3 həftənin trendinə baxır və kalorini düzəltməyi təklif edir." right={kcalAdj ? <Pill tone="cobalt">Düzəliş: {kcalAdj > 0 ? '+' : ''}{kcalAdj} kcal</Pill> : null}>Ağıllı kalori</H2>
      <div className="smart-v"><b>{verdict.h}</b><p>{verdict.t}</p></div>
      <div className="flex flex-wrap gap-2 mt-3 items-center">
        <span className="text-sm text-ink2 num">İndiki hədəf: <b className="text-ink">{fmtInt(targets.train)}</b> məşq / <b className="text-ink">{fmtInt(targets.rest)}</b> istirahət günü</span>
        <span className="flex-1" />
        {next != null && canWrite ? <button type="button" className="btn btn-primary" onClick={() => saveSettings({ kcalAdj: next, kcalAdjAt: toISO(ctx.today) })}>Tətbiq et ({next - kcalAdj > 0 ? '+' : ''}{next - kcalAdj} kcal)</button> : null}
        {kcalAdj && canWrite ? <button type="button" className="btn btn-ghost" onClick={() => saveSettings({ kcalAdj: 0, kcalAdjAt: toISO(ctx.today) })}>Sıfırla</button> : null}
      </div>
    </Card>
  );
}

// ---------- 12. Nailiyyətlər ----------
function longestStreak(days, start, targets, today) {
  let best = 0; let cur = 0;
  for (let d = fromISO(start); d <= today; d = addDays(d, 1)) {
    const iso = toISO(d); const sc = dayScore(iso, days[iso], targets);
    if (sc && sc.pass) { cur++; best = Math.max(best, cur); } else cur = 0;
  }
  return best;
}

export function Badges({ days, checkins, ctx, targets }) {
  const data = useMemo(() => {
    const start = ctx.startISO;
    const valid = Object.keys(days).filter((iso) => iso >= start);
    const trains = valid.filter((iso) => days[iso].train === 'yes').length;
    const logged = valid.filter((iso) => dayScore(iso, days[iso], targets)).length;
    const water = valid.filter((iso) => Number(days[iso].water) >= (TRAIN_DOW.includes(fromISO(iso).getDay()) ? targets.glassesTrain : targets.glassesRest)).length;
    const swims = valid.filter((iso) => days[iso].swim === 'yes').length;
    const sets = valid.reduce((a, iso) => a + Object.values(days[iso].lifts || {}).reduce((b, arr) => b + doneSets(arr).length, 0), 0);
    const hist = liftHistory(days);
    const prs = Object.values(hist).filter((arr) => arr.length > 1 && Math.max(...arr.slice(1).map((x) => x.best)) > arr[0].best).length;
    const ws = checkins.filter((c) => c.weight).map((c) => c.weight);
    const minW = ws.length ? Math.min(...ws) : 999;
    const wa = [...checkins].filter((c) => c.waist).sort((a, b) => (a.date < b.date ? -1 : 1));
    const waistDrop = wa.length > 1 ? wa[0].waist - Math.min(...wa.map((c) => c.waist)) : 0;
    const streak = longestStreak(days, start, targets, ctx.today);
    return { trains, logged, water, swims, sets, prs, minW, waistDrop, streak };
  }, [days, checkins, targets, ctx.startISO]);
  const B = [
    ['🔥', 'Başlanğıc', '3 gün ardıcıl ✓', data.streak, 3], ['🔥', 'Bir həftə', '7 gün ardıcıl ✓', data.streak, 7], ['🔥', 'İki həftə', '14 gün ardıcıl ✓', data.streak, 14], ['👑', 'Vərdiş', '30 gün ardıcıl ✓', data.streak, 30],
    ['🏋️', 'İlk məşq', '1 məşq', data.trains, 1], ['🏋️', 'Zal adamı', '10 məşq', data.trains, 10], ['💪', 'Dəmir iradə', '50 məşq', data.trains, 50], ['🦾', 'Prime', '150 məşq', data.trains, 150],
    ['🏆', 'İlk rekord', '1 hərəkətdə güc artımı', data.prs, 1], ['🏆', 'Rekordçu', '10 hərəkətdə artım', data.prs, 10], ['📒', '100 set', 'dəftərdə 100 set', data.sets, 100], ['📒', '1000 set', 'dəftərdə 1000 set', data.sets, 1000],
    ['⚖️', '92,5 kq', 'ilk mərhələ', data.minW <= 92.5 ? 1 : 0, 1], ['⚖️', '90 kq', '«8» ilə başlayan rəqəmə az qaldı', data.minW <= 90 ? 1 : 0, 1], ['⚖️', '88 kq', '6-cı ay hədəfi', data.minW <= 88 ? 1 : 0, 1], ['🎯', '85 kq', 'BÖYÜK HƏDƏF', data.minW <= 85 ? 1 : 0, 1],
    ['📏', 'Bel −5 sm', 'beldən 5 sm getdi', Math.floor(data.waistDrop), 5], ['📏', 'Bel −10 sm', 'beldən 10 sm getdi', Math.floor(data.waistDrop), 10], ['💧', 'Su ustası', '7 gün su hədəfi', data.water, 7], ['🏊', 'Üzgüçü', '10 dəfə hovuz', data.swims, 10],
    ['📅', 'Qeydçi', '30 gün gündəlik', data.logged, 30], ['📅', 'Sistemli', '100 gün gündəlik', data.logged, 100],
  ];
  const got = B.filter((b) => b[3] >= b[4]).length;
  return (
    <Card>
      <H2 sub="Gündəlik, məşq dəftəri və ölçmələrdən avtomatik açılır." right={<Pill tone="good">{got} / {B.length}</Pill>}>Nailiyyətlər</H2>
      <ul className="badges">
        {B.map(([ic, t, d, v, goal]) => {
          const on = v >= goal;
          return (
            <li key={t} className={on ? 'on' : ''}>
              <span className="bd-ic" aria-hidden="true">{ic}</span>
              <span className="min-w-0"><b>{t}</b><span className="bd-d">{d}</span>{!on && goal > 1 ? <span className="bd-p"><i style={{ width: `${Math.min(100, (v / goal) * 100)}%` }} /></span> : null}</span>
              <span className="sr-only">{on ? 'açılıb' : 'bağlıdır'}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// ---------- 13. Aylıq hesabat ----------
export function MonthReport({ days, checkins, ctx, targets }) {
  const start = fromISO(ctx.startISO);
  const months = [];
  for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= ctx.today; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push({ y: d.getFullYear(), m: d.getMonth() });
  if (!months.length) months.push({ y: ctx.today.getFullYear(), m: ctx.today.getMonth() });
  const [k, setK] = useState(months.length - 1);
  const mo = months[Math.min(k, months.length - 1)];
  const r = useMemo(() => {
    const a = new Date(mo.y, mo.m, 1); const b = new Date(mo.y, mo.m + 1, 0);
    const from = a < start ? start : a; const to = b > ctx.today ? ctx.today : b;
    const inM = (iso) => iso >= toISO(from) && iso <= toISO(to);
    const ck = [...checkins].filter((c) => c.date && inM(c.date)).sort((x, y) => (x.date < y.date ? -1 : 1));
    const prevW = [...checkins].filter((c) => c.date && c.date < toISO(from) && c.weight).sort((x, y) => (x.date < y.date ? 1 : -1))[0];
    const wFirst = prevW || ck.find((c) => c.weight); const wLast = [...ck].reverse().find((c) => c.weight);
    const wa = ck.filter((c) => c.waist);
    let planned = 0; let trained = 0; let logged = 0; let passed = 0; let sets = 0; let waterSum = 0; let waterN = 0;
    for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
      const iso = toISO(d); const x = days[iso] || {};
      if (TRAIN_DOW.includes(d.getDay())) planned++;
      if (x.train === 'yes') trained++;
      const sc = dayScore(iso, days[iso], targets); if (sc) { logged++; if (sc.pass) passed++; }
      sets += Object.values(x.lifts || {}).reduce((s, arr) => s + doneSets(arr).length, 0);
      if (x.water != null) { waterSum += Number(x.water); waterN++; }
    }
    const weeks = [];
    for (let w = mondayOf(from); w <= to; w = addDays(w, 7)) {
      let p = 0; let l = 0;
      for (let i = 0; i < 7; i++) { const d = addDays(w, i); if (d < from || d > to) continue; const sc = dayScore(toISO(d), days[toISO(d)], targets); if (sc) { l++; if (sc.pass) p++; } }
      if (l) weeks.push({ w, p, l, rate: p / l });
    }
    const best = weeks.length ? weeks.reduce((x, y) => (y.rate > x.rate ? y : x)) : null;
    const worst = weeks.length > 1 ? weeks.reduce((x, y) => (y.rate < x.rate ? y : x)) : null;
    const hist = liftHistory(days);
    const prs = Object.entries(hist).filter(([, arr]) => {
      const before = arr.filter((x) => !inM(x.iso) && x.iso < toISO(from)); const during = arr.filter((x) => inM(x.iso));
      return before.length && during.length && Math.max(...during.map((x) => x.best)) > Math.max(...before.map((x) => x.best));
    }).map(([id]) => id);
    return { from, to, wFirst, wLast, wa, planned, trained, logged, passed, sets, water: waterN ? waterSum / waterN : null, best, worst, prs };
  }, [mo.y, mo.m, days, checkins, targets]);
  const dW = r.wFirst && r.wLast ? r.wLast.weight - r.wFirst.weight : null;
  const dWa = r.wa.length > 1 ? r.wa[r.wa.length - 1].waist - r.wa[0].waist : null;
  const wk = (x) => `${fmtDate(x.w)} həftəsi — ${x.p}/${x.l} gün ✓`;
  return (
    <Card>
      <H2 sub="Ayın sonunda bura bax: nə yaxşı getdi, nəyi düzəltmək lazımdır." right={
        <select className="select select-sm" value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="Ay">{months.map((x, i) => <option key={i} value={i}>{MONTHS[x.m]} {x.y}</option>)}</select>
      }>Aylıq hesabat</H2>
      <div className="mrep">
        <div><span className="mr-k">Çəki</span><span className={`mr-v num ${dW != null && dW < 0 ? 'text-good' : ''}`}>{dW != null ? `${dW > 0 ? '+' : ''}${fmtNum(dW)} kq` : '—'}</span><span className="mr-s">{r.wLast ? `${fmtNum(r.wLast.weight)} kq-a` : 'ölçmə yoxdur'}</span></div>
        <div><span className="mr-k">Bel</span><span className={`mr-v num ${dWa != null && dWa < 0 ? 'text-good' : ''}`}>{dWa != null ? `${dWa > 0 ? '+' : ''}${fmtNum(dWa)} sm` : '—'}</span><span className="mr-s">ay ərzində</span></div>
        <div><span className="mr-k">Məşq</span><span className="mr-v num">{r.trained}/{r.planned}</span><span className="mr-s">{r.planned ? `${Math.round((r.trained / r.planned) * 100)}% icra` : ''}</span></div>
        <div><span className="mr-k">Uğurlu gün</span><span className="mr-v num">{r.passed}/{r.logged}</span><span className="mr-s">qeyd olunan günlərdən</span></div>
        <div><span className="mr-k">Set</span><span className="mr-v num">{r.sets}</span><span className="mr-s">dəftərdə</span></div>
        <div><span className="mr-k">Su</span><span className="mr-v num">{r.water != null ? fmtNum(r.water) : '—'}</span><span className="mr-s">orta stəkan/gün</span></div>
      </div>
      <ul className="grid gap-1.5 mt-4 text-sm text-ink2">
        {r.best ? <li>🟢 Ən yaxşı: <b className="text-ink">{wk(r.best)}</b></li> : null}
        {r.worst && r.worst !== r.best ? <li>🔴 Ən zəif: <b className="text-ink">{wk(r.worst)}</b> — o həftə nə mane oldu? Gündəlikdəki qeydlərinə bax.</li> : null}
        {r.prs.length ? <li>🏆 Bu ay rekord: <b className="text-ink">{r.prs.map((id) => (EX[id] ? EX[id].az : id)).join(', ')}</b></li> : null}
        {!r.logged ? <li>Bu ay üçün hələ gündəlik qeydi yoxdur.</li> : null}
      </ul>
    </Card>
  );
}

// ---------- 11. Şəkil çəkmə qaydası ----------
export function PhotoGuide() {
  return (
    <Card>
      <H2 sub="Müqayisə yalnız eyni şəraitdə çəkiləndə düzgün göstərir.">Əvvəl/sonra şəkli necə çəkilir</H2>
      <ol className="steps">
        <li>Ayın ilk bazarı, səhər, tualetdən sonra, ac qarına.</li>
        <li>Həmişə eyni yer və eyni işıq: pəncərəyə üzü dur, tavan işığını söndür.</li>
        <li>Telefonu bel hündürlüyündə, 2 metr məsafədə qoy (rəf və ya tripod), taymer 10 san.</li>
        <li>4 poza: öndən rahat, öndən gərgin (qolları bük), yandan, arxadan. Hər dəfə eyni ardıcıllıq.</li>
        <li>Şort, eyni geyim. Filtr və «gözəlləşdirmə» yox. S25 Ultra-da 1× obyektiv (geniş bucaq yox).</li>
        <li>Yükləyəndə eyni «Poza»nı seç — sürgü ilə müqayisədə eyni pozanı yan-yana qoy.</li>
      </ol>
    </Card>
  );
}
