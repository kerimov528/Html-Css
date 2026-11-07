import { Card, H2, Icon } from './ui.jsx';
import { EX } from './data/exercises.js';
import { PROFILE, toISO, fromISO, addDays, mondayOf, fmtDate, fmtInt, DOW_NAMES } from './util.js';
import { doneSets } from './gym.jsx';

const { useState, useEffect, useRef } = React;

// ---------- Claude (sample) bağlantısı ----------
let samplePromise = null;
function getSample() {
  if (!samplePromise) {
    const c = typeof window !== 'undefined' ? window.claude : undefined;
    samplePromise = c && typeof c.use === 'function' ? c.use('sample').catch(() => null) : Promise.resolve(null);
  }
  return samplePromise;
}
export function useSample() {
  const [st, setSt] = useState({ fn: null, ready: false, img: false });
  useEffect(() => {
    let live = true;
    getSample().then(async (fn) => {
      let img = false;
      if (fn) { try { const l = await fn.limits(); img = !!(l && l.images); } catch { img = false; } }
      if (live) setSt({ fn, ready: true, img });
    });
    return () => { live = false; };
  }, []);
  return st;
}

const ERR = {
  not_granted: 'Bu panelə Claude istifadəsinə icazə verilməyib. Artifaktın «Permissions» menyusundan aça bilərsən.',
  sampling_disabled: 'Bu hesabda Claude bu funksiya üçün əlçatan deyil.',
  rate_limited: 'Limitə çatıldı. Bir az sonra yenidən yoxla.',
  session_expired: 'Yenidən daxil olmaq lazımdır.',
  image_rejected: 'Bu şəkli qəbul etmədi. Başqa şəkil seç (JPG/PNG).',
  images_unavailable: 'Bu görünüşdə şəkil göndərmək mümkün deyil.',
  refused: 'Claude bu sorğuya cavab vermədi. Sualı başqa cür yaz.',
  invalid_json: 'Cavab oxunmadı. Yenidən cəhd et.',
  prompt_too_large: 'Data çox böyükdür.',
};
const errText = (e) => (e && ERR[e.code]) || 'Alınmadı. Bir az sonra yenidən cəhd et.';

// ---------- Kontekst: profil + son 14 gün ----------
export function buildContext({ days, checkins, targets, ctx, nDays = 14 }) {
  const today = ctx.today;
  const log = [];
  for (let i = nDays - 1; i >= 0; i--) {
    const d = addDays(today, -i); const iso = toISO(d); const x = days[iso];
    if (!x) continue;
    const meals = x.meals || {}; const ans = [0, 1, 2, 3].filter((k) => meals[k] === 'yes' || meals[k] === 'no');
    const lifts = Object.entries(x.lifts || {}).map(([id, arr]) => { const s = doneSets(arr); return s.length ? `${EX[id] ? EX[id].az : id}: ${s.map((z) => `${z.kg}kq×${z.r}`).join(', ')}` : null; }).filter(Boolean);
    log.push({
      tarix: iso, gun: DOW_NAMES[d.getDay()], yuxu_saat: x.sleep ?? null,
      plan_yemekleri: ans.length ? `${ans.filter((k) => meals[k] === 'yes').length}/${ans.length} plana uyğun` : null,
      mesq: x.train || null, hovuz: x.swim || null, addim_hedefi: x.steps || null, su_stekan: x.water ?? null,
      elave_yedikleri: (x.foods || []).map((f) => `${f.name} ~${Math.round(f.kcal || 0)} kcal`), basqa_yedi: x.ate || null, qeyd: x.note || null,
      setler: lifts,
    });
  }
  const ck = [...checkins].filter((c) => c.date).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-8).map((c) => ({ tarix: c.date, ceki: c.weight, bel: c.waist ?? null }));
  const profile = `Kişi, ${PROFILE.age} yaş, boy ${PROFILE.height} sm, başlanğıc çəki ${PROFILE.startWeight} kq, başlanğıc bel ≈109 sm, hədəf ${PROFILE.goalWeight} kq (qarın piyi, sinə və qollar önəmli). Yeni başlayan. Proqram ${fmtDate(fromISO(ctx.startISO))} başlayıb, indi ${ctx.week || 0}-cu həftə, faza ${ctx.phase.n} (${ctx.phase.name})${ctx.deload ? ', deload həftəsi' : ''}. Həftədə 3 tam bədən məşq (Ç.a. və C.a. 18:30, Ş. 11:00, Push 30 zalı), həftədə 1 hovuz, 4 gün ofis işi 09–18. Yalnız halal, sadə ev yeməyi. Hədəf: ${targets.train} kcal (məşq günü) / ${targets.rest} kcal (istirahət), protein ${targets.protein} q, su ${targets.glassesTrain}/${targets.glassesRest} stəkan.`;
  return { profile, json: JSON.stringify({ gundelik: log, olcmeler: ck }) };
}

const RULES = 'Azərbaycan dilində, səmimi, «sən» deyə müraciət et. Yalnız datada olanı iddia et; data azdırsa bunu açıq de. Ağrı, başgicəllənmə, təzyiq kimi sağlamlıq məsələlərində həkimə yönləndir. Yalnız halal qida təklif et. Markdown başlıqları (#) istifadə etmə; qısa paraqraflar və «- » ilə siyahı yaz; vacib sözləri **qalın** yaz.';

// Sadə formatlayıcı: «- » siyahı və **qalın**
function Rich({ text }) {
  const blocks = String(text || '').split(/\n{2,}/);
  const inline = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p));
  return (
    <div className="rich">
      {blocks.map((b, i) => {
        const lines = b.split('\n').filter((l) => l.trim());
        if (lines.length && lines.every((l) => /^\s*([-•*]|\d+[.)])\s+/.test(l))) {
          return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*([-•*]|\d+[.)])\s+/, ''))}</li>)}</ul>;
        }
        return <p key={i}>{lines.map((l, j) => <span key={j}>{j ? <br /> : null}{inline(l.replace(/^#+\s*/, ''))}</span>)}</p>;
      })}
    </div>
  );
}

// ---------- 1. Həftəlik məşqçi rəyi ----------
export function WeeklyCoach({ store, days, checkins, targets, ctx, reports, canWrite }) {
  const { fn, ready } = useSample();
  const mon = mondayOf(ctx.today); const wk = toISO(mon);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [sel, setSel] = useState(wk);
  const ctl = useRef(null);
  const list = [...(reports || [])].sort((a, b) => (a.id < b.id ? 1 : -1));
  const saved = list.find((r) => r.id === sel);
  const shown = busy || (text && sel === wk) ? text : saved ? saved.text : '';

  const run = async () => {
    if (!fn || busy) return;
    setErr(null); setBusy(true); setText(''); setSel(wk);
    const c = buildContext({ days, checkins, targets, ctx, nDays: 14 });
    const prompt = `Sən təcrübəli fitnes məşqçisi və idman qidalanması mütəxəssisisən, müştərinin şəxsi məşqçisisən. ${RULES}\n\nMüştəri: ${c.profile}\n\nSon 14 günün datası (JSON):\n${c.json}\n\nBu gün ${fmtDate(ctx.today)}. Bu həftə (${fmtDate(mon)} – ${fmtDate(addDays(mon, 6))}) üçün həftəlik rəy yaz:\n1) Nə yaxşı getdi — rəqəmlərlə.\n2) Nə zəif oldu və niyə vacibdir.\n3) Gələn həftə üçün 3 konkret tapşırıq (məşq, qida, yuxu/su) — «- » siyahı ilə.\n4) Bir cümləlik motivasiya.\n180–260 söz.`;
    ctl.current = new AbortController();
    try {
      const r = await fn(prompt, { onText: ({ text: t }) => setText(t), signal: ctl.current.signal, modelTier: 'default', cache: false });
      setText(r.text);
      if (store && canWrite) store.setDoc(`reports/${wk}`, { week: wk, text: r.text, createdAt: new Date().toISOString() }).catch(() => {});
    } catch (e) {
      if (e && e.code !== 'cancelled') setErr(errText(e));
      if (e && e.text) setText(e.text);
    } finally { setBusy(false); }
  };

  if (ready && !fn) {
    return (
      <Card className="coach">
        <H2 sub="Claude bu görünüşdə əlçatan deyil (məs. panel brauzerdə claude.ai-dan kənarda açılıb).">🤖 Məşqçi rəyi</H2>
      </Card>
    );
  }
  return (
    <Card className="coach">
      <H2 sub="Claude gündəliyinə, məşq dəftərinə və ölçmələrinə baxıb şəxsi rəy yazır. Bazar axşamı ölçmədən sonra ən faydalıdır." right={
        list.length ? <select className="select select-sm" value={sel} onChange={(e) => { setSel(e.target.value); setText(''); }} aria-label="Həftə">{[...new Set([wk, ...list.map((r) => r.id)])].map((id) => <option key={id} value={id}>{fmtDate(fromISO(id))} həftəsi</option>)}</select> : null
      }>🤖 Həftəlik məşqçi rəyi</H2>
      {shown ? <Rich text={shown} /> : <p className="text-sm text-ink3">{sel === wk ? 'Bu həftə üçün hələ rəy yoxdur.' : 'Bu həftə üçün saxlanmış rəy yoxdur.'}</p>}
      {err ? <p className="form-msg err mt-2" role="status">{err}</p> : null}
      <div className="flex flex-wrap gap-2 mt-3 items-center">
        <button type="button" className="btn btn-primary" onClick={run} disabled={!fn || busy}>{busy ? 'Claude yazır…' : saved && sel === wk ? 'Rəyi yenilə' : 'Bu həftənin rəyini al'}</button>
        {busy ? <button type="button" className="btn btn-ghost" onClick={() => ctl.current && ctl.current.abort()}>Dayandır</button> : null}
        <span className="text-xs text-ink3">Hər rəy sənin Claude limitindən istifadə edir. Rəy yadda saxlanır.</span>
      </div>
    </Card>
  );
}

// ---------- 3. Məşqçiyə sual ----------
const QUICK = ['Bu gün çiynim ağrıyır, məşqi necə dəyişim?', 'Toya gedirəm, nə yeyim ki plandan çıxmayım?', 'Bu həftə məşqə gedə bilmədim, nə edim?', 'Press artmır, nə dəyişim?'];
export function AskCoach({ days, checkins, targets, ctx }) {
  const { fn, ready } = useSample();
  const [turns, setTurns] = useState([]);
  const [q, setQ] = useState('');
  const [live, setLive] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const ctl = useRef(null);
  if (ready && !fn) return null;

  const ask = async (question) => {
    const qq = String(question || '').trim();
    if (!fn || busy || !qq) return;
    setErr(null); setQ('');
    let first = qq;
    if (!turns.length) {
      const c = buildContext({ days, checkins, targets, ctx, nDays: 7 });
      first = `Sən müştərinin şəxsi fitnes məşqçisi və qidalanma məsləhətçisisən. ${RULES} Cavabı qısa saxla (maks. 150 söz), konkret addımlarla.\n\nMüştəri: ${c.profile}\nSon 7 günün datası: ${c.json}\n\nSual: ${qq}`;
    }
    const next = [...turns, { role: 'user', content: first, show: qq }];
    setTurns(next); setBusy(true); setLive('');
    ctl.current = new AbortController();
    try {
      const r = await fn(next.map(({ role, content }) => ({ role, content })), { onText: ({ text }) => setLive(text), signal: ctl.current.signal, cache: false });
      setTurns([...next, { role: 'assistant', content: r.text }]);
    } catch (e) {
      if (e && e.code !== 'cancelled') setErr(errText(e));
      setTurns(e && e.text ? [...next, { role: 'assistant', content: e.text }] : turns);
    } finally { setBusy(false); setLive(''); }
  };

  return (
    <Card className="coach">
      <H2 sub="Sənin planını və son 7 günü bilir. Tibbi məsələlərdə həkimə müraciət et.">💬 Məşqçiyə sual ver</H2>
      {turns.length || busy ? (
        <ol className="chat">
          {turns.map((t, i) => <li key={i} className={t.role}>{t.role === 'user' ? <p>{t.show || t.content}</p> : <Rich text={t.content} />}</li>)}
          {busy ? <li className="assistant">{live ? <Rich text={live} /> : <p className="text-ink3">Claude düşünür…</p>}</li> : null}
        </ol>
      ) : (
        <div className="flex flex-wrap gap-2">{QUICK.map((x) => <button key={x} type="button" className="chip-q" onClick={() => ask(x)} disabled={!fn}>{x}</button>)}</div>
      )}
      {err ? <p className="form-msg err mt-2" role="status">{err}</p> : null}
      <form className="chat-in mt-3" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sualını yaz…" aria-label="Sual" disabled={!fn || busy} />
        {busy ? <button type="button" className="btn btn-ghost" onClick={() => ctl.current && ctl.current.abort()}>Dayandır</button> : <button type="submit" className="btn btn-primary" disabled={!fn || !q.trim()}>Göndər</button>}
      </form>
      {turns.length && !busy ? <button type="button" className="link-muted text-xs mt-2" onClick={() => { setTurns([]); setErr(null); }}>Yeni söhbət</button> : null}
    </Card>
  );
}

// ---------- 2. Şəkildən kalori ----------
async function shrink(file, max = 1280) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    return await new Promise((res) => cv.toBlob((b) => res(b || file), 'image/jpeg', 0.85));
  } catch { return file; } finally { URL.revokeObjectURL(url); }
}

export function MealPhoto({ onAdd, disabled }) {
  const { fn, ready, img } = useSample();
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [prev, setPrev] = useState(null);
  const [err, setErr] = useState(null);
  const [k, setK] = useState(1);
  const ref = useRef(null);
  if (ready && (!fn || !img)) return null;

  const go = async (file) => {
    if (!file || !fn) return;
    setErr(null); setRes(null); setBusy(true); setK(1);
    try {
      const blob = await shrink(file);
      setPrev(URL.createObjectURL(blob));
      const out = await fn.json('Şəkildəki yeməyi analiz et (Azərbaycan və ya Türk mətbəxi ola bilər). Porsiyanı boşqab, qaşıq, əl kimi ölçülərə görə təxmin et. Yalnız bu JSON ilə cavab ver: {"name":"yeməyin qısa adı azərbaycanca","items":[{"n":"tərkib","g":qram}],"kcal":rəqəm,"p":protein_q,"c":karb_q,"f":yağ_q,"conf":"aşağı|orta|yüksək","tip":"arıqlama planına uyğunluq haqqında 1 qısa cümlə azərbaycanca"}. Şəkildə yemək yoxdursa: {"error":"səbəb azərbaycanca"}.', { images: blob, modelTier: 'default' });
      if (!out || out.error || !Number.isFinite(Number(out.kcal))) setErr((out && out.error) || 'Yemək tanınmadı.');
      else setRes(out);
    } catch (e) { if (e && e.code !== 'cancelled') setErr(errText(e)); } finally { setBusy(false); if (ref.current) ref.current.value = ''; }
  };
  const add = () => {
    const n = (x) => (Number(x) || 0) * k;
    onAdd({ id: Date.now(), name: `📷 ${res.name}${k !== 1 ? ` (${k}×)` : ''}`, grams: 0, portion: 'şəkil', kcal: n(res.kcal), p: n(res.p), c: n(res.c), f: n(res.f), photo: true });
    setRes(null); setPrev(null);
  };
  return (
    <div className="mphoto">
      <label className={`btn btn-ghost mphoto-btn ${disabled || busy ? 'pointer-events-none opacity-60' : ''}`}>
        <Icon name="upload" className="icon-sm" />{busy ? 'Claude baxır…' : '📷 Yeməyin şəklini çək — kalorini Claude hesablasın'}
        <input ref={ref} type="file" accept="image/*" capture="environment" className="sr-only" disabled={disabled || busy} onChange={(e) => go(e.target.files[0])} />
      </label>
      {err ? <p className="form-msg err mt-2" role="status">{err}</p> : null}
      {res ? (
        <div className="mphoto-res">
          {prev ? <img src={prev} alt="" /> : null}
          <div className="min-w-0">
            <b className="text-ink">{res.name}</b> <span className="text-xs text-ink3">· dəqiqlik: {res.conf || 'orta'}</span>
            <div className="text-sm text-ink2 num mt-1"><b className="text-ink">{fmtInt(res.kcal * k)} kcal</b> · P {fmtInt(res.p * k)} · K {fmtInt(res.c * k)} · Y {fmtInt(res.f * k)} q</div>
            {Array.isArray(res.items) && res.items.length ? <div className="text-xs text-ink3 mt-1">{res.items.map((x) => `${x.n} ~${fmtInt(x.g)} q`).join(' · ')}</div> : null}
            {res.tip ? <p className="text-xs text-ink2 mt-1">{res.tip}</p> : null}
            <div className="flex flex-wrap gap-2 mt-2 items-center">
              <div className="seg seg-sm" role="radiogroup" aria-label="Nə qədərini yedin">{[[0.5, 'yarısını'], [1, 'hamısını'], [1.5, '1,5 qat']].map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={k === v} className={k === v ? 'on' : ''} onClick={() => setK(v)}>{l}</button>)}</div>
              <button type="button" className="btn btn-primary" onClick={add}>Günə əlavə et</button>
              <button type="button" className="btn btn-ghost" onClick={() => { setRes(null); setPrev(null); }}>Ləğv</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------- 16. Datanı yüklə ----------
let dlPromise = null;
const getDownloads = () => {
  if (!dlPromise) { const c = window.claude; dlPromise = c && typeof c.use === 'function' ? c.use('downloads').catch(() => null) : Promise.resolve(null); }
  return dlPromise;
};
const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export function ExportData({ days, checkins, sdata, photos }) {
  const [dl, setDl] = useState(undefined);
  const [msg, setMsg] = useState(null);
  useEffect(() => { getDownloads().then(setDl); }, []);
  if (dl === undefined) return null;
  const stamp = toISO(new Date());
  const save = async (filename, data) => {
    setMsg(null);
    try { await dl.save({ filename, data }); setMsg({ t: 'ok', x: `${filename} yükləndi.` }); } catch (e) { if (e && e.code !== 'declined') setMsg({ t: 'err', x: 'Yükləmək alınmadı.' }); }
  };
  const json = () => save(`prime-ili-${stamp}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), settings: sdata, checkins, days, photos: (photos || []).map(({ ref, ...p }) => p) }, null, 1));
  const csv = () => {
    const isoList = Object.keys(days).sort();
    const head = ['tarix', 'yuxu', 'yemək_plana_uyğun', 'məşq', 'hovuz', 'addım', 'su', 'əlavə_kcal', 'set_sayı', 'qeyd'];
    const rows = isoList.map((iso) => { const x = days[iso]; const m = x.meals || {}; const a = [0, 1, 2, 3].filter((i) => m[i]); return [iso, x.sleep, a.length ? `${a.filter((i) => m[i] === 'yes').length}/${a.length}` : '', x.train, x.swim, x.steps, x.water, Math.round((x.foods || []).reduce((s, f) => s + (f.kcal || 0), 0)) || '', Object.values(x.lifts || {}).reduce((s, arr) => s + doneSets(arr).length, 0) || '', x.note]; });
    const ck = [...checkins].sort((a, b) => (a.date < b.date ? -1 : 1)).map((c) => [c.date, c.weight, c.waist, c.note]);
    const text = '﻿' + [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n') + '\n\nÖlçmələr\n' + [['tarix', 'çəki', 'bel', 'qeyd'], ...ck].map((r) => r.map(csvCell).join(',')).join('\n');
    save(`prime-ili-${stamp}.csv`, text);
  };
  return (
    <section className="card">
      <H2 sub="Bütün qeydlərinin ehtiyat nüsxəsi: gündəlik, məşq dəftəri, ölçmələr, ayarlar. Şəkillər fayla daxil deyil — onlar panelin yaddaşında qalır.">💾 Datanı yüklə</H2>
      {dl ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={csv}>Excel üçün (CSV)</button>
          <button type="button" className="btn btn-ghost" onClick={json}>Tam ehtiyat nüsxə (JSON)</button>
        </div>
      ) : <p className="text-sm text-ink3">Bu görünüşdə fayl yükləmək mümkün deyil — paneli claude.ai-da aç.</p>}
      {msg ? <p className={`form-msg ${msg.t} mt-2`} role="status">{msg.x}</p> : null}
    </section>
  );
}
