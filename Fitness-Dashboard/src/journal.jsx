import { Card, H2, HowTo, Icon } from './ui.jsx';
import { OutFoodPicker } from './outfood.jsx';
import { MealPhoto, HealthShot } from './coach.jsx';
import { MEALS, WEEK_MENU } from './data/nutrition.js';
import { DOW_NAMES, toISO, fromISO, addDays, fmtDate, MONTHS, mondayOf, fmtInt, programWeek, weekContext, stepsTarget, planEaten, sumMacros } from './util.js';

const SUPPS = [['creatine', 'Kreatin 5 q'], ['vitd', 'D3 vitamini'], ['omega3', 'Omega-3'], ['magnesium', 'Maqnezium']];

const { useState, useMemo, useEffect, useRef } = React;

const TRAIN_DOW = [2, 4, 6];
const SWIM_HINT = 'Hovuz günü: indi B.e., yanvardan C.';
const MEAL_SHORT = ['Səhər', 'Nahar', 'Ara öyün', 'Şam', 'Gec öyün'];

// Günün nəticəsi: tətbiq olunan bəndlərin neçə faizi yerinə yetirilib.
// ✓/✗ yalnız ən azı MIN_ITEMS bənd doldurulanda verilir (tək bəndlə «uğurlu gün» olmur).
// Keçmiş məşq günündə məşq qeyd olunmayıbsa, «etmədim» sayılır.
export const MIN_ITEMS = 3;
export function dayScore(iso, d, targets) {
  if (!d) return null;
  const dow = fromISO(iso).getDay();
  const train = TRAIN_DOW.includes(dow);
  const items = [];
  if (d.sleep != null && d.sleep !== '') items.push(Number(d.sleep) >= 7);
  const meals = d.meals || {};
  const answered = [0, 1, 2, 3].filter((i) => meals[i] === 'yes' || meals[i] === 'no');
  if (answered.length) items.push(answered.filter((i) => meals[i] === 'yes').length / answered.length >= 0.75);
  if (d.water != null) items.push(Number(d.water) >= (train ? targets.glassesTrain : targets.glassesRest) - 2);
  if (d.steps) items.push(d.steps === 'yes');
  if (train) {
    if (d.train) items.push(d.train === 'yes');
    else if (items.length && iso < toISO(new Date())) items.push(false);
  }
  if (!items.length) return null;
  const ok = items.filter(Boolean).length / items.length;
  const thin = items.length < MIN_ITEMS;
  return { ok, pass: !thin && ok >= 0.75, thin, n: items.length };
}

// Mətn xanası: bazadan gələn dəyəri göstərir, yazarkən dəyişmir, xanadan çıxanda saxlayır
function NoteField({ id, value, onSave, placeholder }) {
  const [v, setV] = useState(value || '');
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setV(value || ''); }, [value]);
  return (
    <textarea id={id} rows="2" className="jtext" placeholder={placeholder} value={v} maxLength={400}
      onFocus={() => { focused.current = true; }}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { focused.current = false; if (v !== (value || '')) onSave(v.slice(0, 400)); }} />
  );
}

function Tri({ id, value, onChange, yes = 'Bəli', no = 'Xeyr' }) {
  return (
    <div className="tri" role="radiogroup" aria-labelledby={id}>
      <button type="button" role="radio" aria-checked={value === 'yes'} className={value === 'yes' ? 'on yes' : ''} onClick={() => onChange(value === 'yes' ? null : 'yes')}><Icon name="check" className="icon-sm" />{yes}</button>
      <button type="button" role="radio" aria-checked={value === 'no'} className={value === 'no' ? 'on no' : ''} onClick={() => onChange(value === 'no' ? null : 'no')}><Icon name="x" className="icon-sm" />{no}</button>
    </div>
  );
}

export function Journal({ ctx, targets, days, updateDay, menuOv, canWrite }) {
  const todayISO = toISO(ctx.today);
  const [sel, setSel] = useState(todayISO);
  const [month, setMonth] = useState(() => ({ y: ctx.today.getFullYear(), m: ctx.today.getMonth() }));
  const d = days[sel] || {};
  const selDate = fromISO(sel);
  const dow = selDate.getDay();
  const train = TRAIN_DOW.includes(dow);
  const menu = (menuOv && menuOv[dow]) || WEEK_MENU[dow];
  const future = sel > todayISO;
  const set = (patch) => updateDay(sel, patch);
  const start = ctx.startISO;
  const score = (iso) => (iso < start ? null : dayScore(iso, days[iso], targets));
  const preStart = sel < start;
  const stepsGoal = stepsTarget(weekContext(programWeek(start, selDate)).phase.n);

  // Ardıcıllıq: bu gündən (və ya dünəndən) geriyə ✓ olan günlər
  const stats = useMemo(() => {
    let streak = 0; let from = ctx.today;
    const s0 = score(todayISO);
    if (!s0 || !s0.pass) from = addDays(ctx.today, -1);
    for (let i = 0; i < 400; i++) {
      const iso = toISO(addDays(from, -i)); const sc = score(iso);
      if (sc && sc.pass) streak++; else break;
    }
    const mon = mondayOf(ctx.today); let wk = 0; let wkLogged = 0;
    for (let i = 0; i < 7; i++) { const iso = toISO(addDays(mon, i)); const sc = score(iso); if (sc && !sc.thin) { wkLogged++; if (sc.pass) wk++; } }
    const all = Object.keys(days).map((iso) => score(iso)).filter((x) => x && !x.thin);
    return { streak, wk, wkLogged, total: all.length, passed: all.filter((x) => x.pass).length };
  }, [days, targets, todayISO, start]);

  const first = new Date(month.y, month.m, 1);
  const lead = (first.getDay() + 6) % 7;
  const nDays = new Date(month.y, month.m + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: nDays }, (_, i) => new Date(month.y, month.m, i + 1))];
  const shift = (k) => setMonth(({ y, m }) => { const t = new Date(y, m + k, 1); return { y: t.getFullYear(), m: t.getMonth() }; });

  return (
    <div className="grid gap-5">
      <HowTo>Hər axşam günü qeyd et: yuxu, yeməklər, məşq, hovuz, su. Yaşıl <b>✓</b> — günün 75%-i plana uyğundur, qırmızı <b>✗</b> — az. Qiymət üçün ən azı <b>3 bənd</b> doldur (yuxu, yemək, su, addım, məşq); keçmiş məşq günündə məşq qeyd olunmayıbsa «etmədim» sayılır. Təqvimdə istənilən köhnə günə bas — o günün qeydi açılır və dəyişə bilərsən. Hər şey bulud yaddaşında saxlanır.</HowTo>

      <div className="jstats">
        <div className="js-main"><span className="js-v num">{stats.streak}</span><span className="js-k">gün ardıcıl ✓</span></div>
        <div><span className="js-v num">{stats.wk}/{stats.wkLogged || 0}</span><span className="js-k">bu həftə uğurlu gün</span></div>
        <div><span className="js-v num">{stats.total ? Math.round((stats.passed / stats.total) * 100) : 0}%</span><span className="js-k">bütün qeydlər ({stats.total} gün)</span></div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_1fr] items-start">
        <Card>
          <div className="flex items-center justify-between gap-2">
            <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Əvvəlki ay">‹</button>
            <h3 className="h3 capitalize">{MONTHS[month.m]} {month.y}</h3>
            <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Növbəti ay">›</button>
          </div>
          <div className="cal mt-3">
            {['B.e.', 'Ç.a.', 'Ç.', 'C.a.', 'C.', 'Ş.', 'B.'].map((x) => <span key={x} className="cal-h">{x}</span>)}
            {cells.map((c, i) => {
              if (!c) return <span key={'e' + i} />;
              const iso = toISO(c); const sc = score(iso);
              const cls = sc ? (sc.thin ? 'thin' : sc.pass ? 'pass' : 'fail') : '';
              return (
                <button key={iso} type="button" className={`cal-d ${cls} ${iso === sel ? 'sel' : ''} ${iso === todayISO ? 'today' : ''} ${TRAIN_DOW.includes(c.getDay()) && iso >= start ? 'tr' : ''} ${iso < start ? 'pre' : ''} ${iso === start ? 'start' : ''}`} onClick={() => setSel(iso)} aria-label={`${fmtDate(c)}${sc ? (sc.thin ? ', natamam qeyd' : sc.pass ? ', uğurlu' : ', uğursuz') : ''}`}>
                  <span className="cal-n num">{c.getDate()}</span>
                  <span className="cal-m">{sc ? (sc.thin ? '…' : sc.pass ? '✓' : '✗') : ''}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-ink2">
            <span className="inline-flex items-center gap-1"><i className="lg-dot pass" />✓ uğurlu</span>
            <span className="inline-flex items-center gap-1"><i className="lg-dot fail" />✗ zəif</span>
            <span className="inline-flex items-center gap-1"><i className="lg-dot tr" />məşq günü</span>
            <span className="inline-flex items-center gap-1"><i className="lg-dot start" />proqramın 1-ci günü</span>
          </div>
        </Card>

        <Card>
          <H2 sub={future ? 'Gələcək gündür — qeydi o gün doldur.' : preStart ? 'Proqramdan əvvəlki gün — qeyd edə bilərsən, amma ✓/✗ hesablanmır.' : (train ? 'Məşq günü' : 'İstirahət günü') + (canWrite ? ' · dəyişikliklər avtomatik saxlanır' : '')}>{DOW_NAMES[dow]}, {fmtDate(selDate)}{sel === todayISO ? ' — bu gün' : ''}</H2>
          {preStart ? <div className="jres pre">Proqram {fmtDate(fromISO(start))} başlayır — bu gün hesaba düşmür</div> : null}
          {(() => { const sc = score(sel); if (!sc) return null; return sc.thin ? <div className="jres pre">… Natamam qeyd: {sc.n}/{MIN_ITEMS} bənd — qiymət üçün ən azı {MIN_ITEMS} bənd doldur</div> : <div className={`jres ${sc.pass ? 'pass' : 'fail'}`}>{sc.pass ? '✓ Uğurlu gün' : '✗ Plandan geri qaldın'} · {Math.round(sc.ok * 100)}%</div>; })()}
          {(() => {
            const kT = train ? targets.train : targets.rest;
            const plan = planEaten(d, menu, kT); const extra = sumMacros((d.foods || []).map((f) => ({ kcal: f.kcal || 0, p: f.p || 0, c: f.c || 0, f: f.f || 0 })));
            if (!plan.kcal && !extra.kcal) return null;
            return <p className="jintake num">Günün təxmini cəmi: <b>{fmtInt(plan.kcal + extra.kcal)}</b> / {fmtInt(kT)} kcal · protein <b>{fmtInt(plan.p + extra.p)}</b> / {targets.protein} q <span>(«Yedim» işarələdiyin plan öyünləri {fmtInt(plan.kcal)} + əlavələr {fmtInt(extra.kcal)})</span></p>;
          })()}
          <fieldset className="jform" disabled={future || !canWrite}>
            <HealthShot iso={sel} stepsGoal={stepsGoal} disabled={future || !canWrite} onApply={(p) => set(p)} />
            <div className="jrow">
              <span className="jk" id="j-sleep">Yuxu (saat)</span>
              <div className="stepper">
                <button type="button" onClick={() => set({ sleep: Math.max(0, (Number(d.sleep) || 7) - 0.5) })} aria-label="Azalt">−</button>
                <span className="num">{d.sleep != null ? String(d.sleep).replace('.', ',') : '—'}</span>
                <button type="button" onClick={() => set({ sleep: Math.min(14, (d.sleep != null ? Number(d.sleep) : 6.5) + 0.5) })} aria-label="Artır">+</button>
              </div>
              <span className="text-xs text-ink3">hədəf 7,5–9 · ✓ üçün ən azı 7</span>
            </div>
            <div className="jrow jrow-top">
              <span className="jk">Yeməklər (plana uyğun yedin?)</span>
              <ul className="grid gap-2 w-full">
                {MEALS.map((m, i) => (
                  <li key={m.id} className="jmeal">
                    <span className="min-w-0"><b className="text-ink text-sm">{MEAL_SHORT[i]}</b><span className="block text-xs text-ink3">{m.options[Math.min(menu[i] ?? 0, m.options.length - 1)].name}</span></span>
                    <Tri id={`j-meal-${i}`} value={(d.meals || {})[i] || null} onChange={(v) => set({ meals: { ...(d.meals || {}), [i]: v } })} yes="Yedim" no="Yemədim" />
                  </li>
                ))}
              </ul>
            </div>
            <label className="jrow jrow-top" htmlFor="j-ate">
              <span className="jk">Başqa nə yedim?</span>
              <NoteField key={sel + 'ate'} id="j-ate" value={d.ate} placeholder="məs. qonaqlıqda plov, 2 dilim paxlava" onSave={(x) => set({ ate: x })} />
            </label>
            <details className="jrow jrow-top jout">
              <summary className="jk">+ Bayırda yedim (şəkil çək və ya siyahıdan seç)</summary>
              <MealPhoto disabled={future || !canWrite} onAdd={(x) => updateDay(sel, (cur) => ({ foods: [...(cur.foods || []), x] }))} />
              <OutFoodPicker disabled={future || !canWrite} onAdd={(x) => updateDay(sel, (cur) => ({ foods: [...(cur.foods || []), x] }))} />
            </details>
            {train ? (
              <div className="jrow"><span className="jk" id="j-train">Məşq etdim</span><Tri id="j-train" value={d.train || null} onChange={(v) => set({ train: v })} yes="Etdim" no="Etmədim" /></div>
            ) : null}
            <div className="jrow"><span className="jk" id="j-swim">Hovuza getdim</span><Tri id="j-swim" value={d.swim || null} onChange={(v) => set({ swim: v })} yes="Getdim" no="Yox" /><span className="text-xs text-ink3">{SWIM_HINT}</span></div>
            <div className="jrow"><span className="jk" id="j-steps">Addım</span>
              <label className="jnum"><input type="number" inputMode="numeric" min="0" max="80000" step="100" placeholder="məs. 8 340" defaultValue={d.stepsN ?? ''} key={sel + 'steps' + (d.stepsN ?? '')} onBlur={(e) => { const v = e.target.value === '' ? null : Math.max(0, Math.round(Number(e.target.value))); if (v !== (d.stepsN ?? null)) set(v == null ? { stepsN: null } : { stepsN: v, steps: v >= stepsGoal ? 'yes' : 'no' }); }} aria-label="Addım sayı" /><span>addım</span></label>
              <Tri id="j-steps" value={d.steps || null} onChange={(v) => set({ steps: v })} yes="Hədəf ✓" no="Az" />
              <span className="text-xs text-ink3">hədəf {fmtInt(stepsGoal)}{d.hrRest ? ` · nəbz ${d.hrRest}` : ''}{d.activeMin ? ` · aktiv ${d.activeMin} dəq` : ''}</span>
            </div>
            <div className="jrow"><span className="jk">Əlavələr</span>
              <div className="supps">{SUPPS.map(([k, l]) => { const on = !!(d.supp || {})[k]; return <button key={k} type="button" className={on ? 'on' : ''} aria-pressed={on} onClick={() => updateDay(sel, (cur) => ({ supp: { ...(cur.supp || {}), [k]: !on } }))}>{on ? '✓ ' : ''}{l}</button>; })}</div>
            </div>
            <div className="jrow">
              <span className="jk">Su (stəkan)</span>
              <div className="stepper">
                <button type="button" onClick={() => set({ water: Math.max(0, (Number(d.water) || 0) - 1) })} aria-label="Azalt">−</button>
                <span className="num">{d.water != null ? d.water : 0}</span>
                <button type="button" onClick={() => set({ water: (Number(d.water) || 0) + 1 })} aria-label="Artır">+</button>
              </div>
              <span className="text-xs text-ink3">hədəf {train ? targets.glassesTrain : targets.glassesRest}</span>
            </div>
            {d.foods && d.foods.length ? (
              <div className="jrow jrow-top"><span className="jk">Əlavə yediklərim · {fmtInt(d.foods.reduce((a, f) => a + (f.kcal || 0), 0))} kcal</span>
                <ul className="jfoods">{d.foods.map((f) => <li key={f.id}><span className="min-w-0">{f.name}</span><b className="num">{fmtInt(f.kcal)}</b>{canWrite && !future ? <button type="button" className="icon-btn" aria-label={`${f.name} sil`} onClick={() => updateDay(sel, (cur) => ({ foods: (cur.foods || []).filter((x) => x.id !== f.id) }))}><Icon name="x" className="icon-sm" /></button> : null}</li>)}</ul>
              </div>
            ) : null}
            <label className="jrow jrow-top" htmlFor="j-note">
              <span className="jk">Qeyd</span>
              <NoteField key={sel + 'note'} id="j-note" value={d.note} placeholder="özümü necə hiss etdim, nə çətin oldu" onSave={(x) => set({ note: x })} />
            </label>
          </fieldset>
          {!canWrite ? <p className="text-xs text-ink3 mt-2">Bu görünüşdə qeyd etmək mümkün deyil.</p> : null}
        </Card>
      </div>
    </div>
  );
}
