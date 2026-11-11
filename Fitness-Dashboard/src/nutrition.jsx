import { OutFoodPicker } from './outfood.jsx';
import { MealPhoto } from './coach.jsx';
import { RAMADAN_DEFAULT } from './today.jsx';
import { mealImg } from './foodimg.jsx';
import { Card, H2, Eyebrow, Segmented, Pill, Icon, Bar, HowTo } from './ui.jsx';
import { FOODS, MEALS, FOOD_RULES, WEEK_MENU } from './data/nutrition.js';
import { dayMeals, planEaten, sumMacros, macrosOf, fmtInt, fmtNum, toISO, fromISO, mondayOf, addDays, MONTHS, dayPlan, JAN_SWITCH, household, DOW_SHORT, programWeek } from './util.js';
const fmtDateShort = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

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

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = { 1: 'Bazar ertəsi', 2: 'Çərşənbə axşamı', 3: 'Çərşənbə', 4: 'Cümə axşamı', 5: 'Cümə', 6: 'Şənbə', 0: 'Bazar' };
const TRAIN_DOW = [2, 4, 6];

const SUBS = [['menu', 'Menyu və bazarlıq'], ['su', 'Su və qaydalar'], ['calc', 'Hesablayıcı']];
const SUB_KEY = 'prime-ili:qida-sub';

export function Nutrition({ targets, ctx, onGo, menuOv, store, todayLog, updateToday, ramadan, saveSettings, canWrite }) {
  const todayDow = ctx.today.getDay();
  const rest = !TRAIN_DOW.includes(todayDow);
  const ov = menuOv || {};
  const [sub, setSubState] = useState(() => { try { const v = localStorage.getItem(SUB_KEY); return SUBS.some(([k]) => k === v) ? v : 'menu'; } catch { return 'menu'; } });
  const setSub = (v) => { setSubState(v); try { localStorage.setItem(SUB_KEY, v); } catch { /* yaddaş bağlıdır */ } };
  const plan = planEaten(todayLog, ov[todayDow] || WEEK_MENU[todayDow], rest ? targets.rest : targets.train);
  return (
    <div className="grid gap-5">
      <HowTo>Hər günün dəqiq menyusu (qramla) <b>«Bu gün»</b> bölməsindədir. Burada üç bölmə var: <b>menyu və bazarlıq</b>, <b>su və qaydalar</b>, <b>kalori hesablayıcı</b>.</HowTo>
      <div className="seg subtabs" role="tablist" aria-label="Qidalanma bölmələri">
        {SUBS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={sub === k} className={sub === k ? 'on' : ''} onClick={() => setSub(k)}>{l}</button>)}
      </div>

      {sub === 'menu' ? <>
      <Card>
        <H2 sub="Hər gün üçün hazır menyu. Sətrə bas — həmin günün tam planı (porsiyalarla) açılır. Menyunu «Bu gün» bölməsində dəyişə bilərsən.">Həftəlik menyu</H2>
        <div className="overflow-x-auto">
          <table className="tbl week-menu">
            <thead><tr><th>Gün</th>{MEALS.map((m) => <th key={m.id}>{m.name.split(' (')[0]}</th>)}<th className="r">kcal</th></tr></thead>
            <tbody>
              {DAY_ORDER.map((dow) => {
                const idx = ov[dow] || WEEK_MENU[dow];
                const isRest = !TRAIN_DOW.includes(dow);
                const sum = sumMacros(dayMeals(idx, isRest ? targets.rest : targets.train).map((items) => sumMacros(items)));
                return (
                  <tr key={dow} className={dow === ctx.today.getDay() ? 'is-today' : ''} onClick={() => onGo('bugun', dow)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onGo('bugun', dow); }}>
                    <td className="whitespace-nowrap"><b className="text-ink">{DAY_NAMES[dow]}</b><span className="block text-xs text-ink3">{isRest ? 'İstirahət' : 'Məşq günü'}</span></td>
                    {MEALS.map((m, i) => { const oi = Math.min(idx[i] ?? 0, m.options.length - 1); const im = mealImg(m.id, oi); return <td key={m.id}><span className="wm-cell">{im ? <img className="mthumb" src={`img/food/${im.f}`} alt="" loading="lazy" /> : null}<span className="min-w-0">{m.options[oi].name}</span></span></td>; })}
                    <td className="r num whitespace-nowrap"><b className="text-ink">{fmtInt(sum.kcal)}</b><span className="block text-xs text-ink3">P {fmtInt(sum.p)} q</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <ShoppingList ov={ov} store={store} ctx={ctx} targets={targets} canWrite={canWrite} />
      <MealPrep ov={ov} ctx={ctx} targets={targets} />
      </> : null}

      {sub === 'su' ? <>
      <WaterCard targets={targets} rest={rest} n={Number(todayLog.water) || 0} setN={(v) => updateToday({ water: v })} canWrite={canWrite} />

      <div className="grid gap-5 lg:grid-cols-3">
        <RuleCard kind="yes" icon="check" />
        <RuleCard kind="limit" icon="tilde" />
        <RuleCard kind="no" icon="x" />
      </div>

      <RamadanCard ramadan={ramadan || RAMADAN_DEFAULT} saveSettings={saveSettings} canWrite={canWrite} ctx={ctx} />

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
      </> : null}

      {sub === 'calc' ? (
        <Calculator targets={targets} rest={rest} log={todayLog.foods || []} plan={plan} canWrite={canWrite}
          addFood={(x) => updateToday((cur) => ({ foods: [...(cur.foods || []), x] }))}
          removeFood={(id) => updateToday((cur) => ({ foods: (cur.foods || []).filter((x) => x.id !== id) }))}
          clearFoods={() => updateToday({ foods: [] })} />
      ) : null}
    </div>
  );
}


// ---------- Həftəlik bazarlıq siyahısı ----------
const SHOP = {
  chicken_breast: [['Toyuq döşü (çiy)', 1.3, 'kq', 0, 'Ət və balıq']], chicken_breast_raw: [['Toyuq döşü (çiy)', 1, 'kq', 0, 'Ət və balıq']],
  tike_chicken: [['Toyuq döşü (çiy)', 1.25, 'kq', 0, 'Ət və balıq']], chicken_thigh: [['Toyuq budu, sümüksüz (çiy)', 1.3, 'kq', 0, 'Ət və balıq']],
  chigirtma: [['Toyuq döşü (çiy)', 0.45, 'kq', 0, 'Ət və balıq'], ['Yumurta', 0.15, 'ədəd', 55, 'Süd və yumurta'], ['Pomidor', 0.3, 'kq', 0, 'Tərəvəz və meyvə'], ['Soğan', 0.1, 'kq', 0, 'Tərəvəz və meyvə']],
  beef_lean: [['Mal əti, yağsız (çiy)', 1.4, 'kq', 0, 'Ət və balıq']], beef_mince: [['Mal qiyməsi 10%', 1, 'kq', 0, 'Ət və balıq']],
  white_fish: [['Ağ balıq fileto (kefal, çapaq)', 1.25, 'kq', 0, 'Ət və balıq']], tuna_can: [['Tuna konservi', 1, 'banka', 120, 'Ət və balıq']], salmon: [['Qızılbalıq', 1.2, 'kq', 0, 'Ət və balıq']],
  egg: [['Yumurta', 1, 'ədəd', 55, 'Süd və yumurta']], egg_white: [['Yumurta', 1, 'ədəd', 33, 'Süd və yumurta']],
  cottage_5: [['Kəsmik 5%', 1, 'kq', 0, 'Süd və yumurta']], cottage_0: [['Kəsmik 0–1%', 1, 'kq', 0, 'Süd və yumurta']],
  greek_yogurt: [['Süzmə qatıq', 1, 'kq', 0, 'Süd və yumurta']], yogurt: [['Qatıq', 1, 'litr', 0, 'Süd və yumurta']],
  kefir: [['Kefir 1%', 1, 'litr', 0, 'Süd və yumurta']], milk: [['Süd 2.5%', 1, 'litr', 0, 'Süd və yumurta']],
  feta: [['Ağ pendir (brınza)', 1, 'kq', 0, 'Süd və yumurta']], whey: [['Whey protein', 1, 'skop', 30, 'Digər']],
  rice: [['Düyü (quru)', 0.35, 'kq', 0, 'Taxıl və çörək']], buckwheat: [['Qarabaşaq (quru)', 0.38, 'kq', 0, 'Taxıl və çörək']],
  bulgur: [['Bulqur (quru)', 0.4, 'kq', 0, 'Taxıl və çörək']], pasta: [['Makaron (quru)', 0.45, 'kq', 0, 'Taxıl və çörək']],
  oats: [['Yulaf', 1, 'kq', 0, 'Taxıl və çörək']], potato: [['Kartof', 1, 'kq', 0, 'Tərəvəz və meyvə']],
  bread_whole: [['Qara çörək (çovdar / tam taxıllı)', 1, 'buxanka', 400, 'Taxıl və çörək']], lavash: [['Lavaş', 1, 'vərəq', 60, 'Taxıl və çörək']],
  lentil_soup: [['Qırmızı mərci (quru)', 0.1, 'kq', 0, 'Taxıl və çörək'], ['Kök', 0.05, 'kq', 0, 'Tərəvəz və meyvə'], ['Soğan', 0.05, 'kq', 0, 'Tərəvəz və meyvə']],
  tomato: [['Pomidor', 1, 'kq', 0, 'Tərəvəz və meyvə']], cucumber: [['Xiyar', 1, 'kq', 0, 'Tərəvəz və meyvə']],
  greens: [['Göyərti (kahı, keşniş, şüyüd)', 1, 'dəstə', 50, 'Tərəvəz və meyvə']], broccoli: [['Brokoli', 1, 'kq', 0, 'Tərəvəz və meyvə']],
  pepper: [['Bolqar bibəri', 1, 'kq', 0, 'Tərəvəz və meyvə']], banana: [['Banan', 1, 'ədəd', 120, 'Tərəvəz və meyvə']],
  apple: [['Alma', 1, 'ədəd', 170, 'Tərəvəz və meyvə']], dates: [['Finik', 1, 'kq', 0, 'Digər']],
  walnut: [['Qoz ləpəsi', 1, 'kq', 0, 'Digər']], almond: [['Badam', 1, 'kq', 0, 'Digər']],
  olive_oil: [['Zeytun yağı', 1, 'ml', 0, 'Digər']], honey: [['Bal', 1, 'kq', 0, 'Digər']],
};
// ---------- Ramazan rejimi ----------
function RamadanCard({ ramadan, saveSettings, canWrite, ctx }) {
  const set = (patch) => saveSettings({ ramadan: { ...ramadan, ...patch } });
  const w1 = programWeek(ctx.startISO, fromISO(ramadan.from)); const w2 = programWeek(ctx.startISO, fromISO(ramadan.to));
  return (
    <Card>
      <H2 sub={`Proqramın ${w1}–${w2}-ci həftələrinə düşür. Açıq olanda «Bu gün» səhifəsi bu tarixlərdə avtomatik sahur/iftar planına keçir.`} right={
        <label className="switch"><input type="checkbox" checked={!!ramadan.on} disabled={!canWrite} onChange={(e) => set({ on: e.target.checked })} /><span>{ramadan.on ? 'Açıq' : 'Bağlı'}</span></label>
      }>🌙 Ramazan rejimi</H2>
      <div className="grid gap-5 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <div className="grid gap-3 content-start">
          <label className="field"><span>İlk oruc günü</span><input type="date" value={ramadan.from} disabled={!canWrite} onChange={(e) => set({ from: e.target.value })} /></label>
          <label className="field"><span>Son oruc günü</span><input type="date" value={ramadan.to} disabled={!canWrite} onChange={(e) => set({ to: e.target.value })} /></label>
          <p className="text-xs text-ink3">2027 üçün təxmini tarixlərdir. QMİ rəsmi təqvimi elan edəndə burada düzəlt.</p>
        </div>
        <ul className="grid gap-2 text-sm text-ink2">
          <li><b className="text-ink">Sahur (imsakdan 45 dəq əvvəl):</b> səhər yeməyi + kəsmik/qatıq. Yulaf, yumurta, pendir — uzun tox saxlayır. 3–4 stəkan su.</li>
          <li><b className="text-ink">İftar:</b> 2–3 xurma və su ilə aç, 10 dəq sonra nahar menyusu (mərci şorbası çox uyğundur).</li>
          <li><b className="text-ink">Məşq:</b> iftardan ≈2,5 saat sonra. Hər hərəkətdən 1 set az, çəkini artırma — məqsəd əzələni saxlamaqdır.</li>
          <li><b className="text-ink">Şam:</b> məşqdən sonra 22:00-da. Gündəlik kalori və 180 q protein eyni qalır.</li>
          <li><b className="text-ink">Su:</b> iftardan sahura qədər hər saat 2 stəkan. Çay və qəhvəni azalt — susuzluq artırır.</li>
          <li><b className="text-ink">Çəki:</b> ilk həftə 1–2 kq düşə bilər (su) — bayramdan sonra qayıdır, narahat olma.</li>
        </ul>
      </div>
    </Card>
  );
}

// ---------- Bazar günü yemək hazırlığı ----------
const PREP_IDS = ['chicken_breast', 'tike_chicken', 'beef_lean', 'buckwheat', 'bulgur', 'rice', 'potato', 'lentil_soup', 'chicken_thigh'];
const PREP_STEPS = [
  ['0:00', 'Sobanı 200°C yandır. Toyuğu/əti marinə et (qatıq, sarımsaq, ədviyyat) — 15 dəq dursun.'],
  ['0:10', 'Mərci şorbası varsa qazana qoy (25 dəq). Qarabaşaq/bulqur üçün su qaynat.'],
  ['0:20', 'Toyuğu sobaya qoy (20–22 dəq). Taxılı bişir (15 dəq, qapağı bağlı).'],
  ['0:40', 'Hər şey soyusun (isti halda qapaq bağlama — tərləyir, tez xarab olur).'],
  ['0:50', 'Tərəziylə böl: hər qaba ət + taxıl. Salatı ayrı kiçik qaba, sousu/yağı ayrıca.'],
  ['1:00', 'Soyuducuda 4 günə qədər saxlanır. 4-cü günün qabını dondurucuya qoy, axşamdan soyuducuya keçir.'],
];
function MealPrep({ ov, ctx, targets }) {
  const mon = addDays(mondayOf(ctx.today), 7);
  const data = useMemo(() => {
    const acc = {}; const workDays = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(mon, i); const dow = d.getDay();
      const plan = dayPlan(dow, d >= JAN_SWITCH ? 'jan' : 'now', ctx.phase.n);
      if (plan.atHome) continue;
      workDays.push(dow);
      const idx = ov[dow] || WEEK_MENU[dow];
      const rest = ![2, 4, 6].includes(dow);
      const fitted = dayMeals(idx, rest ? targets.rest : targets.train);
      [1, 2].forEach((mi) => fitted[mi].forEach((it) => {
        if (!PREP_IDS.includes(it.id)) return;
        acc[it.id] = (acc[it.id] || 0) + it.grams;
      }));
    }
    return { workDays, list: Object.entries(acc).sort((a, b) => b[1] - a[1]) };
  }, [ov, targets.rest, targets.train, ctx.phase.n]);
  return (
    <Card>
      <H2 sub={`İş günləri (${data.workDays.map((d) => DOW_SHORT[d]).join(', ')}) üçün nahar və ara öyün — bazar axşamı təxminən 1 saatlıq iş. ${data.workDays.length} qab hazırla.`}>Bazar günü yemək hazırlığı</H2>
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div>
          <h3 className="h4 mb-2">Nə qədər bişirmək lazımdır</h3>
          <ul className="prep-list">
            {data.list.map(([id, g]) => {
              const raw = (SHOP[id] || [])[0];
              return (
                <li key={id}>
                  <span className="min-w-0"><b className="text-ink">{FOODS[id].n.replace(/ \(.*\)$/, '').replace(' ≈', '')}</b><span className="block text-xs text-ink3">{household(id, g) || ''} · hər qaba {fmtInt(g / Math.max(1, data.workDays.length))} q</span></span>
                  <span className="text-right"><b className="num text-ink">{fmtInt(g)} q</b><span className="block text-xs text-ink3">{raw && raw[2] === 'kq' ? `çiy/quru ≈ ${fmtInt(g * raw[1])} q` : 'bişmiş'}</span></span>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h3 className="h4 mb-2">Ardıcıllıq (60 dəqiqə)</h3>
          <ol className="prep-steps">{PREP_STEPS.map(([t, x]) => <li key={t}><span className="num">{t}</span><span>{x}</span></li>)}</ol>
        </div>
      </div>
    </Card>
  );
}

const SHOP_GROUPS = ['Ət və balıq', 'Süd və yumurta', 'Taxıl və çörək', 'Tərəvəz və meyvə', 'Digər'];

function shopQty(g, unit, per) {
  if (unit === 'kq') return g >= 1000 ? `${(Math.ceil(g / 100) / 10).toString().replace('.', ',')} kq` : `${Math.max(50, Math.ceil(g / 50) * 50)} q`;
  if (unit === 'litr') return g >= 1000 ? `${(Math.ceil(g / 250) / 4).toString().replace('.', ',')} l` : `${Math.ceil(g / 50) * 50} ml`;
  if (unit === 'ml') return `${Math.ceil(g / 10) * 10} ml (≈ ${Math.ceil(g / 10)} xörək qaşığı)`;
  return `${Math.ceil(g / per)} ${unit}`;
}

function ShoppingList({ ov, store, ctx, targets, canWrite }) {
  // Şənbə-bazar günü bazarlıq gələn həftə üçün edilir
  const monday = [6, 0].includes(ctx.today.getDay()) ? addDays(mondayOf(ctx.today), 7) : mondayOf(ctx.today);
  const wk = toISO(monday);
  const [checked, setChecked] = useState({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!store) return undefined;
    setLoaded(false);
    return store.subscribe(`shopping/${wk}`, (d) => { setChecked((d && d.items) || {}); setLoaded(true); });
  }, [store, wk]);
  const items = useMemo(() => {
    const acc = {};
    [1, 2, 3, 4, 5, 6, 0].forEach((dow) => {
      const idx = ov[dow] || WEEK_MENU[dow];
      const rest = ![2, 4, 6].includes(dow);
      dayMeals(idx, rest ? targets.rest : targets.train).flat().forEach((it) => {
        (SHOP[it.id] || []).forEach(([label, factor, unit, per, grp]) => {
          const a = acc[label] || (acc[label] = { label, g: 0, unit, per, grp });
          a.g += it.grams * factor;
        });
      });
    });
    return Object.values(acc);
  }, [ov, targets.rest, targets.train]);
  const toggle = (label) => {
    if (!loaded || !canWrite) return;
    const next = { ...checked, [label]: !checked[label] };
    setChecked(next);
    if (store) store.setDoc(`shopping/${wk}`, { week: wk, items: next }).catch(() => {});
  };
  const done = items.filter((x) => checked[x.label]).length;
  return (
    <Card>
      <H2 sub={`${fmtDateShort(monday)} – ${fmtDateShort(addDays(monday, 6))} həftəsi üçün, menyuya görə hesablanıb (bişmiş çəkilər quru/çiy çəkiyə çevrilib, azca ehtiyatla yuvarlaqlaşdırılıb). Aldığını işarələ.`}
        right={<span className="pill pill-cobalt">{done} / {items.length} alındı</span>}>Həftəlik bazarlıq siyahısı</H2>
      <div className="shop">
        {SHOP_GROUPS.map((grp) => {
          const list = items.filter((x) => x.grp === grp).sort((a, b) => b.g - a.g);
          if (!list.length) return null;
          return (
            <div key={grp} className="shop-g">
              <h3 className="h4">{grp}</h3>
              <ul className="mt-2 grid gap-1">
                {list.map((x) => (
                  <li key={x.label}>
                    <label className={`shop-i ${checked[x.label] ? 'done' : ''}`}>
                      <input type="checkbox" checked={!!checked[x.label]} disabled={!loaded || !canWrite} onChange={() => toggle(x.label)} />
                      <span className="shop-n">{x.label}</span>
                      <b className="num shop-q">{shopQty(x.g, x.unit, x.per)}</b>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-ink3 mt-3">Ədviyyat, soğan-sarımsaq, limon, duz və çay ev ehtiyatından. İşarələr hər həftə yenidən başlayır və bütün cihazlarda görünür.</p>
    </Card>
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

function WaterCard({ targets, rest, n, setN: setNRaw, canWrite }) {
  const setN = (v) => { if (canWrite) setNRaw(v); };
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
          <h3 className="h4">İş günü üçün bölgü (təxmini)</h3>
          <ol className="water-plan mt-2">
            {plan.map(([t, x, c]) => (
              <li key={t}><span className="num tl-time">{t}</span><span>{x}</span><b className="num">{c} stəkan</b></li>
            ))}
          </ol>
          <p className="text-xs text-ink3 mt-2">Cəmi {planTotal} stəkan{planTotal !== goal ? ` — hədəfin ${goal}; fərqi gün ərzində tamamla` : ''}. Ev günlərində eyni sayı oyandığın vaxtdan yatana qədər yay.</p>
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

function Calculator({ targets, rest, log, plan, addFood, removeFood, clearFoods, canWrite }) {
  const [q, setQ] = useState('');
  const [foodId, setFoodId] = useState('chicken_breast');
  const [grams, setGrams] = useState('150');
  const [custom, setCustom] = useState({ n: '', k: '', p: '', c: '', f: '' });
  const [showCustom, setShowCustom] = useState(false);


  const list = useMemo(() => {
    const s = q.trim().toLocaleLowerCase('az');
    return Object.entries(FOODS).filter(([, f]) => !s || f.n.toLocaleLowerCase('az').includes(s));
  }, [q]);

  useEffect(() => {
    if (list.length && !list.some(([id]) => id === foodId)) setFoodId(list[0][0]);
  }, [list]);

  const g = Math.max(0, parseFloat(String(grams).replace(',', '.')) || 0);
  const preview = macrosOf(foodId, g);
  const extra = sumMacros(log.map((x) => ({ kcal: x.kcal || 0, p: x.p || 0, c: x.c || 0, f: x.f || 0 })));
  // Günün cəmi = Gündəlikdə «Yedim» işarələnmiş plan öyünləri + buradakı əlavələr
  const totals = { kcal: extra.kcal + plan.kcal, p: extra.p + plan.p };
  const kTarget = rest ? targets.rest : targets.train;

  const add = () => {
    if (!g || !FOODS[foodId] || !canWrite) return;
    addFood({ id: Date.now(), name: FOODS[foodId].n, grams: g, ...preview });
  };
  const addCustom = () => {
    const num = (x) => Math.max(0, parseFloat(String(x).replace(',', '.')) || 0);
    if (!custom.n.trim() || !num(custom.k) || !g || !canWrite) return;
    const k = g / 100;
    addFood({ id: Date.now(), name: custom.n.trim(), grams: g, kcal: num(custom.k) * k, p: num(custom.p) * k, c: num(custom.c) * k, f: num(custom.f) * k });
    setCustom({ n: '', k: '', p: '', c: '', f: '' });
  };

  return (
    <Card>
      <H2 sub="Plandan kənar yediyini bura əlavə et. Günün cəmi = Gündəlikdə «Yedim» işarələdiyin plan öyünləri + buradakı əlavələr. Siyahı «Gündəlik»də həmin günün qeydində saxlanır.">Kalori hesablayıcı</H2>
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
            <button type="button" className="btn btn-primary" onClick={add} disabled={!g || !canWrite}><Icon name="plus" />Bugünə əlavə et</button>
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
          <MealPhoto disabled={!canWrite} onAdd={addFood} />
          <OutFoodPicker disabled={!canWrite} onAdd={addFood} />
          <p className="text-xs text-ink3">Porsiya ölçüləri: 1 yumurta ≈ 55 q · 1 dilim çörək ≈ 30 q · 1 xörək qaşığı yağ ≈ 10 q · 1 stəkan bişmiş düyü ≈ 160 q · 1 ovuc qoz ≈ 25 q. "≈" işarəli milli yeməklər resepdən asılıdır.</p>
        </div>

        <div className="calc-log min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="h3">Bu günün cəmi</h3>
            {log.length && canWrite ? <button type="button" className="link-muted text-xs" onClick={clearFoods}>Əlavələri təmizlə</button> : null}
          </div>
          <div className="grid grid-cols-2 gap-3 my-3">
            <MacroBar k="Kalori" v={totals.kcal} t={kTarget} unit="kcal" />
            <MacroBar k="Protein" v={totals.p} t={targets.protein} />
          </div>
          <p className="text-xs text-ink3 mb-2 num">Plan öyünləri («Yedim» ✓): <b className="text-ink2">{fmtInt(plan.kcal)} kcal</b> · əlavələr: <b className="text-ink2">{fmtInt(extra.kcal)} kcal</b>{plan.kcal ? '' : ' — plan öyünlərini Gündəlikdə «Yedim» işarələ ki, bura düşsün.'}</p>
          {log.length ? (
            <div className="overflow-x-auto">
              <table className="tbl tbl-tight">
                <thead><tr><th>Qida</th><th className="r">q</th><th className="r">kcal</th><th className="r">P</th><th aria-label="Sil" /></tr></thead>
                <tbody>
                  {log.map((it) => (
                    <tr key={it.id}>
                      <td>{it.name}</td>
                      <td className="r num">{it.grams ? fmtInt(it.grams) : it.photo ? 'şəkil' : 'porsiya'}</td>
                      <td className="r num">{fmtInt(it.kcal)}</td>
                      <td className="r num">{fmtInt(it.p)}</td>
                      <td className="r"><button type="button" className="icon-btn" aria-label={`${it.name} sil`} onClick={() => removeFood(it.id)} disabled={!canWrite}><Icon name="x" /></button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td>Əlavələr cəmi</td><td /><td className="r num">{fmtInt(extra.kcal)}</td><td className="r num">{fmtInt(extra.p)}</td><td /></tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="empty">
              <p className="text-ink2 text-sm">Plandan kənar heç nə əlavə edilməyib.</p>
              <p className="text-ink3 text-xs mt-1">Soldan qida seç və "Bugünə əlavə et" düyməsini bas. Qalan: <b className="num">{fmtInt(Math.max(0, kTarget - totals.kcal))} kcal</b>, <b className="num">{fmtInt(Math.max(0, targets.protein - totals.p))} q</b> protein.</p>
            </div>
          )}
          {log.length ? <p className="text-sm mt-3 text-ink2">Qalan: <b className="num text-ink">{fmtInt(Math.max(0, kTarget - totals.kcal))} kcal</b> · protein <b className="num text-ink">{fmtInt(Math.max(0, targets.protein - totals.p))} q</b></p> : null}
        </div>
      </div>
    </Card>
  );
}
