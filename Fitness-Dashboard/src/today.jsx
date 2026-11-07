import { Card, Pill, Icon, HowTo, Bar } from './ui.jsx';
import { Anatomy } from './anatomy.jsx';
import { ExMedia } from './media.jsx';
import { DAYS, WARMUP, EX, MUSCLES, setsFor, restLabel, COOLDOWN } from './data/exercises.js';
import { MEALS, FOODS, WEEK_MENU } from './data/nutrition.js';
import { MealImg, mealImg } from './foodimg.jsx';
import { SetLogger } from './gym.jsx';
import { Recipe } from './outfood.jsx';
import { AskCoach } from './coach.jsx';
import { dayPlan, DOW_NAMES, mondayOf, addDays, fmtDate, toISO, fromISO, JAN_SWITCH, mealItems, sumMacros, fmtInt, stepsTarget, household } from './util.js';

const { useState, useMemo } = React;

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const SHORT = { 1: 'B.e.', 2: 'Ç.a.', 3: 'Ç.', 4: 'C.a.', 5: 'C.', 6: 'Ş.', 0: 'B.' };
const TRAIN_KEY = { 2: 'A', 4: 'B', 6: 'C' };
const MENU_KEY = 'prime-ili:menu';

function dayLabel(dow, sched, phaseN) {
  if (TRAIN_KEY[dow]) return `Məşq ${TRAIN_KEY[dow]}`;
  const p = dayPlan(dow, sched, phaseN);
  if (p.items.some((i) => i.k === 'swim')) return 'Hovuz';
  if (dow === 0) return 'Ölçmə';
  return 'İstirahət';
}

// Ramazan: Bakı üçün təxmini imsak/iftar (fevral–mart), gün-gün dəyişir
export const RAMADAN_DEFAULT = { on: true, from: '2027-02-08', to: '2027-03-09' };
const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m) % 60).padStart(2, '0')}`;
export function ramadanTimes(date, ram) {
  if (!ram || !ram.on || !ram.from || !ram.to) return null;
  const iso = toISO(date);
  if (iso < ram.from || iso > ram.to) return null;
  const a = fromISO(ram.from).getTime(); const b = fromISO(ram.to).getTime();
  const t = b > a ? (date.getTime() - a) / (b - a) : 0;
  const imsak = 6 * 60 - 40 * t; const iftar = 18 * 60 + 5 + 35 * t;
  const day = Math.round((date.getTime() - a) / 86400000) + 1;
  return { imsak: hm(imsak), iftar: hm(iftar), sahur: hm(imsak - 45), day, iftarM: iftar, imsakM: imsak };
}

function ramadanTimeline(dow, plan, R) {
  const train = TRAIN_KEY[dow];
  const items = [
    { t: R.sahur, k: 'meal', m: 0, title: 'Sahur' },
    { t: R.sahur, k: 'meal', m: 4, title: 'Sahur — yavaş həzm olunan protein' },
    { t: R.imsak, k: 'wake', title: 'İmsak ≈ ' + R.imsak, text: 'Bu vaxta qədər 3–4 stəkan su iç. Duzlu, ədviyyatlı yemə — gündüz susadır.' },
    { t: R.iftar, k: 'meal', m: 1, title: 'İftar — 2–3 xurma və 1 stəkan su ilə aç, 10 dəq sonra' },
    { t: hm(R.iftarM + 30), k: 'water', title: 'Su planı', text: 'İftardan sahura qədər hər saat 2 stəkan — gündəlik hədəfi bu 10 saata yay.' },
    { t: hm(R.iftarM + 90), k: 'meal', m: 2, title: train ? 'Ara öyün — məşqdən 1 saat əvvəl' : 'Ara öyün' },
    { t: train ? '22:00' : '21:30', k: 'meal', m: 3, title: train ? 'Şam — məşqdən sonra' : 'Şam yeməyi' },
    { t: '23:00', k: 'sleep', title: 'Yuxu', text: 'Sahura qədər 5,5–6 saat. Mümkünsə gündüz 20 dəqiqə yat.' },
  ];
  if (plan.work) items.push({ t: '09:00', k: 'work', title: 'İş · oruc', text: 'Gündüz su və yemək yoxdur — pilləkən, ağır iş yox. Addım hədəfi bu ay 5–6 min.' });
  if (train) items.push({ t: hm(R.iftarM + 150), k: 'train', day: train });
  return items.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
}

// Günün xronoloji planı
function buildTimeline(dow, sched, phaseN, R) {
  const plan = dayPlan(dow, sched, phaseN);
  if (R) return ramadanTimeline(dow, plan, R);
  const train = TRAIN_KEY[dow];
  const home = plan.atHome;
  const T = home
    ? { wake: '08:00', b: '08:30', l: '13:30', s: '17:00', d: '20:00', late: '22:30', act: '11:00', train: '11:00' }
    : { wake: '07:00', b: '07:30', l: '13:00', s: '16:30', d: '20:30', late: '22:30', act: '18:30', train: '18:30' };
  const items = [
    { t: T.wake, k: 'wake', title: 'Oyan', text: '2 stəkan su (500 ml). Hər bazar: tualetdən sonra çəki və bel ölçüsü.' },
    { t: T.b, k: 'meal', m: 0, title: 'Səhər yeməyi' },
    { t: T.l, k: 'meal', m: 1, title: train === 'C' ? 'Nahar — məşqdən sonra' : 'Nahar' },
    { t: T.s, k: 'meal', m: 2, title: train && train !== 'C' ? 'Ara öyün — məşqdən 2 saat əvvəl' : 'Ara öyün' },
    { t: T.d, k: 'meal', m: 3, title: train && train !== 'C' ? 'Şam yeməyi — məşqdən sonra' : 'Şam yeməyi' },
    { t: T.late, k: 'meal', m: 4, title: 'Yatmazdan əvvəl (istəyə görə)' },
    { t: '23:00', k: 'sleep', title: 'Yuxu', text: '7.5–8 saat. Telefonu 30 dəq əvvəl kənara qoy.' },
  ];
  if (!home) items.push({ t: '09:00', k: 'work', title: 'İş · 09:00–18:00', text: 'Hər saat 1 stəkan su və 3–5 dəqiqə ayağa qalx. Nahar qabını evdən götür.' });
  if (train) items.push({ t: T.train, k: 'train', day: train });
  else {
    const acts = plan.items.filter((i) => i.k !== 'steps' && i.k !== 'measure');
    if (acts.length) items.push({ t: T.act, k: 'act', acts });
  }
  return items.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
}

export function Today({ ctx, targets, variants, onChooseVariant, onOpenEx, selDow, setSelDow, onGo, menuOv, setMenu, days, updateDay, canWrite, onGym, ramadan, checkins = [] }) {
  const { today, week, phase, deload } = ctx;
  const monday = mondayOf(today);
  const date = addDays(monday, (selDow + 6) % 7);
  const sched = date >= JAN_SWITCH ? 'jan' : 'now';
  const plan = dayPlan(selDow, sched, phase.n);
  const train = TRAIN_KEY[selDow];
  const rest = !train;
  const menu = menuOv[selDow] || WEEK_MENU[selDow];
  const R = ramadanTimes(date, ramadan || RAMADAN_DEFAULT);
  const timeline = useMemo(() => buildTimeline(selDow, sched, phase.n, R), [selDow, sched, phase.n, R && R.iftar]);
  const isToday = selDow === today.getDay();
  const iso = toISO(date);
  const canLog = !!canWrite && date <= today;

  const meals = MEALS.map((m, i) => {
    const oi = Math.min(menu[i] ?? 0, m.options.length - 1);
    const opt = m.options[oi];
    const items = mealItems(opt, rest, targets.carbScale || 1);
    return { m, opt, oi, items, sum: sumMacros(items) };
  });
  const total = sumMacros(meals.map((x) => x.sum));
  const kTarget = rest ? targets.rest : targets.train;
  const glasses = rest ? targets.glassesRest : targets.glassesTrain;

  const setMeal = (mi, idx) => {
    const next = { ...menuOv, [selDow]: (menuOv[selDow] || WEEK_MENU[selDow]).map((v, i) => (i === mi ? idx : v)) };
    setMenu(next);
  };

  return (
    <div className="grid gap-5">
      <HowTo>Bu səhifə <b>bir günün bütün planıdır</b>: nə vaxt nə yeyirsən (qramla) və məşq günü hansı hərəkəti neçə dəfə edirsən. Aşağıdakı günlərdən birinə bas — həftənin istənilən gününə baxa bilərsən. Axşam günü <button type="button" className="link-inline" onClick={() => onGo('gundelik')}>Gündəlikdə ✓ qeyd et</button>.</HowTo>

      <div className="daypick" role="tablist" aria-label="Həftənin günü">
        {ORDER.map((dow) => (
          <button key={dow} type="button" role="tab" aria-selected={dow === selDow} className={`${dow === selDow ? 'on' : ''} ${TRAIN_KEY[dow] ? 'tr' : ''}`} onClick={() => setSelDow(dow)}>
            <span className="dp-d">{SHORT[dow]}</span>
            <span className="dp-l">{dayLabel(dow, sched, phase.n)}</span>
            {dow === today.getDay() ? <span className="dp-today">bu gün</span> : null}
          </button>
        ))}
      </div>

      <Card className="dayhead">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="eyebrow">{isToday ? 'Bu gün' : 'Seçilmiş gün'} · {fmtDate(date)}</div>
            <h2 className="h2 mt-1">{DOW_NAMES[selDow]} — {train ? `məşq günü (${DAYS[train].title})` : 'istirahət günü'}</h2>
            <p className="text-sm text-ink2 mt-1">{plan.work ? 'İş günü, 09:00–18:00' : 'Evdəsən'}{train ? (R ? ` · məşq iftardan sonra ≈${hm(R.iftarM + 150)}` : ` · məşq ${train === 'C' ? '11:00-da' : 'işdən sonra 18:30-da'}`) : ''}{week === 0 ? ' · proqram 9 noyabrda başlayır: bu həftə yüngül çəki ilə hərəkətləri öyrən' : ''}</p>
            {R ? <p className="ramadan-note">🌙 Ramazan, {R.day}-ci gün · sahur ≈ {R.sahur}, imsak ≈ {R.imsak}, iftar ≈ {R.iftar} (dəqiq vaxtı QMİ təqvimindən yoxla). Kalori və protein eynidir, yalnız vaxtlar dəyişir. Məşq iftardan sonra: hər hərəkətdən 1 set az, çəkini saxla — artırma.</p> : null}
          </div>
        </div>
        <div className="daystats mt-4">
          <div><span className="ds-k">Kalori</span><span className="ds-v num">{fmtInt(kTarget)}</span><span className="ds-u">kcal</span></div>
          <div><span className="ds-k">Protein</span><span className="ds-v num">{targets.protein}</span><span className="ds-u">q</span></div>
          <div><span className="ds-k">Su</span><span className="ds-v num">{glasses}</span><span className="ds-u">stəkan</span></div>
          <div><span className="ds-k">Addım</span><span className="ds-v num">{fmtInt(stepsTarget(phase.n))}</span><span className="ds-u">+</span></div>
        </div>
      </Card>

      <ol className="tline">
        {timeline.map((it, idx) => {
          if (it.k === 'meal') {
            const x = meals[it.m];
            return (
              <li key={idx} className="tl-item tl-meal">
                <span className="tl-t num">{it.t}</span>
                <div className="tl-card">
                  <div className="tl-head">
                    <div className="min-w-0">
                      <div className="tl-kind">Yemək</div>
                      <h3 className="h3">{it.title}: {x.opt.name}</h3>
                    </div>
                    <span className="tl-sum num"><b>{fmtInt(x.sum.kcal)}</b> kcal · P {fmtInt(x.sum.p)} q</span>
                  </div>
                  <div className={mealImg(x.m.id, x.oi) ? 'meal-row' : ''}>
                    <MealImg meal={x.m.id} oi={x.oi} />
                    <ul className="food-list-plain">
                      {x.items.map((f) => (
                        <li key={f.id} className="hhrow"><span className="min-w-0"><span className="hh">{household(f.id, f.grams) || `${f.grams} q`}</span>{FOODS[f.id].n.replace(/ \(.*\)$/, '')} <span className="qty-g num">· {f.grams} q</span></span></li>
                      ))}
                    </ul>
                  </div>
                  <Recipe meal={x.m.id} oi={x.oi} />
                  <div className="tl-foot">
                    <span className="text-xs text-ink3">{x.opt.tip}</span>
                    <label className="swap">
                      <span>Başqa variant:</span>
                      <select id={`menu-${selDow}-${it.m}`} className="select select-sm" value={Math.min(menu[it.m] ?? 0, x.m.options.length - 1)} onChange={(e) => setMeal(it.m, Number(e.target.value))}>
                        {x.m.options.map((o, oi) => <option key={o.name} value={oi}>{o.name}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
              </li>
            );
          }
          if (it.k === 'train') return <li key={idx} className="tl-item tl-train"><span className="tl-t num">{it.t}</span><Workout day={it.day} ctx={ctx} variants={variants} onChooseVariant={onChooseVariant} onOpenEx={onOpenEx} iso={iso} days={days} updateDay={updateDay} canLog={canLog} ram={!!R} onGym={() => onGym({ day: it.day, iso, ram: !!R })} /></li>;
          if (it.k === 'act') {
            return (
              <li key={idx} className="tl-item">
                <span className="tl-t num">{it.t}</span>
                <div className="tl-card">
                  <div className="tl-kind">Hərəkət (məşq yoxdur)</div>
                  <ul className="grid gap-1.5 mt-1">
                    {it.acts.map((a) => <li key={a.t}><b className="text-ink">{a.t}</b>{a.s ? <span className="text-ink2 text-sm"> — {a.s}</span> : null}</li>)}
                  </ul>
                  <p className="text-xs text-ink3 mt-2">İstirahət günü əzələlər böyüyür. Addım hədəfini tamamla, ağır məşq etmə.</p>
                </div>
              </li>
            );
          }
          return (
            <li key={idx} className={`tl-item tl-${it.k}`}>
              <span className="tl-t num">{it.t}</span>
              <div className="tl-card tl-card-sm">
                <b className="text-ink">{it.title}</b>
                <span className="text-sm text-ink2"> — {it.text}</span>
              </div>
            </li>
          );
        })}
      </ol>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="h3">Günün cəmi (yemək)</h3>
          <span className="text-sm text-ink2 num"><b className="text-ink">{fmtInt(total.kcal)}</b> / {fmtInt(kTarget)} kcal · protein <b className="text-ink">{fmtInt(total.p)}</b> / {targets.protein} q</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <div><div className="text-xs text-ink2">Kalori</div><Bar value={total.kcal} max={kTarget} label="Kalori" /></div>
          <div><div className="text-xs text-ink2">Protein</div><Bar value={total.p} max={targets.protein} label="Protein" /></div>
        </div>
        <p className="text-xs text-ink3 mt-3">{rest ? 'İstirahət günü düyü, kartof, çörək, yulaf və banan porsiyaları 25% azaldılıb.' : 'Məşq günü karbohidrat porsiyaları tamdır.'} Su: gündə {glasses} stəkan — izləyici <button type="button" className="link-strong" onClick={() => onGo('qida')}>Qidalanma</button> bölməsindədir.</p>
      </Card>
      <AskCoach days={days || {}} checkins={checkins} targets={targets} ctx={ctx} />
    </div>
  );
}

function Workout({ day, ctx, variants, onChooseVariant, onOpenEx, iso, days, updateDay, canLog, onGym, ram }) {
  const nSets = (s) => Math.max(1, setsFor(s, ctx.phase.n, ctx.deload) - (ram ? 1 : 0));
  const D = DAYS[day];
  const { phase, deload } = ctx;
  const minutes = Math.round(D.slots.reduce((a, s) => a + nSets(s) * (45 + s.rest), 0) / 60 + 10);
  return (
    <div className="tl-card tl-card-train">
      <div className="tl-kind">Məşq · {D.title}</div>
      <h3 className="h2">{D.title}: hər gün bütün bədən</h3>
      <button type="button" className="btn btn-primary gym-cta" onClick={onGym}><Icon name="play" className="icon-sm" />Zal rejimini aç</button>
      <p className="text-sm text-ink2 mt-1">Təxminən <b className="text-ink num">{minutes} dəq</b> · Faza {phase.n} ({phase.name}): {phase.n === 1 ? 'hər hərəkətdən 2 set, texnikanı öyrən' : 'cədvəldəki set sayı'}{deload ? ' · deload həftəsi: setlər yarıya' : ''}{ram ? ' · Ramazan: hər hərəkətdən 1 set az' : ''} · setin sonunda {phase.rir} təkrar ehtiyat saxla.</p>

      <h4 className="h4 mt-5">1. İsinmə — 10 dəqiqə</h4>
      <ul className="warm-list mt-2">
        {WARMUP.map((w, i) => {
          const key = `W${i}`;
          const id = w.ex[variants[key] || 0];
          return (
            <li key={key}>
              <button type="button" className="warm-row" onClick={() => onOpenEx({ key, slot: w, kind: 'warm' })}>
                <ExMedia id={id} size="thumb" />
                <span className="min-w-0"><span className="block text-xs text-ink3">{w.label}</span><b className="text-ink text-sm">{EX[id].az}</b></span>
                <span className="num text-sm font-bold text-ink">{w.dose}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-ink3 mt-2">Sonra ilk hərəkətdə 2 yüngül set: işçi çəkinin yarısı × 10, 70%-i × 5.</p>

      <h4 className="h4 mt-6">2. Əsas hissə — {D.slots.length} hərəkət</h4>
      <div className="grid gap-4 mt-2">
        {D.slots.map((s, i) => (
          <ExerciseCard key={i} n={i + 1} slot={s} slotKey={`${day}${i}`} sets={nSets(s)} vi={variants[`${day}${i}`] || 0}
            onChoose={(v) => onChooseVariant(`${day}${i}`, v)} onMore={() => onOpenEx({ key: `${day}${i}`, slot: s, kind: 'main' })}
            logger={<SetLogger id={s.ex[variants[`${day}${i}`] || 0]} slot={s} sets={nSets(s)} iso={iso} days={days} updateDay={updateDay} canLog={canLog} nextLabel={D.slots[i + 1] ? EX[D.slots[i + 1].ex[variants[`${day}${i + 1}`] || 0]].az : null} />} />
        ))}
      </div>

      <h4 className="h4 mt-6">3. Bitiriş — 10 dəqiqə</h4>
      <p className="text-sm text-ink2 mt-1">{phase.n >= 2 ? '10–15 dəq meyilli zolaqda yeriş, sonra' : 'Dartılma:'} {COOLDOWN.map((c) => c.split(' — ')[0]).join(', ')} — hər biri 30 saniyə.</p>
    </div>
  );
}

export function ExerciseCard({ n, slot, slotKey, sets, vi, onChoose, onMore, logger }) {
  const id = slot.ex[vi];
  const ex = EX[id];
  return (
    <article className="excard">
      <div className="excard-media">
        <ExMedia id={id} size="card" />
      </div>
      <div className="excard-body min-w-0">
        <div className="excard-top">
          <span className="excard-n num">{n}</span>
          <span className="excard-g">{slot.g}</span>
          {vi ? <Pill tone="cobalt">Alternativ</Pill> : null}
        </div>
        <h4 className="excard-name">{ex.az}</h4>
        <div className="text-xs text-ink3">{ex.en} · {ex.eq}</div>
        <div className="excard-rx">
          <span><b className="num">{sets}</b> set</span>
          <span className="x">×</span>
          <span><b className="num">{slot.reps}</b> təkrar</span>
          <span className="sep" />
          <span><b className="num">{restLabel(slot.rest)}</b> istirahət</span>
        </div>
        <div className="excard-mus">
          <span className="em-k">İşlədir:</span>
          {ex.p.map((m) => <span key={m} className="mchip mchip-p">{MUSCLES[m]}</span>)}
          {ex.s.length ? <span className="em-k em-k2">köməkçi:</span> : null}
          {ex.s.map((m) => <span key={m} className="mchip">{MUSCLES[m]}</span>)}
        </div>
        <div className="em-k mt-3">Necə edilir:</div>
        <ol className="steps steps-sm mt-1">
          {ex.cues.map((c) => <li key={c}>{c}</li>)}
        </ol>
        {ex.err && ex.err[0] ? <p className="excard-err"><Icon name="x" className="err-ic" />Səhv: {ex.err[0]}</p> : null}
        {slot.ss ? <p className="text-xs text-ink3 mt-2">{slot.ss}</p> : null}
        {logger}
        <div className="excard-alt">
          <label className="swap" htmlFor={`alt-${slotKey}`}>
            <span>Alət məşğuldur?</span>
            <select id={`alt-${slotKey}`} className="select select-sm" value={vi} onChange={(e) => onChoose(Number(e.target.value))}>
              {slot.ex.map((eid, i) => <option key={eid} value={i}>{i === 0 ? 'Əsas: ' : `Alt ${i}: `}{EX[eid].az}</option>)}
            </select>
          </label>
          <button type="button" className="btn-xs" onClick={onMore}>Böyük bax</button>
        </div>
      </div>
      <div className="excard-ana">
        <Anatomy primary={ex.p} secondary={ex.s} compact showHoverLabel={false} label={`${ex.az}: işləyən əzələlər`} />
        <div className="excard-ana-cap">Qırmızı — əsas, açıq — köməkçi</div>
      </div>
    </article>
  );
}
