import { Card, H2, Eyebrow, Segmented, Pill, Icon, Bar, HowTo } from './ui.jsx';
import { FOODS, MEALS, FOOD_RULES } from './data/nutrition.js';
import { mealItems, sumMacros, macrosOf, fmtInt, fmtNum, lsGet, lsSet, toISO } from './util.js';

const { useState, useMemo, useEffect } = React;

const PICK_KEY = 'prime-ili:meal-picks';

function Macro({ k, v, unit = 'q', strong }) {
  return (
    <span className="macro">
      <span className="macro-k">{k}</span>
      <span className={`num ${strong ? 'text-ink font-semibold' : 'text-ink2'}`}>{fmtInt(v)}{unit === 'kcal' ? '' : ' '}{unit}</span>
    </span>
  );
}

export function Nutrition({ targets, ctx }) {
  const isTrainDay = [2, 4, 6].includes(ctx.today.getDay());
  const [dayType, setDayType] = useState(isTrainDay ? 'train' : 'rest');
  const [picks, setPicks] = useState(() => lsGet(PICK_KEY, {}));
  const [includeLate, setIncludeLate] = useState(true);
  const rest = dayType === 'rest';

  const pick = (mealId, i) => { const n = { ...picks, [mealId]: i }; setPicks(n); lsSet(PICK_KEY, n); };

  const total = useMemo(() => sumMacros(
    MEALS.filter((m) => includeLate || !m.optional).map((m) => sumMacros(mealItems(m.options[picks[m.id] || 0], rest))),
  ), [picks, rest, includeLate]);

  const kTarget = rest ? targets.rest : targets.train;
  const cTarget = rest ? targets.carbsRest : targets.carbsTrain;

  return (
    <div className="grid gap-5">
      <HowTo>Hər öyündə <b>variant düyməsinə bas</b> (Əsas, Alt 1, Alt 2…) — cədvəl və günün cəmi dərhal dəyişir. Bu gün istirahət günüdürsə, yuxarıda <b>«İstirahət günü»</b> seç. Aşağıda: olar/olmaz siyahısı və <b>kalori hesablayıcı</b>.</HowTo>
      <Card className="sticky-sum">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Eyebrow>Seçdiyin variantlarla bu gün</Eyebrow>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-1">
              <span><span className="display-num text-ink">{fmtInt(total.kcal)}</span><span className="text-ink3 num"> / {fmtInt(kTarget)} kcal</span></span>
              <Macro k="P" v={total.p} strong />
              <Macro k="K" v={total.c} />
              <Macro k="Y" v={total.f} />
            </div>
          </div>
          <Segmented label="Gün növü" value={dayType} onChange={setDayType} options={[{ value: 'train', label: 'Məşq günü' }, { value: 'rest', label: 'İstirahət günü' }]} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <MacroBar k="Kalori" v={total.kcal} t={kTarget} unit="kcal" />
          <MacroBar k="Protein" v={total.p} t={targets.protein} />
          <MacroBar k="Karbohidrat" v={total.c} t={cTarget} />
          <MacroBar k="Yağ" v={total.f} t={targets.fat} />
        </div>
        {rest ? <p className="text-xs text-ink3 mt-2">İstirahət günü: düyü, kartof, çörək, yulaf və banan porsiyaları avtomatik 25% azaldılıb.</p> : null}
      </Card>

      <WaterCard targets={targets} rest={rest} />

      <Card>
        <H2 sub="Hər öyündə variant seç — gündəlik cəm yuxarıda yenilənir. Hamısı halal, evdə ailənin bişirə biləcəyi yeməklərdir. Çəkilər bişmiş məhsul üçündür (qeyd olunmayıbsa).">Gündəlik qida planı</H2>
        <ol className="grid gap-4">
          {MEALS.map((m) => {
            const idx = picks[m.id] || 0;
            const opt = m.options[idx];
            const items = mealItems(opt, rest);
            const sum = sumMacros(items);
            const off = m.optional && !includeLate;
            return (
              <li key={m.id} className={`meal ${off ? 'meal-off' : ''}`}>
                <div className="meal-head">
                  <span className="meal-time num">{m.time}</span>
                  <div className="min-w-0">
                    <h3 className="h3">{m.name}</h3>
                    <span className="text-xs text-ink3">{m.where}</span>
                  </div>
                  <div className="meal-sum num">
                    <b>{fmtInt(sum.kcal)}</b> kcal · P {fmtInt(sum.p)} q
                  </div>
                </div>
                <div className="opt-k-label">Variant seç:</div>
                <div className="opt-tabs" role="tablist" aria-label={`${m.name} variantları`}>
                  {m.options.map((o, i) => (
                    <button key={o.name} type="button" role="tab" aria-selected={i === idx} className={i === idx ? 'on' : ''} onClick={() => pick(m.id, i)}>
                      <span className="opt-k">{i === 0 ? 'Əsas' : `Alt ${i}`}</span>{o.name}
                    </button>
                  ))}
                </div>
                <div className="grid md:grid-cols-[1fr_240px] gap-3 mt-3">
                  <table className="tbl tbl-tight">
                    <thead><tr><th>Məhsul</th><th className="r">Porsiya</th><th className="r">kcal</th><th className="r">P</th></tr></thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.id}>
                          <td>{FOODS[it.id].n}{it.flex && rest ? <span className="text-ink3"> · azaldılıb</span> : null}</td>
                          <td className="r num">{it.grams} q</td>
                          <td className="r num">{fmtInt(it.kcal)}</td>
                          <td className="r num">{fmtInt(it.p)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="tip"><b>Evdə:</b> {opt.tip}</p>
                </div>
                {m.optional ? (
                  <label className="check-inline mt-2">
                    <input id="late-toggle" type="checkbox" checked={includeLate} onChange={(e) => setIncludeLate(e.target.checked)} />
                    <span>Bu öyünü cəmə daxil et (acsansa və ya protein çatmırsa)</span>
                  </label>
                ) : null}
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <RuleCard kind="yes" icon="check" />
        <RuleCard kind="limit" icon="tilde" />
        <RuleCard kind="no" icon="x" />
      </div>

      <Calculator targets={targets} rest={rest} />

      <Card>
        <H2>Ailə mətbəxi üçün 6 vərdiş</H2>
        <ul className="habits">
          <li><b>Yağı qaşıqla ölç.</b> 1 xörək qaşığı yağ = 90 kcal. Göz qarışıq tökülən yağ günə 300–400 kcal əlavə edir.</li>
          <li><b>Boşqab qaydası.</b> Yarısı tərəvəz və göyərti, dörddə biri protein, dörddə biri düyü və ya kartof.</li>
          <li><b>Çay mədəniyyəti.</b> Şəkərsiz iç; şirin istəyəndə 1 finik və ya 1 çay qaşığı mürəbbə.</li>
          <li><b>Çörəyi say.</b> Süfrədə çörək sərbəst yeyilir — gündə 2–3 dilimlə məhdudlaş.</li>
          <li><b>Bazar hazırlığı.</b> Ailə ilə həftəlik menyu: 1 kq toyuq döşü, 1 qazan qarabaşaq, 2 gün üçün salat.</li>
          <li><b>Qonaqlıq və toy.</b> Əvvəlcə ət və salat, sonra plov — kiçik porsiya. Şirniyyatdan 1 ədəd.</li>
        </ul>
      </Card>
    </div>
  );
}

const WATER_PLAN = [
  ['07:00', 'Oyananda', 2], ['07:30', 'Səhər yeməyi ilə', 1], ['09–13', 'İşdə, saatda bir', 3], ['13:00', 'Naharla', 1],
  ['13–17:30', 'İşdə, saatda bir', 3], ['18:30–19:45', 'Məşqdə, qurtum-qurtum', 3, true], ['20:30', 'Şam yeməyi ilə', 1], ['21:30', 'Axşam', 1],
];

function Glass({ on, onClick, i }) {
  return (
    <button type="button" className={`glass ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on} aria-label={`${i + 1}-ci stəkan`}>
      <svg viewBox="0 0 24 28" aria-hidden="true">
        <path d="M4 3h16l-1.8 20.2a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8z" className="glass-body" />
        <path d="M5.4 11h13.2l-1.1 12.1a1.4 1.4 0 0 1-1.4 1.2H7.9a1.4 1.4 0 0 1-1.4-1.2z" className="glass-water" />
      </svg>
    </button>
  );
}

function WaterCard({ targets, rest }) {
  const key = `prime-ili:water:${toISO(new Date())}`;
  const [n, setN] = useState(() => lsGet(key, 0));
  useEffect(() => { lsSet(key, n); }, [n]);
  const goal = rest ? targets.glassesRest : targets.glassesTrain;
  const liters = rest ? targets.waterRest : targets.waterTrain;
  const slots = Math.max(goal, n);
  const plan = WATER_PLAN.filter((r) => !(rest && r[3]));
  const planTotal = plan.reduce((a, r) => a + r[2], 0);
  return (
    <Card>
      <H2 sub={`Çəkinə görə: hər kq üçün 33 ml${rest ? '' : ' + məşq günü 0,6 l'}. 1 stəkan = 250 ml (adi su stəkanı).`}
        right={<span className="water-goal"><b className="num">{goal}</b> stəkan · <span className="num">{fmtNum(liters)} l</span></span>}>
        Su — {rest ? 'istirahət günü' : 'məşq günü'}
      </H2>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="min-w-0">
          <div className="text-xs font-bold text-ink2 mb-2">Bu gün içdiyin stəkanlara toxun:</div>
          <div className="glasses" role="group" aria-label="Su izləyicisi">
            {Array.from({ length: slots }, (_, i) => (
              <Glass key={i} i={i} on={i < n} onClick={() => setN(i + 1 === n ? i : i + 1)} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="text-sm text-ink2"><b className="num text-ink">{n} / {goal}</b> stəkan · <span className="num">{fmtNum((n * 250) / 1000, n % 2 ? 2 : 1)} l</span> içilib</span>
            <span className="flex-1" />
            <button type="button" className="btn-xs btn-cobalt" onClick={() => setN(n + 1)}>+1 stəkan</button>
            {n ? <button type="button" className="btn-xs" onClick={() => setN(0)}>Sıfırla</button> : null}
          </div>
          {n >= goal ? <p className="form-msg ok mt-2">Bugünkü su hədəfi tamamdır.</p> : null}
          <ul className="list-dot mt-4">
            <li>Armudu çay stəkanı ≈ 100 ml-dir — su stəkanı ilə qarışdırma.</li>
            <li>Şəkərsiz çay və qəhvə maye sayılır, amma suyun yerini tutmur: gündə 4–5 stəkandan çox çay olmasın.</li>
            <li>İsti yay günlərində və hovuzdan sonra +2 stəkan.</li>
            <li>Yoxlama: sidik açıq saman rəngində olmalıdır. Tünd rəng = az su.</li>
            <li>Yatmazdan 1 saat əvvəl azalt ki, gecə yuxun pozulmasın.</li>
          </ul>
        </div>
        <div className="min-w-0">
          <h3 className="h4">Gün ərzində bölgü (təxmini)</h3>
          <ol className="water-plan mt-2">
            {plan.map(([t, x, c]) => (
              <li key={t}><span className="num tl-time">{t}</span><span>{x}</span><b className="num">{c} stəkan</b></li>
            ))}
          </ol>
          <p className="text-xs text-ink3 mt-2">Cəmi {planTotal} stəkan{planTotal !== goal ? ` — hədəfin ${goal}; fərqi gün ərzində tamamla` : ''}.</p>
        </div>
      </div>
    </Card>
  );
}

function MacroBar({ k, v, t, unit = 'q' }) {
  const pct = t ? Math.round((v / t) * 100) : 0;
  return (
    <div className="min-w-0">
      <div className="flex justify-between text-xs"><span className="text-ink2">{k}</span><span className="num text-ink3">{fmtInt(v)} / {fmtInt(t)} {unit}</span></div>
      <Bar value={v} max={t} label={`${k}: hədəfin ${pct}%-i`} />
    </div>
  );
}

function RuleCard({ kind, icon }) {
  const r = FOOD_RULES[kind];
  return (
    <Card className={`rule rule-${kind}`}>
      <h3 className="h3 flex items-center gap-2"><span className="rule-ic"><Icon name={icon} /></span>{r.title}</h3>
      <ul className="mt-3 grid gap-1.5">
        {r.items.map((x) => <li key={x} className="text-sm text-ink2">{x}</li>)}
      </ul>
    </Card>
  );
}

const GROUPS = [...new Set(Object.values(FOODS).map((f) => f.g))];

function Calculator({ targets, rest }) {
  const todayKey = `prime-ili:log:${toISO(new Date())}`;
  const [q, setQ] = useState('');
  const [foodId, setFoodId] = useState('chicken_breast');
  const [grams, setGrams] = useState('150');
  const [log, setLog] = useState(() => lsGet(todayKey, []));
  const [custom, setCustom] = useState({ n: '', k: '', p: '', c: '', f: '' });
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => { lsSet(todayKey, log); }, [log]);

  const list = useMemo(() => {
    const s = q.trim().toLocaleLowerCase('az');
    return Object.entries(FOODS).filter(([, f]) => !s || f.n.toLocaleLowerCase('az').includes(s));
  }, [q]);

  useEffect(() => {
    if (list.length && !list.some(([id]) => id === foodId)) setFoodId(list[0][0]);
  }, [list]);

  const g = Math.max(0, parseFloat(String(grams).replace(',', '.')) || 0);
  const preview = macrosOf(foodId, g);
  const totals = sumMacros(log);
  const kTarget = rest ? targets.rest : targets.train;

  const add = () => {
    if (!g || !FOODS[foodId]) return;
    setLog([...log, { id: Date.now(), name: FOODS[foodId].n, grams: g, ...preview }]);
  };
  const addCustom = () => {
    const num = (x) => Math.max(0, parseFloat(String(x).replace(',', '.')) || 0);
    if (!custom.n.trim() || !num(custom.k) || !g) return;
    const k = g / 100;
    setLog([...log, { id: Date.now(), name: custom.n.trim(), grams: g, kcal: num(custom.k) * k, p: num(custom.p) * k, c: num(custom.c) * k, f: num(custom.f) * k }]);
    setCustom({ n: '', k: '', p: '', c: '', f: '' });
  };

  return (
    <Card>
      <H2 sub="Bugünkü siyahı bu brauzerdə saxlanır və gecə yarısı sıfırlanır.">Kalori hesablayıcı</H2>
      <ol className="steps-inline mb-4">
        <li>Qidanı axtar</li><li>Siyahıdan seç</li><li>Qramı yaz</li><li>«Bugünə əlavə et»</li>
      </ol>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="grid gap-3 content-start">
          <div className="grid sm:grid-cols-[1fr_120px] gap-3">
            <label className="field">
              <span>Axtar</span>
              <input id="food-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="məs. toyuq, qarabaşaq, nar" autoComplete="off" />
            </label>
            <label className="field">
              <span>Qram</span>
              <input id="food-grams" type="number" inputMode="decimal" min="0" step="5" value={grams} onChange={(e) => setGrams(e.target.value)} />
            </label>
          </div>
          <label className="field">
            <span>Qida ({list.length})</span>
            <select id="food-select" value={foodId} onChange={(e) => setFoodId(e.target.value)} size={6} className="food-list">
              {GROUPS.map((grp) => {
                const opts = list.filter(([, f]) => f.g === grp);
                if (!opts.length) return null;
                return (
                  <optgroup key={grp} label={grp}>
                    {opts.map(([id, f]) => <option key={id} value={id}>{f.n} — {f.v[0]} kcal/100 q</option>)}
                  </optgroup>
                );
              })}
            </select>
          </label>
          <div className="calc-preview">
            <div className="min-w-0">
              <div className="text-xs text-ink3">{g} q · {FOODS[foodId] ? FOODS[foodId].n : '—'}</div>
              <div className="flex flex-wrap items-baseline gap-x-4">
                <span><span className="display-num text-ink">{fmtInt(preview.kcal)}</span> <span className="text-ink3">kcal</span></span>
                <Macro k="P" v={preview.p} strong /><Macro k="K" v={preview.c} /><Macro k="Y" v={preview.f} />
              </div>
            </div>
            <button type="button" className="btn btn-primary" onClick={add} disabled={!g}><Icon name="plus" />Bugünə əlavə et</button>
          </div>
          <button type="button" className="link-strong text-sm justify-self-start" onClick={() => setShowCustom(!showCustom)} aria-expanded={showCustom}>
            {showCustom ? 'Öz qidanı gizlət' : 'Siyahıda yoxdur? Öz qidanı əlavə et (qablaşmadakı 100 q dəyəri ilə)'}
          </button>
          {showCustom ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <label className="field col-span-2 sm:col-span-5"><span>Ad</span><input id="cf-name" value={custom.n} onChange={(e) => setCustom({ ...custom, n: e.target.value })} placeholder="məs. protein batonu" /></label>
              {[['k', 'kcal/100 q'], ['p', 'Protein'], ['c', 'Karb.'], ['f', 'Yağ']].map(([key, lab]) => (
                <label key={key} className="field"><span>{lab}</span><input id={`cf-${key}`} type="number" inputMode="decimal" min="0" value={custom[key]} onChange={(e) => setCustom({ ...custom, [key]: e.target.value })} /></label>
              ))}
              <button type="button" className="btn btn-ghost self-end" onClick={addCustom} disabled={!custom.n.trim() || !custom.k}>Əlavə et ({g} q)</button>
            </div>
          ) : null}
          <p className="text-xs text-ink3">Porsiya ölçüləri: 1 yumurta ≈ 55 q · 1 dilim çörək ≈ 30 q · 1 xörək qaşığı yağ ≈ 10 q · 1 stəkan bişmiş düyü ≈ 160 q · 1 ovuc qoz ≈ 25 q. "≈" işarəli milli yeməklər resepdən asılıdır.</p>
        </div>

        <div className="calc-log min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="h3">Bu gün yediklərim</h3>
            {log.length ? <button type="button" className="link-muted text-xs" onClick={() => setLog([])}>Siyahını təmizlə</button> : null}
          </div>
          <div className="grid grid-cols-2 gap-3 my-3">
            <MacroBar k="Kalori" v={totals.kcal} t={kTarget} unit="kcal" />
            <MacroBar k="Protein" v={totals.p} t={targets.protein} />
          </div>
          {log.length ? (
            <div className="overflow-x-auto">
              <table className="tbl tbl-tight">
                <thead><tr><th>Qida</th><th className="r">q</th><th className="r">kcal</th><th className="r">P</th><th aria-label="Sil" /></tr></thead>
                <tbody>
                  {log.map((it) => (
                    <tr key={it.id}>
                      <td>{it.name}</td>
                      <td className="r num">{fmtInt(it.grams)}</td>
                      <td className="r num">{fmtInt(it.kcal)}</td>
                      <td className="r num">{fmtInt(it.p)}</td>
                      <td className="r"><button type="button" className="icon-btn" aria-label={`${it.name} sil`} onClick={() => setLog(log.filter((x) => x.id !== it.id))}><Icon name="x" /></button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td>Cəmi</td><td /><td className="r num">{fmtInt(totals.kcal)}</td><td className="r num">{fmtInt(totals.p)}</td><td /></tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="empty">
              <p className="text-ink2 text-sm">Hələ heç nə əlavə edilməyib.</p>
              <p className="text-ink3 text-xs mt-1">Soldan qida seç və "Bugünə əlavə et" düyməsini bas. Qalan: <b className="num">{fmtInt(kTarget)} kcal</b>, <b className="num">{targets.protein} q</b> protein.</p>
            </div>
          )}
          {log.length ? <p className="text-sm mt-3 text-ink2">Qalan: <b className="num text-ink">{fmtInt(Math.max(0, kTarget - totals.kcal))} kcal</b> · protein <b className="num text-ink">{fmtInt(Math.max(0, targets.protein - totals.p))} q</b></p> : null}
        </div>
      </div>
    </Card>
  );
}
