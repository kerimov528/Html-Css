import { Card, H2, Icon } from './ui.jsx';
import { longestStreak } from './insights.jsx';
import { PROFILE, toISO, fromISO, fmtNum, fmtInt, fmtDate } from './util.js';

const { useState, useMemo, useEffect } = React;

// ---------- Ümumi göstəricilər ----------
export function useStats({ checkins, days, ctx, targets }) {
  return useMemo(() => {
    const ck = [...checkins].filter((c) => c.date).sort((a, b) => (a.date < b.date ? -1 : 1));
    const ws = ck.filter((c) => c.weight); const wa = ck.filter((c) => c.waist);
    const startW = ws.length ? ws[0].weight : PROFILE.startWeight;
    const curW = ws.length ? ws[ws.length - 1].weight : PROFILE.startWeight;
    const minW = ws.length ? Math.min(...ws.map((c) => c.weight)) : PROFILE.startWeight;
    const startWa = wa.length ? Math.max(PROFILE.startWaist, wa[0].waist) : PROFILE.startWaist;
    const curWa = wa.length ? wa[wa.length - 1].waist : PROFILE.startWaist;
    const minWa = wa.length ? Math.min(...wa.map((c) => c.waist)) : PROFILE.startWaist;
    const valid = Object.keys(days).filter((iso) => iso >= ctx.startISO);
    const workouts = valid.filter((iso) => days[iso].train === 'yes').length;
    const streak = longestStreak(days, ctx.startISO, targets, ctx.today);
    return { startW, curW, minW, startWa, curWa, minWa, workouts, streak };
  }, [checkins, days, ctx.startISO, targets]);
}

// ---------- 7. Mükafatlar ----------
const KINDS = {
  weight: { l: 'Çəki ≤', u: 'kq', done: (s, v) => s.minW <= v, prog: (s, v) => (PROFILE.startWeight - s.curW) / Math.max(0.1, PROFILE.startWeight - v), now: (s) => `${fmtNum(s.curW)} kq` },
  waist: { l: 'Bel ≤', u: 'sm', done: (s, v) => s.minWa <= v, prog: (s, v) => (s.startWa - s.curWa) / Math.max(0.1, s.startWa - v), now: (s) => `${fmtNum(s.curWa)} sm` },
  workouts: { l: 'Məşq sayı ≥', u: 'məşq', done: (s, v) => s.workouts >= v, prog: (s, v) => s.workouts / v, now: (s) => `${s.workouts} məşq` },
  streak: { l: 'Ardıcıl ✓ gün ≥', u: 'gün', done: (s, v) => s.streak >= v, prog: (s, v) => s.streak / v, now: (s) => `ən uzun ${s.streak} gün` },
};
const SUGGEST = [['weight', 91, 'Yeni idman ayaqqabısı'], ['workouts', 12, 'Sevdiyim restoranda (ağıllı seçimlə) şam yeməyi'], ['waist', 100, 'Yeni köynək — bir ölçü kiçik'], ['weight', 90, 'Fitnes saatı / qulaqlıq'], ['streak', 30, 'Masaj və ya hamam günü'], ['weight', 85, 'BÖYÜK HƏDİYYƏ: səyahət']];

export function rewardStatus(rewards, stats) {
  return (rewards || []).map((r) => {
    const K = KINDS[r.kind] || KINDS.weight;
    const done = K.done(stats, Number(r.v));
    return { ...r, done, pct: Math.max(0, Math.min(1, done ? 1 : K.prog(stats, Number(r.v)))), now: K.now(stats), K };
  });
}

export function RewardBanner({ rewards, stats, saveSettings, canWrite }) {
  const st = rewardStatus(rewards, stats).filter((r) => r.done && !r.claimed);
  if (!st.length) return null;
  const r = st[0];
  return (
    <div className="rw-banner" role="status">
      <span className="rw-confetti" aria-hidden="true">🎉</span>
      <div className="min-w-0"><b>Mükafat qazandın!</b><span>{r.K.l.replace(/[≤≥]/, '').trim()} {fmtNum(Number(r.v), Number(r.v) % 1 ? 1 : 0)} {r.K.u} → {r.text}</span></div>
      {canWrite ? <button type="button" className="btn btn-primary" onClick={() => saveSettings({ rewards: (rewards || []).map((x) => (x.id === r.id ? { ...x, claimed: toISO(new Date()) } : x)) })}>Aldım ✓</button> : null}
    </div>
  );
}

export function Rewards({ rewards = [], stats, saveSettings, canWrite }) {
  const [kind, setKind] = useState('weight');
  const [v, setV] = useState('');
  const [text, setText] = useState('');
  const st = rewardStatus(rewards, stats);
  const save = (list) => saveSettings({ rewards: list });
  const add = (k, val, t) => { const n = parseFloat(String(val).replace(',', '.')); if (!n || !String(t).trim()) return; save([...rewards, { id: Date.now().toString(36), kind: k, v: n, text: String(t).trim().slice(0, 80) }]); setV(''); setText(''); };
  const unused = SUGGEST.filter(([k, val]) => !rewards.some((r) => r.kind === k && Number(r.v) === val));
  return (
    <Card>
      <H2 sub="Hər mərhələyə özün mükafat qoy. Şərt yerinə yetəndə panel təbrik edir — mükafatı al və «Aldım ✓» bas.">🎁 Mükafatlarım</H2>
      {st.length ? (
        <ul className="rw-list">
          {st.map((r) => (
            <li key={r.id} className={r.done ? (r.claimed ? 'claimed' : 'won') : ''}>
              <span className="rw-ic" aria-hidden="true">{r.claimed ? '✅' : r.done ? '🎉' : '🎁'}</span>
              <div className="min-w-0">
                <b className="text-ink">{r.text}</b>
                <span className="block text-xs text-ink3">{r.K.l} {fmtNum(Number(r.v), Number(r.v) % 1 ? 1 : 0)} {r.K.u} · indi: {r.now}{r.claimed ? ` · alındı ${fmtDate(fromISO(r.claimed))}` : ''}</span>
                {!r.done ? <span className="bd-p"><i style={{ width: `${Math.round(r.pct * 100)}%` }} /></span> : null}
              </div>
              <span className="flex gap-1 items-center">
                {r.done && !r.claimed && canWrite ? <button type="button" className="btn-xs btn-cobalt" onClick={() => save(rewards.map((x) => (x.id === r.id ? { ...x, claimed: toISO(new Date()) } : x)))}>Aldım ✓</button> : null}
                {canWrite ? <button type="button" className="icon-btn" aria-label={`${r.text} sil`} onClick={() => save(rewards.filter((x) => x.id !== r.id))}><Icon name="x" /></button> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-ink3">Hələ mükafat yoxdur. Aşağıdan seç və ya özün yaz.</p>}
      {canWrite ? (
        <>
          {unused.length ? <div className="flex flex-wrap gap-2 mt-4">{unused.slice(0, 4).map(([k, val, t]) => <button key={k + val} type="button" className="chip-q" onClick={() => add(k, val, t)}>+ {KINDS[k].l} {fmtNum(val, val % 1 ? 1 : 0)} {KINDS[k].u} → {t}</button>)}</div> : null}
          <form className="rw-form mt-3" onSubmit={(e) => { e.preventDefault(); add(kind, v, text); }}>
            <select className="select select-sm" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Şərt">{Object.entries(KINDS).map(([k, K]) => <option key={k} value={k}>{K.l}</option>)}</select>
            <input inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} placeholder={KINDS[kind].u} aria-label="Hədəf rəqəm" className="rw-v" />
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="mükafat: məs. yeni idman çantası" aria-label="Mükafat" className="rw-t" />
            <button type="submit" className="btn btn-primary" disabled={!v || !text.trim()}>Əlavə et</button>
          </form>
        </>
      ) : null}
    </Card>
  );
}

// ---------- 8. Paylaşma kartı ----------
let dlP = null;
const getDl = () => { if (!dlP) { const c = window.claude; dlP = c && typeof c.use === 'function' ? c.use('downloads').catch(() => null) : Promise.resolve(null); } return dlP; };

function drawCard(cv, { stats, ctx, badges }) {
  const W = 1080; const H = 1350; cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const grad = g.createLinearGradient(0, 0, W, H); grad.addColorStop(0, '#1f3bc2'); grad.addColorStop(1, '#0b1a5e');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 52; i++) g.fillRect(80 + i * 17.3, 1180, 12, 40);
  g.fillStyle = '#ff6a4d'; for (let i = 0; i < Math.min(52, ctx.week || 0); i++) g.fillRect(80 + i * 17.3, 1180, 12, 40);
  const D = '"Unbounded", "Plus Jakarta Sans", sans-serif'; const B = '"Plus Jakarta Sans", sans-serif';
  g.fillStyle = '#cdd6ff'; g.font = `700 34px ${B}`; g.fillText('PRIME İLİ · 1 İLLİK TRANSFORMASİYA', 80, 120);
  g.fillStyle = '#fff'; g.font = `700 96px ${D}`; g.fillText(`${ctx.week || 0}-cü həftə`, 80, 240);
  const dW = stats.curW - stats.startW; const dWa = stats.curWa - stats.startWa;
  const tile = (x, y, k, v, sub) => {
    g.fillStyle = 'rgba(255,255,255,0.10)'; g.beginPath(); g.roundRect ? g.roundRect(x, y, 440, 300, 36) : g.rect(x, y, 440, 300); g.fill();
    g.fillStyle = '#cdd6ff'; g.font = `700 30px ${B}`; g.fillText(k, x + 40, y + 70);
    let fs = 92; g.font = `700 ${fs}px ${D}`; while (g.measureText(v).width > 360 && fs > 48) { fs -= 4; g.font = `700 ${fs}px ${D}`; }
    g.fillStyle = '#fff'; g.fillText(v, x + 40, y + 190);
    g.fillStyle = '#cdd6ff'; g.font = `600 30px ${B}`; g.fillText(sub, x + 40, y + 250);
  };
  tile(80, 320, 'ÇƏKİ', `${dW > 0 ? '+' : ''}${fmtNum(dW)} kq`, `${fmtNum(stats.startW)} → ${fmtNum(stats.curW)} kq`);
  tile(560, 320, 'BEL', `${dWa > 0 ? '+' : ''}${fmtNum(dWa)} sm`, `${fmtNum(stats.startWa, 0)} → ${fmtNum(stats.curWa)} sm`);
  tile(80, 660, 'MƏŞQ', `${stats.workouts}`, 'tamamlanmış məşq');
  tile(560, 660, 'ARDICIL', `${stats.streak} gün`, 'ən uzun ✓ zənciri');
  g.fillStyle = '#fff'; g.font = `600 34px ${B}`;
  g.fillText(badges ? `🏆 ${badges}` : 'Hədəf: 85 kq · atletik görünüş', 80, 1060);
  g.fillStyle = '#cdd6ff'; g.font = `600 28px ${B}`; g.fillText(`${fmtDate(ctx.today)} ${ctx.today.getFullYear()}`, 80, 1280);
}

export function ShareCard({ stats, ctx }) {
  const [url, setUrl] = useState(null);
  const [dl, setDl] = useState(undefined);
  const [msg, setMsg] = useState(null);
  const [blob, setBlob] = useState(null);
  useEffect(() => { getDl().then(setDl); }, []);
  const make = async () => {
    try { await document.fonts.ready; } catch { /* */ }
    const cv = document.createElement('canvas');
    const badges = [stats.minW <= 91 ? '91 kq' : null, stats.minW < 90 ? '8x kq' : null, stats.streak >= 7 ? `${stats.streak} gün zəncir` : null].filter(Boolean).join(' · ');
    drawCard(cv, { stats, ctx, badges });
    cv.toBlob((b) => { if (!b) return; setBlob(b); if (url) URL.revokeObjectURL(url); setUrl(URL.createObjectURL(b)); }, 'image/png');
  };
  const save = async () => {
    setMsg(null);
    try { await dl.save({ filename: `prime-ili-hefte-${ctx.week || 0}.png`, data: blob }); setMsg('Şəkil yükləndi — Instagram və ya WhatsApp-da paylaş.'); } catch (e) { if (e && e.code !== 'declined') setMsg('Yükləmək alınmadı.'); }
  };
  return (
    <Card>
      <H2 sub="Nəticələrindən Instagram/WhatsApp üçün şəkil yaradır. Çəki rəqəmlərini istəmirsənsə paylaşmazdan əvvəl bax.">📤 Paylaşma kartı</H2>
      <div className="share">
        {url ? <img src={url} alt="Paylaşma kartı" className="share-img" /> : <div className="share-ph">Kart burada görünəcək</div>}
        <div className="grid gap-2 content-start">
          <button type="button" className="btn btn-primary" onClick={make}>{url ? 'Yenilə' : 'Kartı yarat'}</button>
          {url && dl ? <button type="button" className="btn btn-ghost" onClick={save}>PNG yüklə</button> : null}
          {url && !dl ? <p className="text-xs text-ink3">Telefonda şəklin üstünə uzun bas → «Şəkli saxla».</p> : null}
          {msg ? <p className="text-xs text-good">{msg}</p> : null}
        </div>
      </div>
    </Card>
  );
}
