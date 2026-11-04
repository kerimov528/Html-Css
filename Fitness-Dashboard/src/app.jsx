import { initStore } from './store.js';
import { Overview, TodayStrip } from './overview.jsx';
import { Training } from './training.jsx';
import { Nutrition } from './nutrition.jsx';
import { Supplements } from './supplements.jsx';
import { Progress } from './progress.jsx';
import { PROFILE, DEFAULT_START, programWeek, weekContext, computeTargets, fromISO, fmtDate, fmtNum, toISO } from './util.js';
import { DAYS } from './data/exercises.js';

const { useState, useEffect, useMemo, useRef } = React;

const TABS = [
  ['icmal', 'İcmal'],
  ['mesq', 'Məşq'],
  ['qida', 'Qidalanma'],
  ['elaveler', 'Əlavələr'],
  ['inkisaf', 'İnkişaf'],
];

function readHash() {
  const h = (location.hash || '').replace('#', '');
  return TABS.some(([k]) => k === h) ? h : 'icmal';
}

function useCollection(store, name) {
  const [state, setState] = useState({ data: name.includes('/') ? null : [], loading: true, stale: false });
  useEffect(() => {
    if (!store) return undefined;
    let done = false;
    const timer = setTimeout(() => { if (!done) setState((s) => ({ ...s, stale: true, loading: false })); }, 10000);
    const unsub = store.subscribe(name, (data, meta) => {
      const confirmed = !meta || !meta.fromCache;
      if (confirmed) { done = true; clearTimeout(timer); }
      setState({ data, loading: !confirmed && !done, stale: false });
    }, () => { done = true; clearTimeout(timer); setState((s) => ({ ...s, loading: false, stale: true })); });
    return () => { clearTimeout(timer); unsub && unsub(); };
  }, [store, name]);
  return state;
}

function App() {
  const [tab, setTab] = useState(readHash);
  const [trainDay, setTrainDay] = useState(() => {
    const dow = new Date().getDay();
    return dow === 4 || dow === 5 ? 'B' : dow === 6 || dow === 0 ? 'C' : 'A';
  });
  const [store, setStore] = useState(null);
  const mainRef = useRef(null);

  useEffect(() => {
    let live = true;
    initStore().then((s) => live && setStore(s));
    const onHash = () => setTab(readHash());
    window.addEventListener('hashchange', onHash);
    return () => { live = false; window.removeEventListener('hashchange', onHash); };
  }, []);

  const settings = useCollection(store, 'settings/main');
  const checkins = useCollection(store, 'checkins');
  const photos = useCollection(store, 'photos');
  const weeks = useCollection(store, 'weeks');

  const startISO = (settings.data && settings.data.startDate) || DEFAULT_START;
  const today = useMemo(() => fromISO(toISO(new Date())), []);
  const week = programWeek(startISO, today);
  const wc = weekContext(week);
  const ctx = { today, week, startISO, ...wc };

  const latest = useMemo(() => {
    const list = (checkins.data || []).filter((c) => c.date && c.weight).sort((a, b) => (a.date < b.date ? 1 : -1));
    return list[0] ? list[0].weight : PROFILE.startWeight;
  }, [checkins.data]);
  const targets = computeTargets(latest, wc.phase.n, wc.dietBreak);

  const go = (t, day) => {
    if (day && DAYS[day]) setTrainDay(day);
    if (location.hash !== `#${t}`) location.hash = t; else setTab(t);
    setTimeout(() => mainRef.current && mainRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const sync = { loading: !store || checkins.loading, stale: checkins.stale };
  const ticks = Array.from({ length: 52 }, (_, i) => i + 1);

  return (
    <>
      <header className="hero">
        <div className="wrap hero-grid">
          <div className="min-w-0">
            <div className="hero-eyebrow">1 illik transformasiya · {fmtDate(fromISO(startISO))} → 52 həftə</div>
            <h1 className="hero-title">Prime İli</h1>
            <div className="hero-goal num"><span>{fmtNum(PROFILE.startWeight, 0)}</span><span className="hero-arrow" aria-hidden="true">→</span><span>{PROFILE.goalWeight}</span><span className="hero-unit">kq</span></div>
            <p className="hero-sub">Qarın piyini yandır, sinə və qolları qur. Həftədə 3 məşq, halal ev yeməyi və hər bazar ölçmə.</p>
          </div>
          <div className="hero-card">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="hero-k">Həftə</div>
                <div className="hero-week num">{week || 0}<span>/52</span></div>
              </div>
              <div className="text-right">
                <div className="hero-k">Faza {wc.phase.n}</div>
                <div className="hero-phase">{week ? wc.phase.name : 'Başlanğıca hazırlıq'}</div>
                {wc.deload ? <div className="hero-flag">Deload həftəsi</div> : null}
                {wc.dietBreak ? <div className="hero-flag">Kalori fasiləsi</div> : null}
              </div>
            </div>
            <div className="hero-ticks" aria-hidden="true">
              {ticks.map((t) => <i key={t} className={t < week ? 'done' : t === week ? 'now' : ''} />)}
            </div>
            <TodayStrip ctx={ctx} />
            <div className="hero-meta num">
              <span>Son çəki <b>{fmtNum(latest)} kq</b></span>
              <span>Hədəf <b>{targets.train}</b>/<b>{targets.rest}</b> kcal</span>
              <span>Protein <b>{targets.protein} q</b></span>
              <span>Su <b>{[2, 4, 6].includes(today.getDay()) ? targets.glassesTrain : targets.glassesRest} stəkan</b></span>
            </div>
          </div>
        </div>
      </header>

      <nav className="tabs" aria-label="Bölmələr">
        <div className="wrap tabs-inner">
          {TABS.map(([k, label]) => (
            <a key={k} href={`#${k}`} className={`tab ${tab === k ? 'on' : ''}`} aria-current={tab === k ? 'page' : undefined}>{label}</a>
          ))}
        </div>
      </nav>

      <main ref={mainRef} className="wrap main">
        {tab === 'icmal' ? <Overview ctx={ctx} targets={targets} latestWeight={latest} onGo={go} /> : null}
        {tab === 'mesq' ? <Training ctx={ctx} day={trainDay} setDay={setTrainDay} /> : null}
        {tab === 'qida' ? <Nutrition targets={targets} ctx={ctx} /> : null}
        {tab === 'elaveler' ? <Supplements /> : null}
        {tab === 'inkisaf' ? (
          <Progress store={store} ctx={ctx} checkins={checkins.data || []} photos={photos.data || []} weeks={weeks.data || []} sync={sync} />
        ) : null}
        <StartDate store={store} startISO={startISO} />
      </main>

      <footer className="wrap foot">
        <p>Bu plan ümumi məlumat xarakterlidir və həkim məsləhətini əvəz etmir. Ağrı, başgicəllənmə və ya təzyiq problemi olarsa, məşqi dayandır və həkimə müraciət et.</p>
      </footer>
    </>
  );
}

function StartDate({ store, startISO }) {
  const [v, setV] = useState(startISO);
  const [saved, setSaved] = useState(false);
  useEffect(() => setV(startISO), [startISO]);
  const save = async (e) => {
    e.preventDefault();
    if (!store || !v || v === startISO) return;
    try { await store.setDoc('settings/main', { startDate: v, heightCm: PROFILE.height }); setSaved(true); setTimeout(() => setSaved(false), 2500); } catch { /* göstərilən tarix dəyişmir */ }
  };
  return (
    <form className="start-form" onSubmit={save}>
      <label htmlFor="start-date" className="text-sm text-ink2">Proqramın başlanğıc tarixi (1-ci həftənin bazar ertəsi)</label>
      <input id="start-date" type="date" value={v} onChange={(e) => setV(e.target.value)} />
      <button type="submit" className="btn btn-ghost" disabled={!store || v === startISO}>Yadda saxla</button>
      {saved ? <span className="text-sm text-good" role="status">Yeniləndi</span> : null}
    </form>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
