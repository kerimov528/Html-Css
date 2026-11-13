import { Icon, Pill, useBackClose } from './ui.jsx';
import { ExMedia } from './media.jsx';
import { EX, MUSCLES, WARMUP, COOLDOWN, DAYS, setsFor, restLabel, BODYWEIGHT, ASSISTED } from './data/exercises.js';
import { fmtNum, fmtDate, fromISO } from './util.js';

const { useState, useEffect, useMemo, useRef } = React;

// ---------- Məşq dəftəri: köməkçilər ----------
export function repRange(reps) {
  const m = String(reps).match(/(\d+)\s*[–-]\s*(\d+)/);
  if (m) return [Number(m[1]), Number(m[2])];
  const n = parseInt(reps, 10) || 10;
  return [n, n];
}

const BIG_STEP = ['leg_press', 'hack_squat', 'leg_press_calf', 'smith_squat', 'seated_calf_raise', 'smith_calf_raise', 'standing_calf_raise'];
export function stepFor(id) {
  const eq = (EX[id] && EX[id].eq) || '';
  if (BIG_STEP.includes(id)) return 5;
  if (/Hantel/.test(eq)) return 2;
  return 2.5;
}

export const e1rm = (kg, r) => (kg > 0 && r > 0 ? kg * (1 + r / 30) : 0);
export const doneSets = (arr) => (arr || []).filter((s) => s && s.ok);

export function lastSession(days, id, beforeISO) {
  let best = null;
  for (const iso of Object.keys(days)) {
    if (iso >= beforeISO) continue;
    const sets = doneSets(((days[iso] || {}).lifts || {})[id]);
    if (sets.length && (!best || iso > best.iso)) best = { iso, sets };
  }
  return best;
}

// hold: 'Ramazan' / 'Deload həftəsi' — bu həftələrdə çəki artırılmır
export function suggest(id, last, reps, hold) {
  const [lo, hi] = repRange(reps);
  const bw = BODYWEIGHT.includes(id);
  if (!last) {
    if (bw) return { kg: 0, r: lo, t: 'Çəkisiz hərəkətdir: kq yazmaq lazım deyil, yalnız təkrarı qeyd et. Setin sonunda 2–3 təkrar ehtiyat qalsın.' };
    return { kg: null, r: hi, t: 'İlk dəfə: yüngül çəki ilə başla, setin sonunda 2–3 təkrar ehtiyat qalsın. Çəkini yaz — növbəti dəfə sistem özü təklif edəcək.' };
  }
  const top = Math.max(...last.sets.map((s) => Number(s.kg) || 0));
  const topSets = last.sets.filter((s) => (Number(s.kg) || 0) === top);
  const step = stepFor(id);
  const allHi = topSets.every((s) => (Number(s.r) || 0) >= hi);
  const kgTxt = top > 0 ? `${fmtNum(top, top % 1 ? 1 : 0)} kq` : 'çəkisiz';
  if (hold && allHi) return { kg: top, r: hi, t: `${hold}: çəkini artırma — keçən dəfəki kimi ${kgTxt} × ${hi}. Məqsəd formanı saxlamaqdır.` };
  if (bw && top === 0) {
    if (allHi) return { kg: 2.5, r: lo, up: true, t: `Bütün setlərdə ${hi} təkrar etdin → 2,5 kq disk (və ya yüngül hantel) götür və ${lo} təkrardan başla. Disk yoxdursa, çəkisiz qal və hər təkrarı 3 saniyəyə endir.` };
    return { kg: 0, r: hi, t: `Çəkisiz: hər setdə +1 təkrar et. Bütün setlərdə ${hi}-ə çatanda əlavə çəki götürəcəksən.` };
  }
  if (ASSISTED.includes(id) && top > 0) {
    if (allHi) return { kg: Math.max(0, top - 5), r: lo, up: true, t: `Bütün setlərdə ${hi} təkrar etdin → kömək çəkisini 5 kq azalt: ${fmtNum(Math.max(0, top - 5), 0)} kq × ${lo}+. Bu trenajorda rəqəm azaldıqca hərəkət çətinləşir.` };
    return { kg: top, r: hi, t: `Eyni kömək çəkisi — ${fmtNum(top, top % 1 ? 1 : 0)} kq. Hər setdə +1 təkrar et; ${hi}-ə çatanda kömək azalacaq.` };
  }
  if (top > 0 && allHi) return { kg: top + step, r: lo, up: true, t: `Keçən dəfə bütün setlərdə ${hi} təkrar etdin → bu dəfə +${fmtNum(step, step % 1 ? 1 : 0)} kq: ${fmtNum(top + step, (top + step) % 1 ? 1 : 0)} kq × ${lo}+` };
  if (topSets.some((s) => (Number(s.r) || 0) < lo)) return { kg: top, r: lo, t: `Keçən dəfə ${lo} təkrardan az alındı → eyni çəki (${fmtNum(top, top % 1 ? 1 : 0)} kq), hər setdə ${lo}-a çatmağa çalış. Yenə alınmasa, 5–10% azalt.` };
  return { kg: top, r: hi, t: `Eyni çəki — ${fmtNum(top, top % 1 ? 1 : 0)} kq. Hər setdə +1 təkrar et; ${hi}-ə çatanda çəki artacaq.` };
}

const fmtKg = (kg) => (kg == null || kg === '' ? '—' : fmtNum(Number(kg), Number(kg) % 1 ? 1 : 0));

// ---------- İstirahət taymeri (bütün səhifə üçün bir dənə) ----------
let tState = { end: 0, total: 0, label: '' };
const tSubs = new Set();
const tEmit = () => tSubs.forEach((f) => f(tState));
let audio = null;
function unlockAudio() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch { audio = null; }
}
function beep() {
  try {
    if (!audio) return;
    [0, 0.25, 0.5].forEach((t, i) => {
      const o = audio.createOscillator(); const g = audio.createGain();
      o.frequency.value = i === 2 ? 1180 : 880; o.type = 'sine';
      g.gain.setValueAtTime(0.0001, audio.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.35, audio.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + t + 0.2);
      o.connect(g).connect(audio.destination); o.start(audio.currentTime + t); o.stop(audio.currentTime + t + 0.22);
    });
  } catch { /* səs bağlıdır */ }
}
export const timer = {
  start(sec, label = '') { unlockAudio(); tState = { end: Date.now() + sec * 1000, total: sec, label }; tEmit(); },
  add(sec) { if (!tState.end) return; tState = { ...tState, end: Math.max(Date.now(), tState.end) + sec * 1000, total: tState.total + sec }; tEmit(); },
  stop() { tState = { end: 0, total: 0, label: '' }; tEmit(); },
};

export function RestTimer() {
  const [st, setSt] = useState(tState);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { tSubs.add(setSt); return () => tSubs.delete(setSt); }, []);
  useEffect(() => {
    if (!st.end) return undefined;
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, [st.end]);
  const left = st.end ? Math.ceil((st.end - now) / 1000) : 0;
  // ring yalnız «vaxt bitdi» anından asılıdır (saniyə sayğacından yox) — ona görə 5 saniyədən sonra özü bağlanır
  const ring = !!st.end && left <= 0;
  useEffect(() => {
    if (!ring) return undefined;
    const end = st.end;
    beep();
    try { navigator.vibrate && navigator.vibrate([300, 150, 300, 150, 500]); } catch { /* titrəmə yoxdur */ }
    const t = setTimeout(() => { if (tState.end === end) timer.stop(); }, 5000);
    return () => clearTimeout(t);
  }, [ring, st.end]);
  if (!st.end) return null;
  const mm = Math.floor(Math.max(0, left) / 60); const ss = String(Math.max(0, left) % 60).padStart(2, '0');
  const pct = st.total ? Math.max(0, Math.min(100, (left / st.total) * 100)) : 0;
  return (
    <div className={`rtimer ${ring ? 'ring' : ''}`} role="timer" aria-live="polite">
      <div className="rt-bar" style={{ width: `${pct}%` }} />
      <div className="rt-main">
        <span className="rt-k">{ring ? 'Vaxt bitdi — növbəti set!' : 'İstirahət'}</span>
        <span className="rt-v num">{ring ? '0:00' : `${mm}:${ss}`}</span>
        {st.label ? <span className="rt-l">{st.label}</span> : null}
      </div>
      {!ring ? <button type="button" className="rt-b" onClick={() => timer.add(15)}>+15 san</button> : null}
      <button type="button" className="rt-b" onClick={() => timer.stop()} aria-label="Taymeri bağla"><Icon name="x" className="icon-sm" /></button>
    </div>
  );
}

// ---------- Set dəftəri ----------
export function SetLogger({ id, slot, sets, iso, days, updateDay, canLog, nextLabel, hold }) {
  const ex = EX[id];
  const bw = BODYWEIGHT.includes(id);
  const cur = (((days[iso] || {}).lifts) || {})[id] || [];
  const last = useMemo(() => lastSession(days, id, iso), [days, id, iso]);
  const sg = suggest(id, last, slot.reps, hold);
  const [draft, setDraft] = useState({});
  useEffect(() => setDraft({}), [id, iso]);
  const n = Math.max(sets, cur.length);
  const rows = Array.from({ length: n }, (_, i) => cur[i] || {});

  const write = (i, patch) => updateDay(iso, (d) => {
    const lifts = { ...(d.lifts || {}) };
    const arr = [...(lifts[id] || [])];
    while (arr.length <= i) arr.push({});
    arr[i] = { ...arr[i], ...patch };
    lifts[id] = arr;
    const extra = patch.ok && !d.train ? { train: 'yes' } : {};
    return { lifts, ...extra };
  });
  const val = (i, k) => (draft[`${i}${k}`] != null ? draft[`${i}${k}`] : rows[i][k] != null ? String(rows[i][k]).replace('.', ',') : '');
  const num = (v) => { const x = parseFloat(String(v).replace(',', '.')); return Number.isFinite(x) ? x : null; };
  const tick = (i) => {
    if (rows[i].ok) { write(i, { ok: false }); return; }
    const kg = num(val(i, 'kg')) ?? sg.kg ?? (last ? Number(last.sets[0].kg) : null) ?? (bw ? 0 : null);
    const r = num(val(i, 'r')) ?? sg.r;
    if (kg == null) { const el = document.getElementById(`kg-${id}-${i}`); if (el) el.focus(); return; }
    write(i, { kg, r, ok: true });
    const lastSet = i >= n - 1;
    timer.start(slot.rest || 90, lastSet ? (nextLabel ? `Sonra: ${nextLabel}` : 'Hərəkət bitdi') : `${ex.az} · ${i + 2}-ci set`);
  };
  const doneN = rows.filter((r) => r.ok).length;

  return (
    <div className="slog">
      <div className="slog-head">
        <span className="em-k">Dəftər</span>
        <span className="text-xs text-ink3">{doneN}/{n} set</span>
      </div>
      {last ? (
        <p className="slog-last">Keçən dəfə ({fmtDate(fromISO(last.iso))}): {last.sets.map((s, i) => <span key={i} className="num">{bw && !Number(s.kg) ? 'çəkisiz' : fmtKg(s.kg)}×{s.r}</span>)}</p>
      ) : null}
      <p className={`slog-tip ${sg.up ? 'up' : ''}`}>{sg.up ? '▲ ' : ''}{sg.t}</p>
      <ol className="slog-rows">
        {rows.map((r, i) => (
          <li key={i} className={r.ok ? 'ok' : ''}>
            <span className="slog-n num">{i + 1}</span>
            <label className="slog-in"><input id={`kg-${id}-${i}`} inputMode="decimal" disabled={!canLog} placeholder={bw && !sg.kg ? '+kq' : sg.kg != null ? fmtKg(sg.kg) : 'kq'} value={val(i, 'kg')} onChange={(e) => setDraft({ ...draft, [`${i}kg`]: e.target.value })} onBlur={(e) => { const v = num(e.target.value); if (rows[i].ok && v != null && v !== rows[i].kg) write(i, { kg: v }); }} aria-label={`${i + 1}-ci set, kq`} /><span>kq</span></label>
            <span className="text-ink3">×</span>
            <label className="slog-in slog-r"><input inputMode="numeric" disabled={!canLog} placeholder={String(sg.r)} value={val(i, 'r')} onChange={(e) => setDraft({ ...draft, [`${i}r`]: e.target.value })} onBlur={(e) => { const v = num(e.target.value); if (rows[i].ok && v != null && v !== rows[i].r) write(i, { r: v }); }} aria-label={`${i + 1}-ci set, təkrar`} /><span>dəfə</span></label>
            <button type="button" className="slog-ok" disabled={!canLog} onClick={() => tick(i)} aria-pressed={!!r.ok} aria-label={r.ok ? 'Seti geri al' : 'Set bitdi'}><Icon name="check" className="icon-sm" /></button>
          </li>
        ))}
      </ol>
      {canLog ? (
        <div className="slog-foot">
          <button type="button" className="btn-xs" onClick={() => write(n, {})}>+ set</button>
          <span className="text-xs text-ink3">{bw ? '✓ bas → taymer başlayır. Çəkisiz hərəkət: kq xanasını boş saxla (əlavə çəki götürsən yaz).' : '✓ bas → istirahət taymeri başlayır. Boş xanada təklif olunan rəqəm yazılır.'}</span>
        </div>
      ) : <p className="text-xs text-ink3 mt-1">Gələcək gün üçün qeyd edilə bilməz.</p>}
    </div>
  );
}

// ---------- Zal rejimi ----------
export function GymMode({ day, ctx, variants, onChooseVariant, iso, days, updateDay, canLog, onClose, ram }) {
  const D = DAYS[day];
  const { phase, deload } = ctx;
  const nSets = (s) => Math.max(1, setsFor(s, phase.n, deload) - (ram ? 1 : 0));
  const steps = useMemo(() => [{ k: 'warm' }, ...D.slots.map((s, i) => ({ k: 'ex', s, i })), { k: 'cool' }], [D]);
  const [idx, setIdx] = useState(0);
  const st = steps[idx];
  const hold = ram ? 'Ramazan' : deload ? 'Deload həftəsi' : null;
  useBackClose(true, onClose);

  useEffect(() => {
    let lock = null;
    const req = async () => { try { lock = navigator.wakeLock ? await navigator.wakeLock.request('screen') : null; } catch { lock = null; } };
    req();
    const onVis = () => { if (document.visibilityState === 'visible') req(); };
    document.addEventListener('visibilitychange', onVis);
    document.documentElement.classList.add('modal-open');
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { try { lock && lock.release(); } catch { /* */ } document.removeEventListener('visibilitychange', onVis); document.documentElement.classList.remove('modal-open'); window.removeEventListener('keydown', onKey); };
  }, []);

  const isDone = (s, i) => doneSets((((days[iso] || {}).lifts) || {})[s.ex[variants[`${day}${i}`] || 0]]).length >= nSets(s);
  const mustN = D.slots.filter((s) => !s.opt).length;
  const doneCount = D.slots.filter((s, i) => !s.opt && isDone(s, i)).length;
  const bonus = D.slots.some((s, i) => s.opt && isDone(s, i));

  let body = null;
  if (st.k === 'warm') {
    body = (
      <div className="gm-body">
        <h2 className="h2">İsinmə — 10 dəqiqə</h2>
        <ul className="grid gap-2 mt-3">
          {WARMUP.map((w, i) => { const id = w.ex[variants[`W${i}`] || 0]; return (
            <li key={i} className="gm-warm"><ExMedia id={id} size="thumb" /><span className="min-w-0"><span className="block text-xs text-ink3">{w.label}</span><b className="text-ink">{EX[id].az}</b></span><b className="num text-ink">{w.dose}</b></li>
          ); })}
        </ul>
        <p className="text-sm text-ink2 mt-3">Sonra ilk hərəkətdə 2 yüngül set: işçi çəkinin yarısı × 10, 70%-i × 5.</p>
      </div>
    );
  } else if (st.k === 'cool') {
    body = (
      <div className="gm-body">
        <h2 className="h2">Bitiriş — dartılma</h2>
        <ul className="steps mt-3">{COOLDOWN.map((c) => <li key={c}>{c}</li>)}</ul>
        <div className="gm-done mt-4"><b className="num">{doneCount}/{mustN}</b> əsas hərəkət tam yerinə yetirildi{bonus ? ' + «vaxt qalsa» hərəkəti' : ''}.{doneCount === mustN ? ' Əla iş! 💪' : ''}</div>
        <p className="text-sm text-ink2 mt-2">Gündəlikdə «Məşq etdim» avtomatik ✓ olur. Axşam yuxunu və yeməkləri də qeyd et.</p>
      </div>
    );
  } else {
    const key = `${day}${st.i}`;
    const vi = variants[key] || 0;
    const id = st.s.ex[vi]; const ex = EX[id];
    const sets = nSets(st.s);
    const nxt = steps[idx + 1] && steps[idx + 1].k === 'ex' ? EX[steps[idx + 1].s.ex[variants[`${day}${steps[idx + 1].i}`] || 0]].az : null;
    body = (
      <div className="gm-body gm-ex">
        <div className="gm-media"><ExMedia id={id} size="big" /></div>
        <div className="min-w-0">
          <div className="excard-g">{st.s.g}{st.s.opt ? <Pill tone="neutral" className="ml-2">Vaxt qalsa</Pill> : null}</div>
          <h2 className="h2">{ex.az}</h2>
          <div className="gm-rx num"><b>{sets}</b> set × <b>{st.s.reps}</b> · istirahət <b>{restLabel(st.s.rest)}</b></div>
          <div className="excard-mus">{ex.p.map((m) => <span key={m} className="mchip mchip-p">{MUSCLES[m]}</span>)}</div>
          <label className="swap mt-2">
            <span>Alət məşğuldur?</span>
            <select className="select select-sm" value={vi} onChange={(e) => onChooseVariant(key, Number(e.target.value))}>
              {st.s.ex.map((eid, i) => <option key={eid} value={i}>{i === 0 ? 'Əsas: ' : `Alt ${i}: `}{EX[eid].az}</option>)}
            </select>
          </label>
          <SetLogger key={id} id={id} slot={st.s} sets={sets} iso={iso} days={days} updateDay={updateDay} canLog={canLog} nextLabel={nxt} hold={hold} />
          <details className="gm-cues"><summary>Necə edilir</summary><ol className="steps steps-sm mt-1">{ex.cues.map((c) => <li key={c}>{c}</li>)}</ol></details>
        </div>
      </div>
    );
  }

  return (
    <div className="gym" role="dialog" aria-modal="true" aria-label={`Zal rejimi: ${D.title}`}>
      <div className="gm-top">
        <div className="min-w-0">
          <div className="gm-k">Zal rejimi · {D.title}</div>
          <div className="gm-t">{st.k === 'warm' ? 'İsinmə' : st.k === 'cool' ? 'Bitiriş' : `${st.i + 1} / ${D.slots.length} hərəkət`}</div>
        </div>
        <button type="button" className="modal-close gm-x" onClick={onClose} aria-label="Zal rejimini bağla"><Icon name="close" /></button>
      </div>
      <div className="gm-prog" aria-hidden="true">{steps.map((s, i) => <i key={i} className={i < idx ? 'done' : i === idx ? 'now' : ''} />)}</div>
      <div className="gm-scroll">{body}</div>
      <div className="gm-nav">
        <button type="button" className="btn btn-ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>‹ Əvvəlki</button>
        {idx < steps.length - 1
          ? <button type="button" className="btn btn-primary" onClick={() => { setIdx(idx + 1); timer.stop(); }}>Növbəti ›</button>
          : <button type="button" className="btn btn-primary" onClick={onClose}>Bitir ✓</button>}
      </div>
    </div>
  );
}
