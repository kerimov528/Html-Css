import { Card, H2, Eyebrow, Segmented, Pill, Modal, Icon } from './ui.jsx';
import { Anatomy, AnatomyLegend } from './anatomy.jsx';
import { EX, DAYS, WARMUP, COOLDOWN, PHASES, MUSCLES, setsFor, restLabel, DELOAD_WEEKS } from './data/exercises.js';
import { lsGet, lsSet } from './util.js';

const { useState, useMemo } = React;

const VKEY = 'prime-ili:variants';
const ALT_LABELS = ['Əsas', 'Alt 1', 'Alt 2', 'Alt 3'];

function videoUrl(ex) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${ex.en} proper form`)}`;
}

export function Training({ ctx, day, setDay }) {
  const [phaseN, setPhaseN] = useState(ctx.week > 0 ? ctx.phase.n : 1);
  const [deload, setDeload] = useState(DELOAD_WEEKS.includes(ctx.week));
  const [variants, setVariants] = useState(() => lsGet(VKEY, {}));
  const [open, setOpen] = useState(null); // {key, slot, kind}

  const chooseVariant = (key, idx) => {
    const next = { ...variants, [key]: idx };
    setVariants(next);
    lsSet(VKEY, next);
  };

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

  return (
    <div className="grid gap-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>Həftədə 3 gün · tam bədən · sinə və qol prioriteti</Eyebrow>
            <h2 className="h2 mt-1">{D.title}: {D.focus}</h2>
            <p className="text-ink2 text-sm mt-1">{D.when} · təxminən <b className="num text-ink">{minutes} dəq</b> · RIR {phase.rir}</p>
          </div>
          <Segmented label="Məşq günü" value={day} onChange={setDay} options={[
            { value: 'A', label: 'A', sub: 'Ç.a.' }, { value: 'B', label: 'B', sub: 'C.a.' }, { value: 'C', label: 'C', sub: 'Şənbə' },
          ]} />
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <span className="text-xs uppercase tracking-wider text-ink3">Faza</span>
          <Segmented size="sm" label="Faza" value={phaseN} onChange={setPhaseN} options={PHASES.map((p) => ({ value: p.n, label: `F${p.n}` }))} />
          <label className="check-inline">
            <input id="deload-toggle" type="checkbox" checked={deload} onChange={(e) => setDeload(e.target.checked)} />
            <span>Deload həftəsi</span>
          </label>
          <span className="text-xs text-ink3">{phase.name} · həftə {phase.from}–{phase.to}</span>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px] items-start">
        <div className="grid gap-5 min-w-0">
          <Card>
            <H2 sub="Hər məşqdən əvvəl 10 dəqiqə. Sonra ilk əsas hərəkətdə rampa setləri: işçi çəkinin 50%-i × 10, 70%-i × 5, 85%-i × 2–3.">İsinmə</H2>
            <ul className="grid gap-2">
              {WARMUP.map((w, i) => {
                const key = `W${i}`;
                const ex = EX[w.ex[variants[key] || 0]];
                return (
                  <li key={key}>
                    <button type="button" className="ex-row ex-warm" onClick={() => setOpen({ key, slot: w, kind: 'warm' })}>
                      <span className="ex-idx">İ{i + 1}</span>
                      <span className="min-w-0 grid">
                        <span className="text-[0.72rem] uppercase tracking-wider text-ink3">{w.label}</span>
                        <span className="ex-name">{ex.az}</span>
                      </span>
                      <span className="ex-dose num">{w.dose}</span>
                      <Icon name="arrow" className="ex-go" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <H2 sub="Hərəkətə toxun: əzələ xəritəsi, düzgün forma və 3 alternativ açılır. Zalda alət məşğuldursa, alternativi seç — siyahıda o görünəcək.">Əsas hissə</H2>
            <ol className="grid gap-2">
              {D.slots.map((s, i) => {
                const key = `${day}${i}`;
                const vi = variants[key] || 0;
                const ex = EX[s.ex[vi]];
                const sets = setsFor(s, phaseN, deload);
                return (
                  <li key={key}>
                    <button type="button" className="ex-row" onClick={() => setOpen({ key, slot: s, kind: 'main' })}>
                      <span className="ex-idx">{i + 1}</span>
                      <span className="min-w-0 grid gap-1">
                        <span className="ex-name">{ex.az}{vi ? <Pill tone="cobalt" className="ml-2 align-middle">{ALT_LABELS[vi]}</Pill> : null}</span>
                        <span className="flex flex-wrap gap-1">
                          {ex.p.map((m) => <span key={m} className="mchip">{MUSCLES[m]}</span>)}
                          {s.pr ? <span className="mchip mchip-pr">Prioritet</span> : null}
                        </span>
                      </span>
                      <span className="ex-dose num"><b>{sets} × {s.reps}</b><span className="block text-ink3 text-xs">{restLabel(s.rest)} istirahət</span></span>
                      <Icon name="arrow" className="ex-go" />
                    </button>
                    {s.ss ? <p className="text-xs text-ink3 pl-14 pt-1">{s.ss}</p> : null}
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
            <Eyebrow>Bu gün işləyən əzələlər</Eyebrow>
            <div className="mt-2"><Anatomy primary={muscleSet.p} secondary={muscleSet.s} compact label={`${D.title} xəritəsi`} /></div>
            <AnatomyLegend />
          </Card>
          <Card>
            <h3 className="h4">Çəkini necə artırım?</h3>
            <p className="text-sm text-ink2 mt-1">İkiqat progressiya: məsələn <b className="num">3 × 8–10</b>. Bütün setlərdə 10 təkrar alındısa, növbəti məşqdə çəkini 2.5 kq (hantel 1–2 kq) artır və yenə 8-dən başla.</p>
            <h3 className="h4 mt-4">RIR nədir?</h3>
            <p className="text-sm text-ink2 mt-1">"Ehtiyatda qalan təkrar". RIR 2 = setin sonunda daha 2 təkrar edə bilərdin, amma dayandın. Texnika pozulursa, set bitib.</p>
            <h3 className="h4 mt-4">Məşq jurnalı</h3>
            <p className="text-sm text-ink2 mt-1">Telefonun qeydlərində hər hərəkətin çəkisini və təkrarını yaz. Yaddaşa güvənmə — irəliləyiş rəqəmdədir.</p>
          </Card>
        </aside>
      </div>

      <ExerciseModal
        open={!!open}
        data={open}
        variants={variants}
        onChoose={chooseVariant}
        onClose={() => setOpen(null)}
        phaseN={phaseN}
        deload={deload}
      />
    </div>
  );
}

function ExerciseModal({ open, data, variants, onChoose, onClose, phaseN, deload }) {
  const [view, setView] = useState(null);
  const key = data ? data.key : null;
  const active = data ? variants[key] || 0 : 0;
  const shown = view == null ? active : view;

  // Modal hər açılanda seçilmiş variantdan başlasın
  const [lastKey, setLastKey] = useState(null);
  if (key !== lastKey) { setLastKey(key); setView(null); }

  if (!open || !data) return <Modal open={false} onClose={onClose} />;
  const { slot, kind } = data;
  const ex = EX[slot.ex[shown]];
  const sets = kind === 'main' ? setsFor(slot, phaseN, deload) : null;
  const titleId = 'ex-modal-title';

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="modal-head">
        <Eyebrow>{kind === 'warm' ? `İsinmə · ${slot.label}` : 'Hərəkət'} · {ex.eq}</Eyebrow>
        <h2 id={titleId} className="h2 mt-1 pr-10">{ex.az}</h2>
        <p className="text-ink3 text-sm">{ex.en}</p>
        <div className="variant-tabs mt-3" role="tablist" aria-label="Variantlar">
          {slot.ex.map((id, i) => (
            <button key={id} type="button" role="tab" aria-selected={i === shown} className={i === shown ? 'on' : ''} onClick={() => setView(i)}>
              <span className="vt-k">{ALT_LABELS[i]}{i === active ? ' ✓' : ''}</span>
              <span className="vt-n">{EX[id].az}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="modal-body">
        <div className="grid gap-5 md:grid-cols-[minmax(0,300px)_1fr]">
          <div className="min-w-0">
            <div className="ana-wrap"><Anatomy primary={ex.p} secondary={ex.s} /></div>
            <AnatomyLegend />
            <div className="flex flex-wrap gap-1 mt-3">
              {ex.p.map((m) => <span key={m} className="mchip mchip-p">{MUSCLES[m]}</span>)}
              {ex.s.map((m) => <span key={m} className="mchip">{MUSCLES[m]}</span>)}
            </div>
          </div>
          <div className="min-w-0 grid gap-4 content-start">
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
                  <Icon name="swap" />Bunu edirəm
                </button>
              ) : <span className="pill pill-good"><Icon name="check" className="icon-sm" />Siyahıda bu variant var</span>}
              <a className="btn btn-ghost" href={videoUrl(ex)} target="_blank" rel="noopener noreferrer"><Icon name="play" />Videoda bax</a>
            </div>
            {kind === 'main' ? <p className="text-xs text-ink3">Temp 2–0–1: endirmə 2 saniyə, pauza yoxdur, qaldırma 1 saniyə.</p> : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}
