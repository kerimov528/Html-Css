import { Card, H2, Eyebrow, Segmented, Pill, HowTo, Icon } from './ui.jsx';
import { PHASES, MILESTONES, DELOAD_WEEKS, DIET_BREAK_WEEKS, DAYS } from './data/exercises.js';
import { PROFILE, rfm, DOW_NAMES, dayPlan, fmtDate, fmtInt, addDays, fromISO, JAN_SWITCH, fmtNum, stepsTarget } from './util.js';

const { useState } = React;

const KIND_LABEL = { train: 'Məşq', swim: 'Hovuz', walk: 'Gəzinti', measure: 'Ölçmə', prep: 'Hazırlıq', steps: 'Addım' };

export function Overview({ ctx, targets, latestWeight, latestWaist = PROFILE.startWaist, onGo }) {
  const { week, phase, startISO, today } = ctx;
  const [sched, setSched] = useState(today >= JAN_SWITCH ? 'jan' : 'now');
  const bmi = latestWeight / ((PROFILE.height / 100) ** 2);
  const order = [1, 2, 3, 4, 5, 6, 0];
  const start = fromISO(startISO);

  return (
    <div className="grid gap-5">
      <HowTo>Bu səhifə 12 aylıq planın ümumi məntiqidir: hədəflər, qrafik, fazalar. Gündəlik nə edəcəyin üçün <b>«Bu gün»</b> bölməsinə bax.</HowTo>
      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <Card>
          <H2 sub="Ölçmələrinə və hədəfinə əsasən hesablanıb. Çəki dəyişdikcə İnkişaf bölməsindən avtomatik yenilənir.">Profil və gündəlik hədəflər</H2>
          <dl className="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-3 mb-5">
            <Stat k="Yaş · boy" v={`${PROFILE.age} · ${PROFILE.height} sm`} />
            <Stat k="Hazırkı çəki" v={`${fmtNum(latestWeight)} kq`} />
            <Stat k="BMI" v={fmtNum(bmi)} note={bmi >= 25 ? 'artıq çəki' : 'norma'} />
            <Stat k="Bel · bel/boy" v={`${fmtNum(latestWaist, 0)} sm · ${fmtNum(latestWaist / PROFILE.height, 2)}`} note={latestWaist / PROFILE.height >= 0.5 ? `sağlam hədd < ${fmtNum(PROFILE.height / 2)} sm` : 'sağlam aralıq'} />
            <Stat k="Təxmini yağ" v={`≈${Math.round(rfm(latestWaist))}%`} note="boy və beldən (RFM)" />
          </dl>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Target big={fmtInt(targets.train)} unit="kcal" k="Məşq günü" sub={`K ${targets.carbsTrain} q`} />
            <Target big={fmtInt(targets.rest)} unit="kcal" k="İstirahət günü" sub={`K ${targets.carbsRest} q`} />
            <Target big={`${targets.protein}`} unit="q" k="Protein (hər gün)" sub={`Yağ ${targets.fat} q`} accent />
            <Target big={`${targets.glassesTrain}`} unit="stəkan" k="Su (məşq günü)" sub={`İstirahət: ${targets.glassesRest} stəkan`} />
          </div>
          <details className="disclose mt-4">
            <summary>Necə hesablandı?</summary>
            <p>Bazal metabolizm (Mifflin-St Jeor): <b className="num">{fmtInt(targets.bmr)} kcal</b>. Ofis işi, {fmtInt(stepsTarget(phase.n))} addım və həftədə 3 məşq üçün əmsal 1.45 → gündəlik sərfiyyat <b className="num">≈ {fmtInt(targets.tdee)} kcal</b>.
              {targets.mode === 'deficit' ? ` Bu fazada gündə ≈ ${Math.abs(targets.deficit)} kcal defisit: həftədə ≈ ${fmtNum(Math.abs(targets.deficit) * 7 / 7700, 1)} kq yağ itkisi — əzələ qorunur (faza 1–2-də 450, faza 3–4-də 250 kcal; İnkişafdakı hədəf xətti də bu templə çəkilib).` : targets.mode === 'maintenance' ? ' Bu həftə kalori fasiləsidir: saxlama səviyyəsində ye.' : ' Prime fazası: saxlama + 150 kcal, təmiz kütlə üçün.'}
              {' '}Protein 180 q (hədəf çəkinin hər kq-na ≈ 2.2 q) əzələni defisitdə qoruyur. Su: istirahət günü ≈ {fmtNum(targets.waterRest)} l (<b className="num">{targets.glassesRest} stəkan</b>), məşq günü ≈ {fmtNum(targets.waterTrain)} l (<b className="num">{targets.glassesTrain} stəkan</b>); 1 stəkan = 250 ml.</p>
          </details>
        </Card>

        <Card className="expect">
          <Eyebrow>Gözləntilər</Eyebrow>
          <h3 className="h3 mt-1">Şəkillərdəki forma nə qədər vaxt aparır?</h3>
          <div className="grid gap-3 mt-3 text-[0.94rem] leading-relaxed text-ink2">
            <p><b className="text-ink">İkinci şəkildəki</b> quru, atletik görünüş — dar bel, görünən press, formalı sinə və qollar — sənin üçün real hədəfdir. 12 ayda bel və press baxımından ona çox yaxınlaşacaqsan; əzələ həcmi üçün 18–24 ay lazımdır.</p>
            <p><b className="text-ink">Birinci şəkildəki</b> çox böyük sinə və qol həcmi adətən 4–6+ il ardıcıl məşqin nəticəsidir. Bu il həmin yolun ən sürətli hissəsidir: yeni başlayanlar ilk ildə ən çox əzələ yığır.</p>
            <p className="text-ink">Proqnoz: {fmtNum(PROFILE.startWeight)} → {PROFILE.goalWeight} kq, bel −10–13 sm, +3–5 kq əzələ.</p>
          </div>
        </Card>
      </div>

      <Card>
        <H2
          sub={sched === 'now' ? 'B.e. və həftəsonu evdəsən; iş Ç.a.–C.' : '1 yanvardan Cümə və həftəsonu evdəsən; iş B.e.–C.a.'}
          right={<Segmented label="Qrafik" value={sched} onChange={setSched} options={[{ value: 'now', label: 'İndiki' }, { value: 'jan', label: '1 yanvardan' }]} />}
        >
          Həftəlik qrafik
        </H2>
        <div className="week-grid">
          {order.map((dow) => {
            const plan = dayPlan(dow, sched, phase.n, ctx.homeWake);
            const isToday = today.getDay() === dow && ((sched === 'jan') === (today >= JAN_SWITCH));
            return (
              <div key={dow} className={`day ${plan.items.some((i) => i.k === 'train') ? 'day-train' : ''} ${isToday ? 'day-today' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="day-name">{DOW_NAMES[dow]}</span>
                  {isToday ? <Pill tone="cobalt">Bu gün</Pill> : null}
                </div>
                <div className={`day-status ${plan.work ? '' : 'home'}`}>{plan.work ? 'İş 09:00–18:00' : 'Evdə'}</div>
                <ul className="grid gap-1.5 mt-2">
                  {plan.items.map((it, i) => (
                    <li key={i} className={`day-item k-${it.k}`}>
                      <span className="day-kind">{KIND_LABEL[it.k]}</span>
                      <span className="min-w-0">
                        <span className="text-ink font-semibold">{it.t}</span>
                        {it.s ? <span className="block text-ink3 text-xs">{it.s}</span> : null}
                        {it.k === 'train' ? (
                          <button type="button" className="btn-go mt-1.5" onClick={() => onGo('bugun', dow)}>Günün planı<Icon name="arrow" className="icon-sm" /></button>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <H2 sub="Ç.a. və C.a. günləri işdən birbaşa zala (Məşqlər bölməsində seçdiyin zal) — evə getmədən.">İş günündə məşq necə keçir</H2>
          <ol className="timeline">
            {[
              ['07:00', 'Oyan, tərəzi, 2 stəkan su'],
              ['07:30', 'Səhər yeməyi + D3, Omega-3'],
              ['09:00', 'İş. Hər saat 3–5 dəq ayağa qalx'],
              ['13:00', 'Nahar (evdən sefer tası)'],
              ['16:30', 'Ara öyün — məşqə enerji'],
              ['18:15', 'Zala keç. Paltar çantası səhərdən hazır'],
              ['18:30', 'İsinmə 10 dəq → məşq: faza 1-də ≈ 50 dəq, sonra 65–85 dəq'],
              ['21:00', 'Evə çatan kimi şam + kreatin 5 q'],
              ['22:45', 'Kəsmik və ya kefir, maqnezium'],
              ['23:15', 'Yuxu — 7,5–8 saat'],
            ].map(([t, x]) => (
              <li key={t}><span className="num tl-time">{t}</span><span>{x}</span></li>
            ))}
          </ol>
        </Card>

        <Card>
          <H2 sub={`${fmtDate(start)} başlanğıc · ${fmtDate(addDays(start, 7 * 52 - 1))} sonu. Hər 8 həftədən bir yüngülləşdirmə (deload) həftəsi.`}>12 aylıq yol xəritəsi</H2>
          <div className="roadmap" role="img" aria-label={`52 həftəlik plan. Hazırda ${week || 0}-cı həftə, ${phase.name} fazası.`}>
            {PHASES.map((p) => (
              <div key={p.n} className={`rm-phase ${p.n === phase.n && week > 0 ? 'on' : ''}`} style={{ flexGrow: p.to - p.from + 1 }}>
                <span className="rm-n">F{p.n}</span>
              </div>
            ))}
            <div className="rm-now" style={{ left: `${(Math.max(0, week - 0.5) / 52) * 100}%` }} hidden={week < 1} />
          </div>
          <div className="flex justify-between text-[0.7rem] text-ink3 num mt-1"><span>H1</span><span>H13</span><span>H26</span><span>H39</span><span>H52</span></div>
          <ul className="grid gap-3 mt-4">
            {PHASES.map((p) => (
              <li key={p.n} className={`phase-row ${p.n === phase.n ? 'on' : ''}`}>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="phase-tag">Faza {p.n}</span>
                  <b className="text-ink">{p.name}</b>
                  <span className="text-ink3 text-xs num">həftə {p.from}–{p.to} · RIR {p.rir}</span>
                </div>
                <p className="text-sm text-ink2 mt-0.5">{p.goal}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink3 mt-3">Deload: {DELOAD_WEEKS.join(', ')}-cı həftələr (setlər yarıya). Kalori fasiləsi: {DIET_BREAK_WEEKS.join(' və ')}-cü həftələr.</p>
        </Card>
      </div>

      <Card>
        <H2 sub="Orta proqnoz. Hər bədən fərqlidir; real rəqəmlərin İnkişaf qrafikində hədəf xətti ilə müqayisə olunacaq.">Mərhələlər</H2>
        <ol className="milestones">
          {MILESTONES.map((m) => (
            <li key={m.week} className={week >= m.week ? 'done' : ''}>
              <div className="ms-head"><span className="h3">{m.title}</span><span className="num ms-kg">{m.kg} kq</span></div>
              <p className="text-sm text-ink2">{m.text}</p>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <H2>Bütün ili daşıyan 6 qayda</H2>
        <ol className="rules">
          {[
            ['Hər öyündə protein', 'Ovuc boyda ət, balıq, yumurta və ya kəsmik — 4 öyün × 40–50 q.'],
            ['Progressiv yüklənmə', 'Təkrar aralığının yuxarısına çatdınsa, növbəti dəfə çəkini 2.5–5% artır.'],
            ['Addım məşqdən vacibdir', `Yağ yandırmanın gizli silahı: gündə ${fmtInt(stepsTarget(phase.n))}+ addım.`],
            ['Yuxu 7,5–9 saat', 'Az yuxu iştahı artırır, əzələ bərpasını yavaşladır. İş günlərində 23:15-də yat.'],
            ['Səhər ölçməsi', 'Çəki — hər səhər (ən azı bazar), bel — bazar günü. Bir günlük rəqəmə yox, 7 günlük ortaya bax.'],
            ['85% qaydası', 'Mükəmməl həftə olmur. 10 öyündən 8–9-u plana uyğundursa, nəticə gəlir.'],
          ].map(([t, x]) => (
            <li key={t}><b className="text-ink">{t}</b><span className="text-ink2 text-sm">{x}</span></li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Stat({ k, v, note }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.72rem] uppercase tracking-wider text-ink3">{k}</dt>
      <dd className="num text-lg text-ink font-semibold leading-tight">{v}</dd>
      {note ? <dd className="text-xs text-ink3">{note}</dd> : null}
    </div>
  );
}

function Target({ big, unit, k, sub, accent }) {
  return (
    <div className={`target ${accent ? 'target-accent' : ''}`}>
      <div className="text-[0.72rem] uppercase tracking-wider target-k">{k}</div>
      <div className="flex items-baseline gap-1"><span className="display-num">{big}</span><span className="target-unit">{unit}</span></div>
      <div className="text-xs target-sub num">{sub}</div>
    </div>
  );
}

export function TodayStrip({ ctx }) {
  const { today, week, phase, startISO } = ctx;
  const sched = today >= JAN_SWITCH ? 'jan' : 'now';
  const plan = dayPlan(today.getDay(), sched, phase.n, ctx.homeWake);
  const train = plan.items.find((i) => i.k === 'train');
  const before = week === 0;
  return (
    <div className="today">
      <div className="today-k">Bu gün · {DOW_NAMES[today.getDay()]}, {fmtDate(today)}</div>
      {before ? (
        <div className="today-v">Proqram {fmtDate(fromISO(startISO))} başlayır. Bu həftə zalı tanı: Cümə axşamı və Şənbə yüngül çəki ilə hərəkətləri sına.</div>
      ) : (
        <div className="today-v">{plan.work ? 'İş günü' : 'Evdəsən'} · {train ? `${train.t} — ${DAYS[train.t.slice(5, 6)].focus}` : plan.items.filter((i) => i.k !== 'steps').map((i) => i.t).join(' · ') || 'İstirahət'} · {plan.items.find((i) => i.k === 'steps').t}</div>
      )}
    </div>
  );
}
