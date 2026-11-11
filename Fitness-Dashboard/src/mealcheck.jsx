import { useSample, sampleErr } from './coach.jsx';
import { fmtInt } from './util.js';

const { useState, useEffect, useRef } = React;

// Öyün qeydi: plandakını yedim / başqa şey yedim (nə yediyini yaz) / yemədim.
// «Başqa şey» üçün Claude mətndən təxmini kalori hesablayır; plan öyününün kalorisindən
// çox deyilsə, gün qiymətində plana uyğun sayılır.
const OPTS = [['yes', '✓', 'Plandakını yedim', 'Yedim'], ['other', '↔', 'Başqa şey yedim', 'Başqa'], ['no', '✗', 'Yemədim', 'Yemədim']];
export const altOk = (kcal, planned) => kcal <= (planned || 0) * 1.2 + 30;

export function MealCheck({ i, d, planned, canLog, onPatch, short }) {
  const { fn, ready } = useSample();
  const v = ((d && d.meals) || {})[i] || null;
  const alt = ((d && d.mealAlt) || {})[i] || {};
  const [text, setText] = useState(alt.text || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setText(alt.text || ''); }, [alt.text]);

  const setV = (val) => onPatch((cur) => ({ meals: { ...(cur.meals || {}), [i]: val } }));
  const saveAlt = (patch) => onPatch((cur) => ({ mealAlt: { ...(cur.mealAlt || {}), [i]: { ...((cur.mealAlt || {})[i] || {}), ...patch } } }));
  const saveText = () => { const t = text.trim().slice(0, 200); if (t !== (alt.text || '')) saveAlt({ text: t, kcal: null, p: null, c: null, f: null, ok: null, note: null }); };
  const estimate = async () => {
    const t = text.trim().slice(0, 200);
    if (!t || !fn || busy) return;
    setErr(null); setBusy(true);
    try {
      const out = await fn.json(`İstifadəçi bir öyündə bunu yediyini yazıb (Azərbaycan mətbəxi ola bilər): "${t}". Miqdar yazılmayıbsa, böyük kişi üçün adi ev/restoran porsiyası götür. Təxmini qida dəyərini hesabla. Yalnız bu JSON ilə cavab ver: {"kcal":rəqəm,"p":protein_q,"c":karbohidrat_q,"f":yağ_q,"note":"porsiyanı necə qəbul etdiyin haqqında 1 qısa cümlə azərbaycanca"}. Mətn yemək deyilsə: {"error":"səbəb azərbaycanca"}.`, { modelTier: 'quick' });
      if (!out || out.error || !Number.isFinite(Number(out.kcal))) setErr((out && out.error) || 'Hesablamaq alınmadı — yeməyi bir az dəqiq yaz (məs. «1 boşqab plov, 2 dilim çörək»).');
      else {
        const kcal = Math.round(Number(out.kcal));
        saveAlt({ text: t, kcal, p: Math.round(Number(out.p) || 0), c: Math.round(Number(out.c) || 0), f: Math.round(Number(out.f) || 0), ok: altOk(kcal, planned && planned.kcal), note: String(out.note || '').slice(0, 160) });
      }
    } catch (e) { if (!e || e.code !== 'cancelled') setErr(sampleErr(e)); } finally { setBusy(false); }
  };
  const diff = alt.kcal != null && planned ? Math.round(alt.kcal - planned.kcal) : null;

  return (
    <div className={`mcheck ${short ? 'mcheck-s' : ''}`}>
      <div className="mcheck-btns" role="radiogroup" aria-label="Bu öyünü yedin?">
        {OPTS.map(([k, ic, long, sh]) => (
          <button key={k} type="button" role="radio" aria-checked={v === k} disabled={!canLog} className={v === k ? `on ${k}` : ''} onClick={() => setV(v === k ? null : k)}>
            <span aria-hidden="true">{ic}</span>{short ? sh : long}
          </button>
        ))}
      </div>
      {v === 'other' ? (
        <div className="mcheck-alt">
          <label className="mcheck-in">
            <span>Əvəzinə nə yedin?</span>
            <input value={text} maxLength={200} disabled={!canLog} placeholder="məs. 1 boşqab plov, 2 dilim qara çörək, ayran"
              onFocus={() => { focused.current = true; }} onChange={(e) => setText(e.target.value)} onBlur={() => { focused.current = false; saveText(); }} />
          </label>
          {alt.kcal != null ? (
            <p className={`mcheck-res ${alt.ok ? 'ok' : 'over'}`}>
              <b className="num">≈ {fmtInt(alt.kcal)} kcal</b> · protein {fmtInt(alt.p || 0)} q
              {diff != null ? <span> · plandakından {diff > 0 ? `${fmtInt(diff)} kcal çox` : diff < 0 ? `${fmtInt(-diff)} kcal az` : 'fərqi yoxdur'} — {alt.ok ? 'plana uyğun sayılır ✓' : 'plandan artıqdır ✗'}</span> : null}
              {alt.note ? <i>{alt.note}</i> : null}
            </p>
          ) : null}
          {canLog && ready && fn ? <button type="button" className="btn-xs btn-cobalt" onClick={estimate} disabled={busy || !text.trim()}>{busy ? 'Claude hesablayır…' : alt.kcal != null ? 'Yenidən hesabla' : 'Kalorini Claude hesablasın'}</button> : null}
          {ready && !fn ? <p className="text-xs text-ink3">Kalori hesablamaq üçün Claude bu görünüşdə əlçatan deyil — mətn yenə də saxlanır və məşqçi rəyində nəzərə alınır.</p> : null}
          {err ? <p className="form-msg err" role="status">{err}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
