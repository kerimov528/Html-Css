import { Card, H2, Icon } from './ui.jsx';
import { toISO, fromISO, fmtDate, fmtNum } from './util.js';

const { useState, useMemo } = React;

// Ümumi böyük yaşlı istinad aralıqları — laboratoriyadan asılı olaraq bir qədər fərqlənə bilər.
// rate(v) → 'ok' | 'warn' | 'bad'
const LABS = [
  { k: 'hba1c', n: 'HbA1c (qlikoliz. hemoqlobin)', u: '%', ref: '< 5,7', rate: (v) => (v < 5.7 ? 'ok' : v < 6.5 ? 'warn' : 'bad'), why: 'Son 3 ayın orta şəkəri. Bel/boy 0,6 olanda vacibdir.' },
  { k: 'glu', n: 'Aclıq qlükozası', u: 'mmol/L', ref: '3,9–5,5', rate: (v) => (v < 5.6 ? 'ok' : v < 7 ? 'warn' : 'bad') },
  { k: 'chol', n: 'Ümumi xolesterin', u: 'mmol/L', ref: '< 5,2', rate: (v) => (v < 5.2 ? 'ok' : v < 6.2 ? 'warn' : 'bad') },
  { k: 'ldl', n: 'LDL («pis» xolesterin)', u: 'mmol/L', ref: '< 3,0', rate: (v) => (v < 3 ? 'ok' : v < 4.1 ? 'warn' : 'bad') },
  { k: 'hdl', n: 'HDL («yaxşı» xolesterin)', u: 'mmol/L', ref: '> 1,0', rate: (v) => (v > 1 ? 'ok' : v > 0.9 ? 'warn' : 'bad'), why: 'Məşq və arıqlama ilə adətən artır.' },
  { k: 'tg', n: 'Triqliseridlər', u: 'mmol/L', ref: '< 1,7', rate: (v) => (v < 1.7 ? 'ok' : v < 2.3 ? 'warn' : 'bad'), why: 'Qarın piyi azaldıqca ən tez düşən göstəricidir.' },
  { k: 'alt', n: 'ALT (qaraciyər)', u: 'U/L', ref: '< 40', rate: (v) => (v < 41 ? 'ok' : v < 80 ? 'warn' : 'bad'), why: 'Yüksəkdirsə, çox vaxt qaraciyər piylənməsinin əlamətidir.' },
  { k: 'vitd', n: 'D vitamini 25(OH)', u: 'ng/mL', ref: '30–100', rate: (v) => (v >= 30 && v <= 100 ? 'ok' : v >= 20 ? 'warn' : 'bad'), why: 'Qışda əksəriyyətdə aşağı olur.' },
];
const BP = { n: 'Arterial təzyiq', ref: '< 120/80', rate: (s, d) => (s < 120 && d < 80 ? 'ok' : s < 140 && d < 90 ? 'warn' : 'bad') };
const TONE = { ok: 'normada', warn: 'sərhəddə', bad: 'yüksək/aşağı' };

const num = (x) => { const v = parseFloat(String(x).replace(',', '.')); return Number.isFinite(v) ? v : null; };

export function Health({ store, records = [] }) {
  const [tab, setTab] = useState('bp');
  const [date, setDate] = useState(toISO(new Date()));
  const [f, setF] = useState({});
  const [msg, setMsg] = useState(null);
  const canWrite = !!store && store.canWrite;
  const sorted = useMemo(() => [...records].sort((a, b) => ((a.date || '') < (b.date || '') ? 1 : -1)), [records]);
  const labs = sorted.filter((r) => r.kind === 'lab');
  const bps = sorted.filter((r) => r.kind === 'bp');

  const save = async (e) => {
    e.preventDefault(); setMsg(null);
    const values = {};
    if (tab === 'bp') { const s = num(f.sys); const d = num(f.dia); if (!s || !d) { setMsg({ t: 'err', x: 'Yuxarı və aşağı təzyiqi yaz.' }); return; } values.sys = s; values.dia = d; if (num(f.pulse)) values.pulse = num(f.pulse); }
    else { LABS.forEach((l) => { const v = num(f[l.k]); if (v != null) values[l.k] = v; }); if (!Object.keys(values).length) { setMsg({ t: 'err', x: 'Ən azı bir göstərici yaz.' }); return; } }
    try { await store.add('health', { kind: tab === 'bp' ? 'bp' : 'lab', date, values, note: (f.note || '').slice(0, 200), createdAt: new Date().toISOString() }); setF({}); setMsg({ t: 'ok', x: 'Yadda saxlandı.' }); } catch { setMsg({ t: 'err', x: 'Saxlamaq alınmadı.' }); }
  };
  const del = async (id) => { try { await store.remove('health', id); } catch { /* */ } };

  return (
    <Card>
      <H2 sub="Bu izləyici həkimi əvəz etmir: rəqəmləri həkimlə birlikdə qiymətləndir. İstinad aralıqları ümumi böyük yaşlılar üçündür və laboratoriyaya görə bir az fərqlənə bilər.">🩺 Sağlamlıq göstəriciləri</H2>
      <div className="hl-todo">
        <b className="text-ink text-sm">Başlanğıcda bir dəfə yoxlat (6-cı ayda təkrarla):</b>
        <span>HbA1c · aclıq qlükozası · lipid profili (xolesterin, LDL, HDL, triqliserid) · ALT · D vitamini · təzyiq. Analizə səhər, 10–12 saat ac qarına get.</span>
      </div>
      <div className="seg seg-sm mt-4" role="tablist" aria-label="Növ">
        <button type="button" role="tab" aria-selected={tab === 'bp'} className={tab === 'bp' ? 'on' : ''} onClick={() => { setTab('bp'); setF({}); }}>Təzyiq</button>
        <button type="button" role="tab" aria-selected={tab === 'lab'} className={tab === 'lab' ? 'on' : ''} onClick={() => { setTab('lab'); setF({}); }}>Qan analizi</button>
      </div>
      <form className="hl-form mt-3" onSubmit={save}>
        <label className="field"><span>Tarix</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        {tab === 'bp' ? (
          <>
            <label className="field"><span>Yuxarı (sistolik)</span><input inputMode="numeric" placeholder="məs. 125" value={f.sys || ''} onChange={(e) => setF({ ...f, sys: e.target.value })} /></label>
            <label className="field"><span>Aşağı (diastolik)</span><input inputMode="numeric" placeholder="məs. 80" value={f.dia || ''} onChange={(e) => setF({ ...f, dia: e.target.value })} /></label>
            <label className="field"><span>Nəbz</span><input inputMode="numeric" placeholder="istəyə görə" value={f.pulse || ''} onChange={(e) => setF({ ...f, pulse: e.target.value })} /></label>
          </>
        ) : LABS.map((l) => (
          <label key={l.k} className="field"><span>{l.n} <i className="hl-u">{l.u} · norma {l.ref}</i></span><input inputMode="decimal" value={f[l.k] || ''} onChange={(e) => setF({ ...f, [l.k]: e.target.value })} /></label>
        ))}
        <label className="field hl-note"><span>Qeyd</span><input value={f.note || ''} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder={tab === 'bp' ? 'məs. səhər, oturaraq, 5 dəq istirahətdən sonra' : 'məs. laboratoriya adı'} /></label>
        <button type="submit" className="btn btn-primary self-end" disabled={!canWrite}>Yadda saxla</button>
      </form>
      {msg ? <p className={`form-msg ${msg.t} mt-2`} role="status">{msg.x}</p> : null}
      {tab === 'bp' ? <p className="text-xs text-ink3 mt-2">Düzgün ölçmə: 5 dəq otur, qol ürək səviyyəsində, qəhvə və siqaretdən 30 dəq sonra. 2 dəfə ölç, ortasını yaz. 140/90-dan yuxarı təkrarlanırsa — həkimə.</p> : null}

      <div className="mt-5 grid gap-4">
        {tab === 'bp' ? (
          bps.length ? (
            <div className="tbl-wrap"><table className="tbl tbl-tight">
              <thead><tr><th>Tarix</th><th className="r">Təzyiq</th><th className="r">Nəbz</th><th>Qiymət</th><th aria-label="Sil" /></tr></thead>
              <tbody>{bps.map((r) => { const t = BP.rate(r.values.sys, r.values.dia); return (
                <tr key={r.id}><td>{r.date ? fmtDate(fromISO(r.date)) : ''}{r.note ? <span className="block text-xs text-ink3">{r.note}</span> : null}</td><td className="r num"><b>{r.values.sys}/{r.values.dia}</b></td><td className="r num">{r.values.pulse || '—'}</td><td><span className={`hl-tag ${t}`}>{TONE[t]}</span></td><td className="r">{canWrite ? <button type="button" className="icon-btn" aria-label="Sil" onClick={() => del(r.id)}><Icon name="x" /></button> : null}</td></tr>
              ); })}</tbody>
            </table></div>
          ) : <p className="text-sm text-ink3">Hələ təzyiq qeydi yoxdur. Norma: {BP.ref}.</p>
        ) : (
          labs.length ? labs.map((r, i) => {
            const prev = labs[i + 1];
            return (
              <div key={r.id} className="hl-lab">
                <div className="flex items-baseline justify-between gap-2"><b className="text-ink">{r.date ? fmtDate(fromISO(r.date)) + ' ' + fromISO(r.date).getFullYear() : ''}</b>{canWrite ? <button type="button" className="icon-btn" aria-label="Sil" onClick={() => del(r.id)}><Icon name="x" /></button> : null}</div>
                <ul className="hl-vals">{LABS.filter((l) => r.values[l.k] != null).map((l) => { const v = r.values[l.k]; const t = l.rate(v); const pv = prev && prev.values[l.k]; return (
                  <li key={l.k}><span className="min-w-0">{l.n}{l.why ? <i className="block text-xs text-ink3">{l.why}</i> : null}</span><b className="num">{fmtNum(v, v % 1 ? 1 : 0)} <i className="hl-u">{l.u}</i>{pv != null ? <i className="hl-d"> ({v - pv > 0 ? '+' : ''}{fmtNum(v - pv, 1)})</i> : null}</b><span className={`hl-tag ${t}`}>{TONE[t]}</span></li>
                ); })}</ul>
                {r.note ? <p className="text-xs text-ink3 mt-1">{r.note}</p> : null}
              </div>
            );
          }) : <p className="text-sm text-ink3">Hələ analiz nəticəsi yoxdur.</p>
        )}
      </div>
    </Card>
  );
}
