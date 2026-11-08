import { Card, H2, Pill } from './ui.jsx';
import { GYMS, WORK, HOME, GYMS_ASOF } from './data/gyms.js';
import { fmtNum, fromISO, fmtDate } from './util.js';

const { useState } = React;

const walkMin = (km) => Math.max(2, Math.round((km * 1.3 / 4.8) * 60));
const driveMin = (km) => Math.max(3, Math.round((km * 1.4 / 24) * 60));
const byId = (id) => GYMS.find((g) => g.id === id);
const defaults = () => ({ work: (GYMS.find((g) => g.rec === 'work') || {}).id, home: (GYMS.find((g) => g.rec === 'home') || {}).id, pool: (GYMS.find((g) => g.rec === 'pool_home') || {}).id });
export function chosenGyms(sel) { const d = defaults(); const s = sel || {}; return { work: byId(s.work || d.work), home: byId(s.home || d.home), pool: byId(s.pool || d.pool) }; }

const mapUrl = (from, g, mode) => `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${g.lat},${g.lng}&travelmode=${mode}`;
export function GymLine({ g, from = 'work' }) {
  if (!g) return null;
  const isWork = from === 'work';
  const km = isWork ? g.w : g.h;
  return (
    <p className="gym-line">
      📍 <b>{g.n}</b> · {isWork ? `işdən piyada ~${walkMin(km)} dəq` : `evdən maşınla ~${driveMin(km)} dəq`} · <a href={mapUrl(isWork ? WORK : HOME, g, isWork ? 'walking' : 'driving')} target="_blank" rel="noopener noreferrer">Yol göstər</a>
    </p>
  );
}

const SLOTS = [
  { k: 'work', t: 'İş günləri (Ç.a., C.a. 18:30)', from: 'work', filter: (g) => g.gym && g.w <= 2.6, sort: (a, b) => a.w - b.w },
  { k: 'home', t: 'Şənbə (evdən, 11:00)', from: 'home', filter: (g) => g.gym && g.h <= 7.5, sort: (a, b) => a.h - b.h },
  { k: 'pool', t: 'Hovuz günü', from: 'home', filter: (g) => g.pool, sort: (a, b) => Math.min(a.w, a.h) - Math.min(b.w, b.h) },
];

export function Gyms({ sel, saveSettings, canWrite }) {
  const [tab, setTab] = useState('work');
  const ch = chosenGyms(sel);
  const slot = SLOTS.find((s) => s.k === tab);
  const list = GYMS.filter(slot.filter).sort(slot.sort);
  const pick = (k, id) => saveSettings({ gyms: { ...(sel || {}), [k]: id } });
  return (
    <Card>
      <H2 sub={`Push 30 «Standart» paketinə daxil olan zallar — push30.az rəsmi siyahısı (${fmtDate(fromISO(GYMS_ASOF))}). İş yeri: ${WORK.n}. Ev: ${HOME.n}. Məsafələr düz xətlədir, yol bir az uzun ola bilər.`}>🏋️ Zallarım</H2>
      <div className="gym-pick">
        {SLOTS.map((s) => {
          const g = ch[s.k]; const km = g ? (s.from === 'work' ? g.w : g.h) : 0;
          const near = g && s.k === 'pool' ? (g.w < g.h ? 'work' : 'home') : s.from;
          return (
            <div key={s.k} className={`gp ${tab === s.k ? 'on' : ''}`}>
              <span className="gp-k">{s.t}</span>
              {g ? <>
                <b className="gp-n">{g.n}</b>
                <span className="gp-d">{near === 'work' ? `işdən ${fmtNum(g.w)} km · piyada ~${walkMin(g.w)} dəq` : `evdən ${fmtNum(g.h)} km · maşınla ~${driveMin(g.h)} dəq`}</span>
                {g.note ? <span className="gp-note">{g.note}</span> : null}
                <span className="flex gap-2 mt-2 flex-wrap">
                  <a className="btn-xs" href={mapUrl(near === 'work' ? WORK : HOME, g, near === 'work' ? 'walking' : 'driving')} target="_blank" rel="noopener noreferrer">Xəritədə yol</a>
                  <button type="button" className="btn-xs" onClick={() => setTab(s.k)}>Dəyiş</button>
                </span>
              </> : <span className="text-sm text-ink3">seçilməyib</span>}
            </div>
          );
        })}
      </div>

      <div className="seg seg-sm mt-5" role="tablist" aria-label="Siyahı">
        {SLOTS.map((s) => <button key={s.k} type="button" role="tab" aria-selected={tab === s.k} className={tab === s.k ? 'on' : ''} onClick={() => setTab(s.k)}>{s.k === 'work' ? 'İşə yaxın' : s.k === 'home' ? 'Evə yaxın' : 'Hovuzlar'}</button>)}
      </div>
      <ul className="gym-list mt-3">
        {list.map((g) => {
          const isSel = ch[tab] && ch[tab].id === g.id;
          const near = tab === 'pool' ? (g.w < g.h ? 'work' : 'home') : slot.from;
          return (
            <li key={g.id} className={isSel ? 'sel' : ''}>
              <div className="min-w-0">
                <b className="text-ink">{g.n}</b>{g.rec && ((tab === 'work' && g.rec.startsWith('work')) || (tab === 'home' && g.rec === 'home') || (tab === 'pool' && g.rec.startsWith('pool'))) ? <Pill tone="good" className="ml-2">tövsiyə</Pill> : null}
                <span className="block text-xs text-ink3">{near === 'work' ? `işdən ${fmtNum(g.w)} km · ~${walkMin(g.w)} dəq piyada` : `evdən ${fmtNum(g.h)} km · ~${driveMin(g.h)} dəq maşınla`}{g.t.length ? ` · ${g.t.join(', ')}` : ''}</span>
                {g.note ? <span className="block text-xs text-ink2 mt-0.5">{g.note}</span> : null}
              </div>
              <span className="flex gap-2 items-center flex-none">
                <a className="btn-xs" href={mapUrl(near === 'work' ? WORK : HOME, g, near === 'work' ? 'walking' : 'driving')} target="_blank" rel="noopener noreferrer">Xəritə</a>
                {canWrite ? <button type="button" className={`btn-xs ${isSel ? 'btn-cobalt' : ''}`} onClick={() => pick(tab, g.id)} disabled={isSel}>{isSel ? 'Seçilib ✓' : 'Seç'}</button> : null}
              </span>
            </li>
          );
        })}
      </ul>
      <details className="disclose mt-4">
        <summary>İlk gəlişdə nəyi yoxlamalı (proqram üçün lazım olan alətlər)</summary>
        <ul className="grid gap-1 mt-2 text-sm text-ink2">
          <li>✓ Ayaq pressi (45°) və ya hak squat · bud bükmə/açma trenajoru</li>
          <li>✓ Kabel (blok) stansiyası: üst blok, aşağı blok, krossover</li>
          <li>✓ Smit maşını, düz və maili skamya, 30 kq-a qədər hantellər</li>
          <li>✓ Sinə pressi və ya pek-dek trenajoru · baldır trenajoru</li>
          <li>✓ İş saatları: iş günü 18:30–20:00 və şənbə 11:00 açıqdır?</li>
          <li>✓ Push 30 QR girişi işləyir (resepsiyada tətbiqdəki QR kodu göstər)</li>
        </ul>
        <p className="text-xs text-ink3 mt-2">Partnyor siyahısı dəyişə bilər — getməzdən əvvəl Push 30 tətbiqində zalın «Standart» olduğunu yoxla. İş saatlarını yalnız Fitway Gym üçün təsdiqləmişəm (07:00–23:00); digərlərini zəng edib dəqiqləşdir.</p>
      </details>
    </Card>
  );
}
