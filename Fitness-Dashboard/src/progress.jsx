import { Strength, SmartKcal, Badges, MonthReport, PhotoGuide } from './insights.jsx';
import { WeeklyCoach } from './coach.jsx';
import { GhostCam } from './ghostcam.jsx';
import { Rewards, RewardBanner, ShareCard, useStats } from './extras.jsx';
import { Health } from './health.jsx';
import { Card, H2, Eyebrow, Pill, Icon, useMeasure, HowTo } from './ui.jsx';
import { targetWeightAt } from './data/exercises.js';
import { PROFILE, toISO, fromISO, addDays, daysBetween, mondayOf, fmtDate, fmtDateY, fmtNum, MON_SHORT } from './util.js';

const { useState, useMemo, useEffect, useRef } = React;

const MILESTONE_OPTS = ['Başlanğıc', '1-ci ay', '3-cü ay', '6-cı ay', '9-cu ay', '12-ci ay'];
const POSE_OPTS = ['Öndən', 'Yandan', 'Arxadan', 'Sərbəst'];
const WEEK_ITEMS = [['a', 'Məşq A'], ['b', 'Məşq B'], ['c', 'Məşq C'], ['swim', 'Üzgüçülük'], ['steps', 'Addım hədəfi (5+ gün)'], ['sleep', 'Yuxu 7+ saat (5+ gecə)']];
const SUBS = [['olcme', 'Ölçmələr'], ['mesq', 'Məşq və nailiyyətlər'], ['saglamliq', 'Sağlamlıq və şəkillər']];
const SUB_KEY = 'prime-ili:inkisaf-sub';
// Həftənin icrası Gündəlikdən hesablanır: ayrıca işarələməyə ehtiyac yoxdur
function weekFromDays(days, monday) {
  const d = (i) => days[toISO(addDays(monday, i))] || {};
  const all = [0, 1, 2, 3, 4, 5, 6].map(d);
  const stepsN = all.filter((x) => x.steps === 'yes').length;
  const sleepN = all.filter((x) => x.sleep != null && x.sleep !== '' && Number(x.sleep) >= 7).length;
  return {
    a: d(1).train === 'yes', b: d(3).train === 'yes', c: d(5).train === 'yes', swim: all.some((x) => x.swim === 'yes'),
    steps: stepsN >= 5, sleep: sleepN >= 5, stepsN, sleepN, any: all.some((x) => Object.keys(x).length > 0),
  };
}

// ---------- Qrafik ----------
function LineChart({ ariaLabel, height = 250, xMin, xMax, yMin, yMax, yStep, series, refs = [], xTicks, unit, hoverXs, tip }) {
  const [wrapRef, w] = useMeasure();
  const [hx, setHx] = useState(null);
  const W = Math.max(300, w || 640);
  const H = height;
  const m = { l: 38, r: 66, t: 14, b: 28 };
  const sx = (d) => m.l + ((d - xMin) / (xMax - xMin)) * (W - m.l - m.r);
  const sy = (v) => m.t + (1 - (v - yMin) / (yMax - yMin)) * (H - m.t - m.b);
  const yTicks = [];
  for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax + 1e-9; v += yStep) yTicks.push(v);

  const onMove = (e) => {
    if (!hoverXs.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = hoverXs[0]; let bd = Infinity;
    hoverXs.forEach((x) => { const d = Math.abs(sx(x) - px); if (d < bd) { bd = d; best = x; } });
    setHx(best);
  };

  // Son nöqtə etiketləri (toqquşmanın qarşısını al)
  const ends = series.filter((s) => !s.noEnd).map((s) => {
    const pts = s.points;
    const last = pts[pts.length - 1];
    return last ? { s, x: sx(last.x), y: sy(last.v), v: last.v } : null;
  }).filter(Boolean);
  if (ends.length === 2 && Math.abs(ends[0].y - ends[1].y) < 16) {
    const [a, b] = ends[0].y < ends[1].y ? [ends[0], ends[1]] : [ends[1], ends[0]];
    const mid = (a.y + b.y) / 2; a.ly = mid - 9; b.ly = mid + 9;
  }

  const tipData = hx != null ? tip(hx) : null;
  const tipLeft = hx != null ? sx(hx) : 0;

  return (
    <div ref={wrapRef} className="chart" onPointerLeave={() => setHx(null)}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} onPointerMove={onMove} onPointerDown={onMove}>
        <rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} className="ch-plot" />
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={m.l} x2={W - m.r} y1={sy(v)} y2={sy(v)} className="ch-grid" />
            <text x={m.l - 8} y={sy(v) + 4} textAnchor="end" className="ch-tick">{v}</text>
          </g>
        ))}
        {xTicks.map((t) => (
          <g key={t.x}>
            <line x1={sx(t.x)} x2={sx(t.x)} y1={H - m.b} y2={H - m.b + 4} className="ch-axis" />
            <text x={sx(t.x)} y={H - 8} textAnchor="middle" className="ch-tick">{t.label}</text>
          </g>
        ))}
        <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} className="ch-axis" />
        {refs.map((r) => (
          <g key={r.label}>
            <line x1={m.l} x2={W - m.r} y1={sy(r.v)} y2={sy(r.v)} className={`ch-ref ${r.cls || ''}`} />
            <text x={W - m.r + 6} y={sy(r.v) + 4} className="ch-ref-label">{r.label}</text>
          </g>
        ))}
        {series.map((s) => {
          if (!s.points.length) return null;
          const d = s.points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.v).toFixed(1)}`).join(' ');
          return (
            <g key={s.key}>
              {s.area && s.points.length > 1 ? (
                <path d={`${d} L${sx(s.points[s.points.length - 1].x).toFixed(1)},${H - m.b} L${sx(s.points[0].x).toFixed(1)},${H - m.b} Z`} className="ch-area" />
              ) : null}
              <path d={d} className={`ch-line ${s.cls}`} />
              {s.dots ? s.points.map((p, i) => (
                <circle key={p.x} cx={sx(p.x)} cy={sy(p.v)} r={i === s.points.length - 1 ? 5 : 3.5} className={`ch-dot ${s.cls}`} />
              )) : null}
            </g>
          );
        })}
        {ends.map((e) => (
          <text key={e.s.key} x={e.x + 8} y={(e.ly != null ? e.ly : e.y) + 4} className={`ch-end ${e.s.cls}`}>{e.s.endLabel ? e.s.endLabel(e.v) : fmtNum(e.v)}</text>
        ))}
        {hx != null ? <line x1={sx(hx)} x2={sx(hx)} y1={m.t} y2={H - m.b} className="ch-cross" /> : null}
        {hx != null ? series.map((s) => {
          const v = s.at(hx);
          return v == null ? null : <circle key={s.key} cx={sx(hx)} cy={sy(v)} r="5" className={`ch-hdot ${s.cls}`} />;
        }) : null}
      </svg>
      {tipData ? (
        <div className="ch-tip" style={{ left: Math.min(Math.max(tipLeft, 90), W - 90) }}>
          <div className="ch-tip-h">{tipData.title}</div>
          {tipData.rows.map(([k, v, cls]) => (
            <div key={k} className="ch-tip-r"><span className={`ch-key ${cls || ''}`} />{k}<b className="num">{v}</b></div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function monthTicks(start, xMin, xMax) {
  const ticks = [];
  let d = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  while (daysBetween(start, d) <= xMax) {
    const x = daysBetween(start, d);
    if (x >= xMin) ticks.push({ x, label: MON_SHORT[d.getMonth()] });
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  return ticks;
}

// ---------- Media ----------
function useMediaUrl(store, ref) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let live = true;
    if (!store || !ref) { setUrl(null); return undefined; }
    store.mediaUrl(ref).then((u) => live && setUrl(u)).catch(() => live && setUrl(null));
    return () => { live = false; };
  }, [store, ref]);
  return url;
}

function Media({ store, item, className = '' }) {
  const url = useMediaUrl(store, item && item.ref);
  const [broken, setBroken] = useState(false);
  if (!item) return null;
  if (!url || broken) return <div className={`media-ph ${className}`}><span>{broken ? 'Fayl açılmadı' : 'Yüklənir…'}</span></div>;
  if (item.kind === 'video') return <video className={className} src={url} controls playsInline preload="metadata" onError={() => setBroken(true)} />;
  return <img className={className} src={url} alt={`${item.milestone}, ${item.pose}, ${item.date}`} onError={() => setBroken(true)} />;
}

async function toJpeg(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const max = 1600;
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', 0.86));
  } finally { URL.revokeObjectURL(url); }
}

// ---------- Əsas bölmə ----------
export function Progress({ store, writable = true, ctx, checkins, photos, sync, days = {}, targets, sdata = {}, saveSettings, reports = [], health = [] }) {
  const stats = useStats({ checkins, days, ctx, targets });
  const canWrite = !!store && store.canWrite && writable;
  const [sub, setSubState] = useState(() => { try { const v = localStorage.getItem(SUB_KEY); return SUBS.some(([k]) => k === v) ? v : 'olcme'; } catch { return 'olcme'; } });
  const setSub = (v) => { setSubState(v); try { localStorage.setItem(SUB_KEY, v); } catch { /* yaddaş bağlıdır */ } };
  const start = fromISO(ctx.startISO);
  const sorted = useMemo(() => [...checkins].filter((c) => c.date && c.weight).sort((a, b) => (a.date < b.date ? -1 : 1)), [checkins]);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const startW = first ? first.weight : PROFILE.startWeight;
  const curW = last ? last.weight : PROFILE.startWeight;
  // 7 günlük orta: gündəlik oynamanı (su, duz, yemək) hamarlayır
  const wk7 = last ? sorted.filter((c) => daysBetween(fromISO(c.date), fromISO(last.date)) <= 6) : [];
  const avg7 = wk7.length > 1 ? wk7.reduce((a, c) => a + c.weight, 0) / wk7.length : null;
  const lastWaist = [...sorted].reverse().find((c) => c.waist) || { waist: PROFILE.startWaist, profile: true };

  const trend = useMemo(() => {
    if (sorted.length < 2) return null;
    const lastD = fromISO(last.date);
    const recent = sorted.filter((c) => daysBetween(fromISO(c.date), lastD) <= 28);
    const pts = recent.length >= 2 ? recent : sorted.slice(-2);
    const xs = pts.map((c) => daysBetween(start, fromISO(c.date))); const ys = pts.map((c) => c.weight);
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length; const my = ys.reduce((a, b) => a + b, 0) / ys.length;
    const num = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0); const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    return den ? (num / den) * 7 : null;
  }, [sorted]);

  const lastX = last ? daysBetween(start, fromISO(last.date)) : 0;
  const tgtNow = targetWeightAt(Math.max(0, lastX / 7));
  const goalPct = Math.max(0, Math.min(100, ((startW - curW) / (startW - PROFILE.goalWeight)) * 100));

  return (
    <div className="grid gap-5">
      <HowTo>Çəkini <b>hər səhər</b> (ən azı bazar günü) «Ölçmə» formasına yaz, bel ölçüsünü bazar günləri əlavə et → <b>«Yadda saxla»</b>. Tək ölçmə ±1 kq oynayır, ona görə panel <b>7 günlük ortaya</b> baxır. Üç bölmə var: ölçmələr, məşq və nailiyyətlər, sağlamlıq və şəkillər.</HowTo>
      <SyncNote sync={sync} store={store} />
      <div className="kpis">
        <Kpi k="Başlanğıc" v={`${fmtNum(startW)} kq`} sub={first ? fmtDate(fromISO(first.date)) : 'profil məlumatı'} />
        <Kpi k="Son çəki" v={`${fmtNum(curW)} kq`} sub={last ? `${fmtDate(fromISO(last.date))}${avg7 != null ? ` · 7 gün ortası ${fmtNum(avg7)}` : ''}` : '—'} />
        <Kpi k="Dəyişiklik" v={`${curW - startW > 0 ? '+' : ''}${fmtNum(curW - startW)} kq`} sub={trend != null ? `${trend > 0 ? '+' : ''}${fmtNum(trend, 2)} kq/həftə` : '2+ ölçmə lazımdır'} tone={curW < startW ? 'good' : 'neutral'} />
        <Kpi k="Hədəf xəttinə görə" v={last ? `${curW - tgtNow > 0 ? '+' : ''}${fmtNum(curW - tgtNow)} kq` : '—'} sub={last ? (curW - tgtNow <= 0.5 ? 'plan üzrə' : 'hədəfdən yuxarı') : 'ölçmə yoxdur'} tone={last && curW - tgtNow > 1 ? 'warn' : 'good'} />
        <Kpi k="Bel / boy" v={lastWaist ? fmtNum(lastWaist.waist / PROFILE.height, 2) : '—'} sub={`${fmtNum(lastWaist.waist)} sm${lastWaist.profile ? ' (başlanğıc)' : ''} · hədəf < 0,50`} tone={lastWaist ? (lastWaist.waist / PROFILE.height < 0.5 ? 'good' : 'warn') : 'neutral'} />
        <Kpi k={`${PROFILE.goalWeight} kq hədəfinə`} v={`${Math.round(goalPct)}%`} sub={`${fmtNum(Math.max(0, curW - PROFILE.goalWeight))} kq qalıb`} bar={goalPct} />
      </div>

      <RewardBanner rewards={sdata.rewards} stats={stats} saveSettings={saveSettings} canWrite={canWrite} />
      <div className="seg subtabs" role="tablist" aria-label="İnkişaf bölmələri">
        {SUBS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={sub === k} className={sub === k ? 'on' : ''} onClick={() => setSub(k)}>{l}</button>)}
      </div>

      {sub === 'olcme' ? <>
      <div className="grid gap-5 lg:grid-cols-[340px_1fr] items-start">
        <EntryForm store={store} sync={sync} />
        <Card className="min-w-0">
          <H2 sub="Mavi nöqtələr: ölçmələr. Qalın xətt: 7 günlük orta. Yaşıl qırıq xətt: 12 aylıq hədəf trayektoriyası. Nöqtəyə toxun — dəqiq rəqəm çıxır.">Çəki</H2>
          <WeightChart start={start} sorted={sorted} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr] items-start">
        <Card className="min-w-0">
          <H2 sub="Göbək səviyyəsində, səhər, rahat nəfəs verərkən. Başlanğıc 109 sm (boy 183 sm → bel/boy 0,60). Yaşıl xətt: 1 il hədəfi ≈ 96 sm; narıncı: 91,5 sm = bel/boy 0,50 sağlamlıq həddi (uzunmüddətli).">Bel ölçüsü</H2>
          <WaistChart start={start} sorted={sorted} />
        </Card>
        <Card className="min-w-0">
          <H2>Ölçmə tarixçəsi</H2>
          <EntryTable store={store} sorted={sorted} sync={sync} />
        </Card>
      </div>

      <SmartKcal checkins={checkins} ctx={ctx} targets={targets} kcalAdj={sdata.kcalAdj || 0} kcalAdjAt={sdata.kcalAdjAt} saveSettings={saveSettings} canWrite={canWrite} />
      </> : null}

      {sub === 'mesq' ? <>
      <WeekChecklist days={days} ctx={ctx} />
      <WeeklyCoach store={store} days={days} checkins={checkins} targets={targets} ctx={ctx} reports={reports} canWrite={canWrite} />
      <Strength days={days} />
      <MonthReport days={days} checkins={checkins} ctx={ctx} targets={targets} />
      <Badges days={days} checkins={checkins} ctx={ctx} targets={targets} />
      <Rewards rewards={sdata.rewards || []} stats={stats} saveSettings={saveSettings} canWrite={canWrite} />
      <ShareCard stats={stats} ctx={ctx} />
      </> : null}

      {sub === 'saglamliq' ? <>
      <Health store={store} records={health} />
      <PhotoGuide />
      <Photos store={store} photos={photos} sync={sync} />
      </> : null}
    </div>
  );
}

function SyncNote({ sync, store }) {
  if (!store) return <p className="sync">Yaddaş qoşulur…</p>;
  if (store.mode === 'cloud') {
    return (
      <p className="sync">
        <span className="sync-dot ok" />Məlumatlar artifaktın şəxsi bazasında saxlanır — istənilən cihazdan görünür, yalnız sən (və redaktə icazəsi verdiyin şəxs) görür.
        {sync.stale ? <span className="text-warn"> Baza hələ cavab vermir — göstərilənlər köhnə ola bilər.</span> : null}
      </p>
    );
  }
  const why = store.reason === 'viewer' ? 'Bu panel başqasına məxsusdur; sənin qeydlərin yalnız bu brauzerdə qalacaq.' : 'Məlumatlar bu brauzerdə saxlanır (localStorage və IndexedDB).';
  return <p className="sync"><span className="sync-dot" />{why}</p>;
}

function Kpi({ k, v, sub, tone = 'neutral', bar }) {
  return (
    <div className={`kpi kpi-${tone}`}>
      <div className="kpi-k">{k}</div>
      <div className="kpi-v num">{v}</div>
      {bar != null ? <div className="bar mt-1.5"><div className="bar-fill bar-cobalt" style={{ width: `${bar}%` }} /></div> : null}
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

function EntryForm({ store, sync }) {
  const [date, setDate] = useState(toISO(new Date()));
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const w = parseFloat(String(weight).replace(',', '.'));
    const wa = waist === '' ? null : parseFloat(String(waist).replace(',', '.'));
    if (!(w >= 40 && w <= 200)) { setMsg({ t: 'err', x: 'Çəkini 40–200 kq aralığında yaz (məs. 94,6).' }); return; }
    if (wa != null && !(wa >= 50 && wa <= 170)) { setMsg({ t: 'err', x: 'Bel ölçüsünü 50–170 sm aralığında yaz və ya boş burax.' }); return; }
    if (!store) return;
    setBusy(true);
    try {
      await store.put('checkins', date, { date, weight: Math.round(w * 10) / 10, waist: wa == null ? null : Math.round(wa * 10) / 10, note: note.trim().slice(0, 200), updatedAt: new Date().toISOString() });
      setMsg({ t: 'ok', x: `${fmtDate(fromISO(date))} üçün ölçmə yadda saxlanıldı.` });
      setWeight(''); setWaist(''); setNote('');
    } catch (err) {
      setMsg({ t: 'err', x: err && err.code === 'quota_exceeded' ? 'Baza dolub. Köhnə qeydlərdən bəzilərini sil.' : 'Yadda saxlamaq alınmadı. Bir az sonra yenidən cəhd et.' });
    } finally { setBusy(false); }
  };

  return (
    <Card>
      <H2 sub="Səhər: tualetdən sonra, yeməkdən əvvəl, eyni tərəzidə. Çəki — hər gün (ən azı bazar), bel — bazar günləri.">Ölçmə</H2>
      <form className="grid gap-3" onSubmit={submit} noValidate>
        <label className="field"><span>Tarix</span><input id="ci-date" type="date" value={date} max={toISO(addDays(new Date(), 1))} onChange={(e) => setDate(e.target.value)} required /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="field"><span>Çəki, kq</span><input id="ci-weight" type="number" inputMode="decimal" step="0.1" min="40" max="200" placeholder="94,6" value={weight} onChange={(e) => setWeight(e.target.value)} required /></label>
          <label className="field"><span>Bel, sm</span><input id="ci-waist" type="number" inputMode="decimal" step="0.5" min="50" max="170" placeholder="109" value={waist} onChange={(e) => setWaist(e.target.value)} /></label>
        </div>
        <label className="field"><span>Qeyd (istəyə görə)</span><input id="ci-note" type="text" maxLength={200} placeholder="məs. bayram həftəsi, az yatmışam" value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <button type="submit" className="btn btn-primary justify-center" disabled={busy || !store}>{busy ? 'Saxlanılır…' : 'Yadda saxla'}</button>
        {msg ? <p className={`form-msg ${msg.t}`} role="status">{msg.x}</p> : null}
        <p className="text-xs text-ink3">Eyni tarixə yenidən yazsan, köhnə qeyd yenilənir. Kreatinə başlayanda ilk 2 həftə +1–2 kq su normaldır.</p>
      </form>
    </Card>
  );
}

function WeightChart({ start, sorted }) {
  const pts = sorted.map((c) => ({ x: daysBetween(start, fromISO(c.date)), v: c.weight, date: c.date }));
  const xMin = Math.min(0, ...pts.map((p) => p.x));
  const xMax = 364;
  const target = [];
  for (let wk = 0; wk <= 52; wk++) target.push({ x: wk * 7, v: targetWeightAt(wk) });
  const vals = [...pts.map((p) => p.v), ...target.map((p) => p.v)];
  const yMin = Math.floor((Math.min(...vals) - 1) / 2) * 2;
  const yMax = Math.ceil((Math.max(...vals) + 1) / 2) * 2;
  const hoverXs = pts.length ? pts.map((p) => p.x) : target.map((p) => p.x);
  const actualAt = (x) => { const p = pts.find((q) => q.x === x); return p ? p.v : null; };
  // 7 günlük sürüşən orta (həmin gün daxil, əvvəlki 6 gün)
  const avgPts = pts.map((p) => { const w = pts.filter((q) => q.x <= p.x && q.x >= p.x - 6); return { x: p.x, v: w.reduce((a, q) => a + q.v, 0) / w.length, n: w.length }; });
  const showAvg = avgPts.some((p) => p.n > 1);
  const avgAt = (x) => { const p = avgPts.find((q) => q.x === x); return p ? p.v : null; };
  const series = [
    { key: 'target', label: 'Hədəf', cls: 's-target', points: target, at: (x) => (x >= 0 ? targetWeightAt(x / 7) : null), endLabel: (v) => `Hədəf ${fmtNum(v, 0)}` },
    ...(showAvg ? [{ key: 'avg', label: '7 gün ortası', cls: 's-avg', points: avgPts, at: avgAt, noEnd: true }] : []),
    { key: 'actual', label: 'Faktiki', cls: showAvg ? 's-actual thin' : 's-actual', points: pts, dots: true, area: false, at: actualAt, endLabel: (v) => `${fmtNum(v)} kq` },
  ];
  const tip = (x) => {
    const a = actualAt(x); const t = x >= 0 ? targetWeightAt(x / 7) : null;
    const rows = [];
    if (a != null) rows.push(['Faktiki', `${fmtNum(a)} kq`, 's-actual']);
    if (showAvg && avgAt(x) != null) rows.push(['7 gün ortası', `${fmtNum(avgAt(x))} kq`, 's-avg']);
    if (t != null) rows.push(['Hədəf', `${fmtNum(t)} kq`, 's-target']);
    if (a != null && t != null) rows.push(['Fərq', `${a - t > 0 ? '+' : ''}${fmtNum(a - t)} kq`]);
    return { title: `${fmtDateY(addDays(start, x))} · həftə ${Math.max(0, Math.floor(x / 7) + (x >= 0 ? 1 : 0))}`, rows };
  };
  return (
    <>
      <Legend items={[['s-actual', 'Ölçmələr'], ...(showAvg ? [['s-avg', '7 günlük orta']] : []), ['s-target', 'Hədəf trayektoriyası', true]]} />
      <LineChart ariaLabel={`Çəki qrafiki: ${pts.length} ölçmə, son ${pts.length ? fmtNum(pts[pts.length - 1].v) : '—'} kq; hədəf 52-ci həftədə ${fmtNum(targetWeightAt(52))} kq.`}
        xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} yStep={2} series={series} xTicks={monthTicks(start, xMin, xMax)} hoverXs={hoverXs} tip={tip} />
      {pts.length < 2 ? <p className="empty-note">Ölçmə daxil etdikcə mavi xətt hədəf xəttinin yanında uzanacaq.</p> : null}
    </>
  );
}

function WaistChart({ start, sorted }) {
  const pts = sorted.filter((c) => c.waist).map((c) => ({ x: daysBetween(start, fromISO(c.date)), v: c.waist }));
  const xMin = Math.min(0, ...pts.map((p) => p.x));
  const xMax = 364;
  const vals = [...pts.map((p) => p.v), 88, PROFILE.goalWaist];
  const yMin = Math.floor((Math.min(...vals) - 2) / 4) * 4;
  const yMax = Math.ceil((Math.max(...vals, 110) + 2) / 4) * 4;
  const at = (x) => { const p = pts.find((q) => q.x === x); return p ? p.v : null; };
  const series = [{ key: 'waist', cls: 's-actual', points: pts, dots: true, at, endLabel: (v) => `${fmtNum(v)} sm` }];
  const tip = (x) => {
    const v = at(x);
    return { title: fmtDateY(addDays(start, x)), rows: v != null ? [['Bel', `${fmtNum(v)} sm`, 's-actual'], ['Bel / boy', fmtNum(v / PROFILE.height, 2)]] : [] };
  };
  return (
    <>
      <LineChart ariaLabel={`Bel ölçüsü qrafiki: ${pts.length} ölçmə.`} xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} yStep={4}
        series={series} refs={[{ v: PROFILE.height / 2, label: '0,50 həddi', cls: 'ref-warn' }, { v: PROFILE.goalWaist, label: `1 il hədəfi ≈ ${PROFILE.goalWaist}`, cls: 'ref-good' }]}
        xTicks={monthTicks(start, xMin, xMax)} hoverXs={pts.map((p) => p.x)} tip={tip} height={220} />
      {!pts.length ? <p className="empty-note">Bel ölçüsü hələ yoxdur. İlk ölçməni sol tərəfdəki formada "Bel, sm" xanasına yaz.</p> : null}
    </>
  );
}

function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-xs text-ink2">
      {items.map(([cls, label, dashed]) => (
        <span key={cls} className="inline-flex items-center gap-1.5"><svg width="22" height="8" aria-hidden="true"><line x1="1" x2="21" y1="4" y2="4" className={`ch-line ${cls}`} strokeDasharray={dashed ? '4 3' : undefined} /></svg>{label}</span>
      ))}
    </div>
  );
}

function EntryTable({ store, sorted, sync }) {
  const [confirm, setConfirm] = useState(null);
  const rows = [...sorted].reverse();
  if (!rows.length) {
    return <div className="empty"><p className="text-sm text-ink2">{sync.loading ? 'Ölçmələr yüklənir…' : 'Hələ ölçmə yoxdur.'}</p><p className="text-xs text-ink3 mt-1">İlk qeydi "Həftəlik ölçmə" formasından əlavə et.</p></div>;
  }
  return (
    <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
      <table className="tbl tbl-tight">
        <thead><tr><th>Tarix</th><th className="r">Çəki</th><th className="r">Δ</th><th className="r">Bel</th><th>Qeyd</th><th aria-label="Sil" /></tr></thead>
        <tbody>
          {rows.map((r, i) => {
            const prev = rows[i + 1];
            const d = prev ? r.weight - prev.weight : null;
            return (
              <tr key={r.id || r.date}>
                <td className="num whitespace-nowrap">{fmtDate(fromISO(r.date))}</td>
                <td className="r num">{fmtNum(r.weight)}</td>
                <td className={`r num ${d == null ? 'text-ink3' : d <= 0 ? 'text-good' : 'text-warn'}`}>{d == null ? '—' : `${d > 0 ? '+' : ''}${fmtNum(d)}`}</td>
                <td className="r num">{r.waist ? fmtNum(r.waist) : '—'}</td>
                <td className="text-ink3 text-xs">{r.note || ''}</td>
                <td className="r whitespace-nowrap">
                  {confirm === r.date ? (
                    <span className="inline-flex gap-1">
                      <button type="button" className="btn-xs btn-danger" onClick={async () => { setConfirm(null); try { await store.remove('checkins', r.id || r.date); } catch { /* göstərilən siyahı dəyişməz */ } }}>Sil</button>
                      <button type="button" className="btn-xs" onClick={() => setConfirm(null)}>Ləğv</button>
                    </span>
                  ) : (
                    <button type="button" className="icon-btn" aria-label={`${r.date} qeydini sil`} onClick={() => setConfirm(r.date)}><Icon name="trash" /></button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function WeekChecklist({ days, ctx }) {
  const mon = mondayOf(ctx.today);
  const doc = weekFromDays(days, mon);
  const score = (w) => WEEK_ITEMS.filter(([k]) => w[k]).length;
  const start = fromISO(ctx.startISO);
  const history = [];
  for (let i = 8; i >= 1; i--) { const m = addDays(mon, -7 * i); if (addDays(m, 6) < start) continue; const w = weekFromDays(days, m); if (w.any) history.push({ id: toISO(m), ...w }); }
  const note = { steps: `${doc.stepsN}/5 gün`, sleep: `${doc.sleepN}/5 gecə` };
  return (
    <Card>
      <H2 sub={`${fmtDate(mon)} – ${fmtDate(addDays(mon, 6))}. Gündəlikdəki qeydlərdən avtomatik hesablanır — ayrıca işarələmək lazım deyil.`}
        right={<Pill tone={score(doc) >= 5 ? 'good' : 'neutral'}>{score(doc)} / {WEEK_ITEMS.length}</Pill>}>Bu həftənin icrası</H2>
      <div className="checks">
        {WEEK_ITEMS.map(([k, label]) => (
          <div key={k} className={`check-card ro ${doc[k] ? 'on' : ''}`}>
            <span className="check-box"><Icon name="check" /></span>
            <span>{label}{note[k] ? <span className="block text-xs text-ink3 font-normal">{note[k]}</span> : null}</span>
          </div>
        ))}
      </div>
      {history.length ? (
        <div className="mt-4">
          <div className="text-xs text-ink3 mb-1.5">Əvvəlki həftələr</div>
          <div className="flex flex-wrap gap-1.5">
            {history.map((w) => (
              <span key={w.id} className="hist" title={`${fmtDate(fromISO(w.id))}: ${score(w)}/${WEEK_ITEMS.length}`} style={{ '--fill': `${(score(w) / WEEK_ITEMS.length) * 100}%` }}>
                <span className="num">{score(w)}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function Photos({ store, photos, sync }) {
  const [milestone, setMilestone] = useState(MILESTONE_OPTS[0]);
  const [pose, setPose] = useState(POSE_OPTS[0]);
  const [date, setDate] = useState(toISO(new Date()));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [drag, setDrag] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const inputRef = useRef(null);
  const list = useMemo(() => [...photos].sort((a, b) => ((a.date || '') < (b.date || '') ? -1 : 1)), [photos]);
  const [beforeId, setBeforeId] = useState('');
  const [afterId, setAfterId] = useState('');
  const before = list.find((p) => p.id === beforeId) || list[0];
  const after = list.find((p) => p.id === afterId) || (list.length > 1 ? list[list.length - 1] : null);
  const canUpload = store && store.canUpload;
  const [cam, setCam] = useState(false);
  const ghost = [...list].reverse().find((p) => p.kind === 'image' && p.pose === pose);
  const ghostUrl = useMediaUrl(store, ghost ? ghost.ref : null);

  const handle = async (file) => {
    if (!file || !store) return;
    setMsg(null);
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name);
    if (!isVideo && !isImage) { setMsg({ t: 'err', x: 'Yalnız şəkil (JPG, PNG, WEBP) və ya video (MP4, WEBM) yüklə.' }); return; }
    if (isVideo && !['video/mp4', 'video/webm'].includes(file.type)) { setMsg({ t: 'err', x: 'Bu video formatı dəstəklənmir. iPhone .mov faylını MP4 kimi ixrac et (Kamera → Paylaş → Seçimlər → "Ən uyğun").' }); return; }
    if (isVideo && file.size > 20 * 1024 * 1024) { setMsg({ t: 'err', x: `Video ${(file.size / 1048576).toFixed(0)} MB-dır; maksimum 20 MB. 10–15 saniyəlik klip çək.` }); return; }
    setBusy(true);
    try {
      let blob = file; let type = file.type;
      if (isImage) {
        try { blob = await toJpeg(file); type = 'image/jpeg'; } catch { setMsg({ t: 'err', x: 'Şəkil açılmadı. HEIC formatıdırsa, telefonda JPG kimi saxla və yenidən yüklə.' }); setBusy(false); return; }
      }
      const { ref } = await store.upload(blob, type);
      await store.add('photos', { ref, kind: isVideo ? 'video' : 'image', milestone, pose, date, createdAt: new Date().toISOString() });
      setMsg({ t: 'ok', x: `${milestone} · ${pose} yükləndi.` });
    } catch (err) {
      const code = err && err.code;
      setMsg({ t: 'err', x: code === 'too_large' ? 'Fayl çox böyükdür (maks. 20 MB).' : code === 'quota_or_state' ? 'Yaddaş limiti dolub. Köhnə faylları sil.' : code === 'rate_limited' ? 'Çox tez-tez yükləyirsən. Bir dəqiqə gözlə.' : 'Yükləmək alınmadı. Yenidən cəhd et.' });
    } finally { setBusy(false); if (inputRef.current) inputRef.current.value = ''; }
  };

  const del = async (p) => {
    setConfirm(null);
    try { await store.remove('photos', p.id); await store.removeMedia(p.ref); } catch { setMsg({ t: 'err', x: 'Silmək alınmadı.' }); }
  };

  return (
    <Card>
      <H2 sub="Hər ay eyni yerdə, eyni işıqda, səhər ac qarına: öndən (rahat və gərgin), yandan, arxadan. 1 ildən sonra Başlanğıc ilə 12-ci ayı yan-yana qoy.">Şəkil və video arxivi</H2>
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <div className="grid gap-3 content-start">
          <div className="grid grid-cols-2 gap-3">
            <label className="field"><span>Mərhələ</span><select id="ph-ms" value={milestone} onChange={(e) => setMilestone(e.target.value)}>{MILESTONE_OPTS.map((o) => <option key={o}>{o}</option>)}</select></label>
            <label className="field"><span>Poza</span><select id="ph-pose" value={pose} onChange={(e) => setPose(e.target.value)}>{POSE_OPTS.map((o) => <option key={o}>{o}</option>)}</select></label>
          </div>
          <label className="field"><span>Tarix</span><input id="ph-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <button type="button" className="btn btn-primary" disabled={!canUpload || busy} onClick={() => setCam(true)}>📷 Kölgə ilə çək{ghost ? ` (əvvəlki: ${ghost.milestone})` : ''}</button>
          {cam ? <GhostCam prevUrl={ghostUrl} pose={pose} onClose={() => setCam(false)} onFile={(b) => { setCam(false); handle(new File([b], `prime-${date}.jpg`, { type: 'image/jpeg' })); }} /> : null}
          <div
            className={`drop ${drag ? 'drag' : ''} ${!canUpload ? 'disabled' : ''}`}
            onDragOver={(e) => { e.preventDefault(); if (canUpload) setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); if (canUpload) handle(e.dataTransfer.files[0]); }}
          >
            <Icon name="upload" className="drop-ic" />
            <p className="text-sm text-ink">{busy ? 'Yüklənir…' : 'Şəkli və ya videonu bura at'}</p>
            <p className="text-xs text-ink3">JPG, PNG, WEBP · MP4, WEBM (maks. 20 MB)</p>
            <label className={`btn btn-ghost mt-2 ${!canUpload || busy ? 'pointer-events-none opacity-60' : ''}`}>
              Fayl seç
              <input ref={inputRef} id="ph-file" type="file" accept="image/*,video/mp4,video/webm" className="sr-only" disabled={!canUpload || busy} onChange={(e) => handle(e.target.files[0])} />
            </label>
          </div>
          {!canUpload && store ? <p className="text-xs text-ink3">Bu görünüşdə fayl yükləmək mümkün deyil (yalnız panel sahibi yükləyə bilər).</p> : null}
          {msg ? <p className={`form-msg ${msg.t}`} role="status">{msg.x}</p> : null}
          <p className="text-xs text-ink3">{store && store.mode === 'cloud' ? 'Fayllar artifaktın yaddaşında saxlanır və yalnız redaktə icazəsi olanlara görünür.' : 'Fayllar yalnız bu brauzerdə (IndexedDB) saxlanır.'}</p>
        </div>

        <div className="min-w-0 grid gap-4">
          {list.length >= 2 && before && after && before.kind === 'image' && after.kind === 'image' ? (
            <Compare store={store} before={before} after={after} />
          ) : (
            <div className="compare-empty">
              <div className="ce-slot"><span className="ce-k">Əvvəl</span><span className="text-ink3 text-sm">{list[0] ? 'Müqayisə üçün 2-ci şəkli yüklə' : 'Başlanğıc şəkli'}</span></div>
              <div className="ce-slot"><span className="ce-k">Sonra</span><span className="text-ink3 text-sm">12-ci ay</span></div>
            </div>
          )}
          {list.length >= 2 ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="field"><span>Əvvəl</span><select id="cmp-before" value={before ? before.id : ''} onChange={(e) => setBeforeId(e.target.value)}>{list.map((p) => <option key={p.id} value={p.id}>{p.milestone} · {p.pose} · {p.date}{p.kind === 'video' ? ' (video)' : ''}</option>)}</select></label>
              <label className="field"><span>Sonra</span><select id="cmp-after" value={after ? after.id : ''} onChange={(e) => setAfterId(e.target.value)}>{list.map((p) => <option key={p.id} value={p.id}>{p.milestone} · {p.pose} · {p.date}{p.kind === 'video' ? ' (video)' : ''}</option>)}</select></label>
            </div>
          ) : null}
          {list.length ? (
            <ul className="gallery">
              {list.map((p) => (
                <li key={p.id} className="g-item">
                  <Media store={store} item={p} className="g-media" />
                  <div className="g-cap">
                    <span className="min-w-0"><b className="text-ink text-sm">{p.milestone}</b><span className="block text-xs text-ink3">{p.pose} · {p.date ? fmtDate(fromISO(p.date)) : ''}</span></span>
                    {confirm === p.id ? (
                      <span className="inline-flex gap-1"><button type="button" className="btn-xs btn-danger" onClick={() => del(p)}>Sil</button><button type="button" className="btn-xs" onClick={() => setConfirm(null)}>Ləğv</button></span>
                    ) : <button type="button" className="icon-btn" aria-label="Faylı sil" onClick={() => setConfirm(p.id)}><Icon name="trash" /></button>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty">
              <p className="text-sm text-ink2">{sync.loading ? 'Arxiv yüklənir…' : 'Hələ fayl yoxdur.'}</p>
              <p className="text-xs text-ink3 mt-1">İlk addım: bu həftə "Başlanğıc" mərhələsi üçün öndən, yandan və arxadan 3 şəkil.</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function Compare({ store, before, after }) {
  const [pos, setPos] = useState(50);
  const a = useMediaUrl(store, before.ref);
  const b = useMediaUrl(store, after.ref);
  return (
    <div className="compare">
      <div className="cmp-stage">
        {b ? <img src={b} alt={`Sonra: ${after.milestone}`} className="cmp-img" /> : null}
        {a ? <img src={a} alt={`Əvvəl: ${before.milestone}`} className="cmp-img cmp-top" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} /> : null}
        <div className="cmp-line" style={{ left: `${pos}%` }} aria-hidden="true" />
        <span className="cmp-lab l">Əvvəl · {before.milestone}</span>
        <span className="cmp-lab r">Sonra · {after.milestone}</span>
      </div>
      <input id="cmp-range" type="range" min="0" max="100" value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Müqayisə sürgüsü" className="cmp-range" />
    </div>
  );
}
