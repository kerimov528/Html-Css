import { Card, H2, Eyebrow, Segmented, Pill, Modal, Icon, HowTo } from './ui.jsx';
import { Anatomy, AnatomyLegend } from './anatomy.jsx';
import { RigFigure } from './rig.jsx';
import { ExMedia, hasPhoto } from './media.jsx';
import { ANIMS } from './data/anims.js';
import { EX, DAYS, WARMUP, COOLDOWN, PHASES, MUSCLES, setsFor, restLabel, DELOAD_WEEKS } from './data/exercises.js';
import { lsGet, lsSet } from './util.js';

const { useState, useMemo } = React;

export const VKEY = 'prime-ili:variants';
const ALT_LABELS = ['Əsas', 'Alt 1', 'Alt 2', 'Alt 3'];
const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const MUSCLE_ORDER = ['chest_upper', 'chest', 'delts_front', 'delts_side', 'delts_rear', 'biceps', 'triceps', 'forearms', 'abs', 'obliques',
  'traps', 'upper_back', 'lats', 'lower_back', 'glutes', 'quads', 'hamstrings', 'adductors', 'calves'];

function videoUrl(ex) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${ex.en} proper form`)}`;
}

export function Thumb({ id }) {
  return <ExMedia id={id} size="thumb" still />;
}

// Hansı əzələni hansı hərəkət işlədir — proqramdakı bütün yerlər
function buildIndex() {
  const idx = {};
  const add = (m, rec) => { (idx[m] = idx[m] || []).push(rec); };
  const visit = (slot, key, label, kind) => slot.ex.forEach((id, vi) => {
    EX[id].p.forEach((m) => add(m, { id, key, label, kind, vi, slot, primary: true }));
    EX[id].s.forEach((m) => add(m, { id, key, label, kind, vi, slot, primary: false }));
  });
  Object.values(DAYS).forEach((D) => D.slots.forEach((s, i) => visit(s, `${D.key}${i}`, `${D.title} · ${i + 1}-ci hərəkət`, 'main')));
  WARMUP.forEach((w, i) => visit(w, `W${i}`, `İsinmə · ${w.label}`, 'warm'));
  return idx;
}
const INDEX = buildIndex();

export function Training({ ctx, day, setDay, variants, onChooseVariant, onOpenEx }) {
  const [mode, setMode] = useState('plan');
  const [phaseN, setPhaseN] = useState(ctx.week > 0 ? ctx.phase.n : 1);
  const [deload, setDeload] = useState(DELOAD_WEEKS.includes(ctx.week));
  const [muscle, setMuscle] = useState('chest');
  const setOpen = onOpenEx;

  const D = DAYS[day];
  const phase = PHASES.find((p) => p.n === phaseN);
  const minutes = useMemo(() => {
    const work = D.slots.reduce((a, s) => a + setsFor(s, phaseN, deload) * (45 + s.rest), 0);
    return Math.round(work / 60 + 10);
  }, [day, phaseN, deload]);

  const muscleSet = useMemo(() => {
    const p = new Set(); const s = new Set();
    D.slots.forEach((sl, i) => {
      const ex = EX[sl.ex[variants[`${day}${i}`] || 0]];
      ex.p.forEach((m) => p.add(m)); ex.s.forEach((m) => s.add(m));
    });
    return { p: [...p], s: [...s].filter((m) => !p.has(m)) };
  }, [day, variants]);

  const pickMuscle = (m) => { setMuscle(m); setMode('muscle'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="grid gap-5">
      <HowTo>
        {mode === 'plan'
          ? <>Bu, bütün hərəkətlərin kitabxanasıdır. Gündəlik məşq planı <b>«Bu gün»</b> bölməsindədir. Burada günü (A, B, C) seçib hərəkətə bas, ya da <b>«Əzələyə görə»</b> rejimində əzələni seç — onu işlədən hərəkətlər çıxacaq.</>
          : <>Xəritədə <b>əzələnin üstünə bas</b> və ya aşağıdakı siyahıdan seç — sağda onu işlədən bütün hərəkətlər çıxacaq. Hərəkətə bas → animasiya açılır.</>}
      </HowTo>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>Həftədə 3 gün · hər gün bütün bədən</Eyebrow>
            <h2 className="h2 mt-1">{mode === 'plan' ? `${D.title}: ${D.focus}` : 'Əzələyə görə hərəkətlər'}</h2>
            {mode === 'plan' ? <p className="text-ink2 text-sm mt-1">{D.when} · təxminən <b className="num text-ink">{minutes} dəq</b> · RIR {phase.rir}</p> : <p className="text-ink2 text-sm mt-1">Proqramdakı bütün hərəkətlər əzələlərə görə qruplaşdırılıb.</p>}
          </div>
          <Segmented label="Görünüş" value={mode} onChange={setMode} options={[{ value: 'plan', label: 'Gün planı' }, { value: 'muscle', label: 'Əzələyə görə' }]} />
        </div>
        {mode === 'plan' ? (
          <div className="ctrl-row mt-4">
            <div className="ctrl">
              <span className="ctrl-k">Gün</span>
              <Segmented label="Məşq günü" value={day} onChange={setDay} options={[
                { value: 'A', label: 'A', sub: 'Ç.a.' }, { value: 'B', label: 'B', sub: 'C.a.' }, { value: 'C', label: 'C', sub: 'Şənbə' },
              ]} />
            </div>
            <label className="ctrl" htmlFor="phase-select">
              <span className="ctrl-k">Faza</span>
              <select id="phase-select" className="select" value={phaseN} onChange={(e) => setPhaseN(Number(e.target.value))}>
                {PHASES.map((p) => <option key={p.n} value={p.n}>{p.n}. {p.name} (həftə {p.from}–{p.to})</option>)}
              </select>
            </label>
            <label className="check-inline">
              <input id="deload-toggle" type="checkbox" checked={deload} onChange={(e) => setDeload(e.target.checked)} />
              <span>Deload həftəsi (setlər yarıya)</span>
            </label>
          </div>
        ) : null}
      </Card>

      {mode === 'plan' ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_330px] items-start">
          <div className="grid gap-5 min-w-0">
            <Card>
              <H2 sub="Hər məşqdən əvvəl 10 dəqiqə. Sonra ilk əsas hərəkətdə rampa setləri: işçi çəkinin 50%-i × 10, 70%-i × 5, 85%-i × 2–3.">İsinmə</H2>
              <ul className="grid gap-2">
                {WARMUP.map((w, i) => {
                  const key = `W${i}`;
                  const vi = variants[key] || 0;
                  const id = w.ex[vi];
                  return (
                    <li key={key}>
                      <ExRow id={id} idx={`İ${i + 1}`} top={w.label} dose={<b>{w.dose}</b>} alt={vi} onOpen={() => setOpen({ key, slot: w, kind: 'warm' })} warm />
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card>
              <H2 sub="Hər gün bütün bədən: bud önü, bud arxası, sinə, kürək, çiyin, qollar, qarın. Alət məşğuldursa, pəncərədə alternativi seç.">Əsas hissə</H2>
              <ol className="grid gap-2">
                {D.slots.map((s, i) => {
                  const key = `${day}${i}`;
                  const vi = variants[key] || 0;
                  const id = s.ex[vi];
                  const sets = setsFor(s, phaseN, deload);
                  return (
                    <li key={key}>
                      <ExRow id={id} idx={i + 1} alt={vi} pr={s.pr} top={s.g}
                        dose={<><b>{sets} × {s.reps}</b><span className="block text-ink3 text-xs">{restLabel(s.rest)} istirahət</span></>}
                        onOpen={() => setOpen({ key, slot: s, kind: 'main' })} />
                      {s.ss ? <p className="text-xs text-ink3 pl-2 pt-1">{s.ss}</p> : null}
                    </li>
                  );
                })}
              </ol>
            </Card>

            <Card>
              <H2>Bitiriş</H2>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <h3 className="h4">Kardio (faza 2-dən)</h3>
                  <p className="text-sm text-ink2 mt-1">10–15 dəq meyilli zolaqda yeriş (meyil 8–12%, 5 km/saat). Qaçış lazım deyil — əzələ bərpasına mane olmadan yağ yandırır.</p>
                </div>
                <div>
                  <h3 className="h4">Dartılma, 5 dəq (ayaq üstə)</h3>
                  <ul className="list-dot mt-1">
                    {COOLDOWN.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          <aside className="grid gap-5 lg:sticky lg:top-[72px]">
            <Card>
              <Eyebrow>{D.title}-da işləyən əzələlər</Eyebrow>
              <div className="mt-2"><Anatomy primary={muscleSet.p} secondary={muscleSet.s} compact onPick={pickMuscle} label={`${D.title} xəritəsi`} /></div>
              <AnatomyLegend />
              <p className="text-xs text-ink3 mt-2">Əzələyə bas → onu işlədən bütün hərəkətlər.</p>
            </Card>
            <WeeklyBalance variants={variants} phaseN={phaseN} deload={deload} />
            <Card>
              <h3 className="h4">Çəkini necə artırım?</h3>
              <p className="text-sm text-ink2 mt-1">İkiqat progressiya: məsələn <b className="num">3 × 8–10</b>. Bütün setlərdə 10 təkrar alındısa, növbəti məşqdə çəkini 2.5 kq (hantel 1–2 kq) artır və yenə 8-dən başla.</p>
              <h3 className="h4 mt-4">RIR nədir?</h3>
              <p className="text-sm text-ink2 mt-1">"Ehtiyatda qalan təkrar". RIR 2 = setin sonunda daha 2 təkrar edə bilərdin, amma dayandın. Texnika pozulursa, set bitib.</p>
              <h3 className="h4 mt-4">Məşq jurnalı</h3>
              <p className="text-sm text-ink2 mt-1">Telefonun qeydlərində hər hərəkətin çəkisini və təkrarını yaz. İrəliləyiş rəqəmdədir.</p>
            </Card>
          </aside>
        </div>
      ) : (
        <MuscleExplorer muscle={muscle} setMuscle={setMuscle} onOpen={(r) => setOpen({ key: r.key, slot: r.slot, kind: r.kind, view: r.vi })} />
      )}

    </div>
  );
}

function ExRow({ id, idx, top, dose, alt, pr, onOpen, warm }) {
  const ex = EX[id];
  return (
    <button type="button" className={`ex-row ${warm ? 'ex-warm' : ''}`} onClick={onOpen}>
      <span className="ex-idx">{idx}</span>
      <Thumb id={id} />
      <span className="min-w-0 grid gap-1">
        {top ? <span className="text-[0.72rem] font-bold uppercase tracking-wider text-ink3">{top}</span> : null}
        <span className="ex-name">{ex.az}{alt ? <Pill tone="cobalt" className="ml-2 align-middle">{ALT_LABELS[alt]}</Pill> : null}</span>
        <span className="flex flex-wrap gap-1">
          {ex.p.map((m) => <span key={m} className="mchip mchip-p">{MUSCLES[m]}</span>)}
          {pr ? <span className="mchip mchip-pr" title="Faza 3 və 5-də +1 set">+1 set (F3, F5)</span> : null}
        </span>
      </span>
      <span className="ex-dose num">{dose}</span>
      <span className="ex-open"><Icon name="play" className="icon-sm" />Bax</span>
    </button>
  );
}

// Həftəlik set balansı: əsas əzələ = tam set, köməkçi = yarım set
const BAL_GROUPS = [
  ['Sinə', ['chest', 'chest_upper']], ['Kürək', ['lats', 'upper_back']], ['Çiyin', ['delts_front', 'delts_side', 'delts_rear']],
  ['Biseps', ['biceps']], ['Triseps', ['triceps']], ['Bud önü', ['quads']], ['Bud arxası', ['hamstrings']],
  ['Sağrı', ['glutes']], ['Baldır', ['calves']], ['Qarın', ['abs', 'obliques']],
];
function WeeklyBalance({ variants, phaseN, deload }) {
  const rows = BAL_GROUPS.map(([name, ids]) => {
    let v = 0;
    Object.values(DAYS).forEach((D) => D.slots.forEach((sl, i) => {
      const ex = EX[sl.ex[variants[`${D.key}${i}`] || 0]];
      const sets = setsFor(sl, phaseN, deload);
      if (ex.p.some((m) => ids.includes(m))) v += sets; else if (ex.s.some((m) => ids.includes(m))) v += sets / 2;
    }));
    return [name, v];
  });
  const max = Math.max(16, ...rows.map((r) => r[1]));
  return (
    <Card>
      <h3 className="h4">Həftəlik balans (set)</h3>
      <p className="text-xs text-ink3 mt-0.5">Seçilmiş faza üzrə, 3 gün birlikdə. Köməkçi iş yarım set sayılır.</p>
      <ul className="bal mt-3">
        {rows.map(([n, v]) => (
          <li key={n}>
            <span className="bal-n">{n}</span>
            <span className="bal-bar"><i style={{ width: `${(v / max) * 100}%` }} /></span>
            <span className="bal-v num">{Number.isInteger(v) ? v : v.toFixed(1).replace('.', ',')}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink3 mt-2">Yeni başlayan üçün hər əzələyə həftədə 6–12 set kifayətdir; faza 3-dən 10–16.</p>
    </Card>
  );
}

function MuscleExplorer({ muscle, setMuscle, onOpen }) {
  const list = INDEX[muscle] || [];
  const uniq = (arr) => { const seen = new Set(); return arr.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true))); };
  const prim = uniq(list.filter((r) => r.primary));
  const sec = uniq(list.filter((r) => !r.primary && !prim.some((p) => p.id === r.id)));
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr] items-start">
      <Card className="lg:sticky lg:top-[72px]">
        <Anatomy primary={[muscle]} onPick={setMuscle} focus={muscle} label={`Seçilmiş əzələ: ${MUSCLES[muscle]}`} />
        <div className="muscle-pick mt-3" role="listbox" aria-label="Əzələ seç">
          {MUSCLE_ORDER.map((m) => (
            <button key={m} type="button" role="option" aria-selected={m === muscle} className={m === muscle ? 'on' : ''} onClick={() => setMuscle(m)}>{MUSCLES[m]}</button>
          ))}
        </div>
      </Card>
      <div className="grid gap-5 min-w-0">
        <Card>
          <Eyebrow>Seçilmiş əzələ</Eyebrow>
          <h2 className="h2 mt-1">{MUSCLES[muscle]}</h2>
          <h3 className="h4 mt-4 flex items-center gap-2"><i className="legend-dot bg-muscle" />Əsas işlədən hərəkətlər ({prim.length})</h3>
          <ul className="grid gap-2 mt-2">
            {prim.map((r) => <li key={r.id}><FoundRow r={r} onOpen={onOpen} /></li>)}
          </ul>
          {sec.length ? (
            <>
              <h3 className="h4 mt-5 flex items-center gap-2"><i className="legend-dot bg-muscle2" />Köməkçi kimi işlədən ({sec.length})</h3>
              <ul className="grid gap-2 mt-2">
                {sec.map((r) => <li key={r.id}><FoundRow r={r} onOpen={onOpen} /></li>)}
              </ul>
            </>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function FoundRow({ r, onOpen }) {
  const ex = EX[r.id];
  return (
    <button type="button" className="ex-row" onClick={() => onOpen(r)}>
      <Thumb id={r.id} />
      <span className="min-w-0 grid gap-0.5">
        <span className="ex-name">{ex.az}</span>
        <span className="text-xs text-ink3">{r.label}{r.vi ? ` · ${ALT_LABELS[r.vi]}` : ' · əsas variant'}</span>
      </span>
      <span className="text-xs text-ink3 hidden sm:block">{ex.eq}</span>
      <span className="ex-open"><Icon name="play" className="icon-sm" />Bax</span>
    </button>
  );
}

function Player({ id }) {
  const ex = EX[id];
  const spec = ANIMS[id];
  const [playing, setPlaying] = useState(!REDUCED);
  const [slow, setSlow] = useState(false);
  const [ph, setPh] = useState(0);
  const cyc = spec.cycle || spec.keys;
  const lab = spec.labels || ['', ''];
  const text = cyc ? lab[0] : ph === 0 ? lab[0] : ph === 1 ? 'Sıx — 1 saniyə saxla' : ph === 2 ? lab[1] : 'Başlanğıc vəziyyəti';
  const dot = cyc ? 'up' : ph === 0 || ph === 1 ? 'up' : ph === 2 ? 'down' : '';
  return (
    <div className="stage">
      <RigFigure spec={spec} primary={ex.p} secondary={ex.s} playing={playing} speed={slow ? 0.5 : 1} onPhase={setPh} still={!playing && REDUCED} />
      <div className="rig-ctrl">
        <span className="phase" aria-live="polite"><i className={`phase-dot ${playing ? dot : ''}`} />{playing ? text : 'Dayandırılıb'}</span>
        <span className="flex-1" />
        <button type="button" className="btn-xs" onClick={() => setSlow(!slow)} aria-pressed={slow}>{slow ? 'Normal sürət' : 'Yavaş'}</button>
        <button type="button" className="btn-xs btn-cobalt" onClick={() => setPlaying(!playing)}>{playing ? 'Dayandır' : 'Oynat'}</button>
      </div>
    </div>
  );
}

export function ExerciseModal({ open, data, variants, onChoose, onClose, phaseN, deload }) {
  const [view, setView] = useState(null);
  const key = data ? data.key : null;
  const active = data ? variants[key] || 0 : 0;
  const shown = view == null ? (data && data.view != null ? data.view : active) : view;

  const [lastData, setLastData] = useState(null);
  if (data !== lastData) { setLastData(data); setView(null); }

  if (!open || !data) return <Modal open={false} onClose={onClose} />;
  const { slot, kind } = data;
  const id = slot.ex[shown];
  const ex = EX[id];
  const sets = kind === 'main' ? setsFor(slot, phaseN, deload) : null;
  const titleId = 'ex-modal-title';
  const dual = hasPhoto(id) && !!ANIMS[id];

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="modal-head">
        <Eyebrow>{kind === 'warm' ? `İsinmə · ${slot.label}` : 'Hərəkət'} · {ex.eq}</Eyebrow>
        <h2 id={titleId} className="h2 mt-1 pr-10">{ex.az}</h2>
        <p className="text-ink3 text-sm">{ex.en}</p>
        <div className="mt-3">
          <div className="text-xs font-bold text-ink2 mb-1.5">Variantlar — zalda alət məşğuldursa, digərini seç:</div>
          <div className="variant-tabs" role="tablist" aria-label="Variantlar">
            {slot.ex.map((vid, i) => (
              <button key={vid} type="button" role="tab" aria-selected={i === shown} className={i === shown ? 'on' : ''} onClick={() => setView(i)}>
                <span className="vt-k">{ALT_LABELS[i]}{i === active ? ' · siyahıda' : ''}</span>
                <span className="vt-n">{EX[vid].az}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="modal-body">
        {dual ? (
          <div className="dualview mb-5">
            <div className="min-w-0"><div className="dv-cap"><i />Real insan · başlanğıc ↔ son</div><div className="stage stage-photo"><ExMedia id={id} size="big" /></div></div>
            <div className="min-w-0"><div className="dv-cap mus"><i />Hansı əzələ işləyir — qırmızı yanan yer</div><Player key={id + 'r'} id={id} /></div>
          </div>
        ) : null}
        <div className="grid gap-5 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="min-w-0 grid gap-3 content-start">
            {dual ? null : hasPhoto(id) ? <div className="stage stage-photo"><ExMedia id={id} size="big" /></div> : <Player key={id} id={id} />}
            <div className="rx">
              {kind === 'main' ? (
                <>
                  <div><span className="rx-k">Set × təkrar</span><span className="rx-v num">{sets} × {slot.reps}</span></div>
                  <div><span className="rx-k">İstirahət</span><span className="rx-v num">{restLabel(slot.rest)}</span></div>
                  <div><span className="rx-k">Temp</span><span className="rx-v num">2–0–1</span></div>
                </>
              ) : (
                <div><span className="rx-k">Doza</span><span className="rx-v num">{slot.dose}</span></div>
              )}
            </div>
            {kind === 'main' ? <p className="text-xs text-ink3">Temp 2–0–1: endirmə 2 saniyə, pauza yoxdur, qaldırma 1 saniyə.</p> : null}
          </div>
          <div className="min-w-0 grid gap-4 content-start">
            <div>
              <h3 className="h4 mb-2">İşləyən əzələlər</h3>
              <div className="ana-modal"><Anatomy primary={ex.p} secondary={ex.s} /></div>
              <div className="flex flex-wrap gap-1 mt-2">
                {ex.p.map((m) => <span key={m} className="mchip mchip-p">{MUSCLES[m]}</span>)}
                {ex.s.map((m) => <span key={m} className="mchip">{MUSCLES[m]}</span>)}
              </div>
            </div>
            <div>
              <h3 className="h4">Düzgün forma</h3>
              <ol className="steps mt-2">
                {ex.cues.map((c) => <li key={c}>{c}</li>)}
              </ol>
            </div>
            {ex.err && ex.err.length ? (
              <div>
                <h3 className="h4">Səhvlər</h3>
                <ul className="errs mt-2">
                  {ex.err.map((c) => <li key={c}><Icon name="x" className="err-ic" />{c}</li>)}
                </ul>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              {shown !== active ? (
                <button type="button" className="btn btn-primary" onClick={() => onChoose(key, shown)}>
                  <Icon name="swap" />Siyahıda bunu göstər
                </button>
              ) : <span className="pill pill-good"><Icon name="check" className="icon-sm" />Siyahıda bu variant var</span>}
              <a className="btn btn-ghost" href={videoUrl(ex)} target="_blank" rel="noopener noreferrer"><Icon name="play" />YouTube-da bax</a>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
