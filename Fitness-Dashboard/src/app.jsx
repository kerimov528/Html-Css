import { initStore } from './store.js';
import { Overview, TodayStrip } from './overview.jsx';
import { Training, ExerciseModal, VKEY } from './training.jsx';
import { Today } from './today.jsx';
import { Journal } from './journal.jsx';
import { Nutrition } from './nutrition.jsx';
import { Supplements } from './supplements.jsx';
import { Progress } from './progress.jsx';
import { PROFILE, DEFAULT_START, programWeek, weekContext, computeTargets, applyAdj, fromISO, fmtDate, fmtNum, toISO, lsGet, lsSet } from './util.js';
import { DAYS } from './data/exercises.js';
import { RestTimer, GymMode } from './gym.jsx';
import { ExportData } from './coach.jsx';

const { useState, useEffect, useMemo, useRef } = React;

const TABS = [
  ['bugun', 'Bu gün'],
  ['gundelik', 'Gündəlik'],
  ['mesq', 'Məşqlər'],
  ['qida', 'Qidalanma'],
  ['inkisaf', 'İnkişaf'],
  ['elaveler', 'Əlavələr'],
  ['plan', 'Plan'],
];

function readHash() {
  const h = (location.hash || '').replace('#', '');
  if (h === 'icmal') return 'plan';
  return TABS.some(([k]) => k === h) ? h : 'bugun';
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
  const [selDow, setSelDow] = useState(() => new Date().getDay());
  const [localVariants, setLocalVariants] = useState(() => lsGet(VKEY, {}));
  const [localMenu, setLocalMenu] = useState(() => lsGet('prime-ili:menu', {}));
  const [openEx, setOpenEx] = useState(null);
  const [gym, setGym] = useState(null);
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
  const daysCol = useCollection(store, 'days');
  const reportsCol = useCollection(store, 'reports');

  // Ayarlar (alternativ hərəkətlər, menyu dəyişiklikləri) bulud bazasında saxlanır
  const sdata = settings.data || {};
  const variants = sdata.variants || localVariants;
  const menuOv = sdata.menu || localMenu;
  const settingsRef = useRef({});
  settingsRef.current = sdata;
  const saveSettings = (patch) => {
    if (!store) return;
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    store.setDoc('settings/main', next).catch(() => {});
  };
  const chooseVariant = (key, idx) => { const next = { ...variants, [key]: idx }; setLocalVariants(next); lsSet(VKEY, next); saveSettings({ variants: next }); };
  const setMenu = (next) => { setLocalMenu(next); lsSet('prime-ili:menu', next); saveSettings({ menu: next }); };

  // Gündəlik qeydlər: hər gün bir sənəd (days/<tarix>), yazılar növbə ilə göndərilir
  const days = useMemo(() => Object.fromEntries((daysCol.data || []).map((x) => [x.id || x.date, x])), [daysCol.data]);
  const dayRef = useRef({});
  const queue = useRef(Promise.resolve());
  useEffect(() => { dayRef.current = { ...dayRef.current, ...days }; }, [days]);
  const updateDay = (iso, patch) => {
    if (!store) return;
    const cur = { ...(dayRef.current[iso] || days[iso] || {}) };
    delete cur.id;
    const add = typeof patch === 'function' ? patch(cur) : patch;
    const next = { ...cur, ...add, date: iso, updatedAt: new Date().toISOString() };
    dayRef.current = { ...dayRef.current, [iso]: next };
    queue.current = queue.current.then(() => store.put('days', iso, next)).catch(() => {});
  };

  const startISO = (settings.data && settings.data.startDate) || DEFAULT_START;
  const today = useMemo(() => fromISO(toISO(new Date())), []);
  const week = programWeek(startISO, today);
  const wc = weekContext(week);
  const ctx = { today, week, startISO, ...wc };

  const latest = useMemo(() => {
    const list = (checkins.data || []).filter((c) => c.date && c.weight).sort((a, b) => (a.date < b.date ? 1 : -1));
    return list[0] ? list[0].weight : PROFILE.startWeight;
  }, [checkins.data]);
  const latestWaist = useMemo(() => { const l = (checkins.data || []).filter((c) => c.date && c.waist).sort((a, b) => (a.date < b.date ? 1 : -1)); return l[0] ? l[0].waist : PROFILE.startWaist; }, [checkins.data]);
  const targets = applyAdj(computeTargets(latest, wc.phase.n, wc.dietBreak), wc.phase.n === 5 || wc.dietBreak ? 0 : sdata.kcalAdj || 0);

  const go = (t, day) => {
    if (day && DAYS[day]) setTrainDay(day);
    if (typeof day === 'number') setSelDow(day);
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
        {tab === 'bugun' ? <Today ctx={ctx} targets={targets} variants={variants} onChooseVariant={chooseVariant} onOpenEx={setOpenEx} selDow={selDow} setSelDow={setSelDow} onGo={go} menuOv={menuOv} setMenu={setMenu} days={days} updateDay={updateDay} canWrite={!!store && store.canWrite} onGym={setGym} ramadan={sdata.ramadan} checkins={checkins.data || []} /> : null}
        {tab === 'gundelik' ? <Journal ctx={ctx} targets={targets} days={days} updateDay={updateDay} menuOv={menuOv} canWrite={!!store && store.canWrite} /> : null}
        {tab === 'plan' ? <><Reminders /><Overview ctx={ctx} targets={targets} latestWeight={latest} latestWaist={latestWaist} onGo={go} /><ExportData days={days} checkins={checkins.data || []} sdata={sdata} photos={photos.data || []} /></> : null}
        {tab === 'mesq' ? <Training ctx={ctx} day={trainDay} setDay={setTrainDay} variants={variants} onChooseVariant={chooseVariant} onOpenEx={setOpenEx} /> : null}
        {tab === 'qida' ? <Nutrition targets={targets} ctx={ctx} onGo={go} menuOv={menuOv} ramadan={sdata.ramadan} saveSettings={saveSettings} store={store} todayLog={days[toISO(today)] || {}} updateToday={(patch) => updateDay(toISO(today), patch)} /> : null}
        {tab === 'elaveler' ? <Supplements /> : null}
        {tab === 'inkisaf' ? (
          <Progress store={store} ctx={ctx} checkins={checkins.data || []} photos={photos.data || []} weeks={weeks.data || []} sync={sync} days={days} targets={targets} sdata={sdata} saveSettings={saveSettings} reports={reportsCol.data || []} />
        ) : null}
        <StartDate store={store} startISO={startISO} saveSettings={saveSettings} />
      </main>

      {gym ? <GymMode {...gym} ctx={ctx} variants={variants} onChooseVariant={chooseVariant} days={days} updateDay={updateDay} canLog={!!store && store.canWrite && gym.iso <= toISO(today)} onClose={() => setGym(null)} /> : null}
      <RestTimer />
      <ExerciseModal open={!!openEx} data={openEx} variants={variants} onChoose={chooseVariant} onClose={() => setOpenEx(null)} phaseN={wc.phase.n} deload={wc.deload} />

      <footer className="wrap foot">
        <p className="mb-2">Hərəkət fotoşəkilləri: <a className="link-muted" href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener noreferrer">free-exercise-db</a> (ictimai mülkiyyət, Unlicense) — ölçüsü kiçildilib. Anatomik xəritə: react-native-body-highlighter (MIT). Yemək şəkilləri: <a className="link-muted" href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a> — müəllif və lisenziya (CC BY / CC BY-SA / CC0) hər şəklin küncündədir; şəkillər kəsilib və kiçildilib.</p>
        <p>Bu plan ümumi məlumat xarakterlidir və həkim məsləhətini əvəz etmir. Ağrı, başgicəllənmə və ya təzyiq problemi olarsa, məşqi dayandır və həkimə müraciət et.</p>
      </footer>
    </>
  );
}

function Reminders() {
  return (
    <section className="card remind">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="h2">📱 Telefona bildirişlər (Samsung S25 Ultra)</h2>
          <p className="text-sm text-ink2 mt-1">Bu səhifə bağlı olanda bildiriş göndərə bilmir, ona görə xatırlatmalar telefon təqviminə əlavə olunur: iki .ics faylını telefonda aç — təqvim hadisələri əlavə edir və vaxtı gələndə bildiriş gəlir (Galaxy Watch-da da).</p>
        </div>
      </div>
      <div className="remind-grid mt-4">
        <div className="remind-btn"><b>🏋️ prime-ili-mesq-ve-olcme.ics</b><span>Ç.a./C.a. 18:30, Ş. 11:00 məşq · hovuz · bazar çəki və yemək hazırlığı · 21:45 «gündəliyi doldur» · Ramazanda məşq iftardan sonra</span></div>
        <div className="remind-btn"><b>🍽️ prime-ili-yemek-ve-su.ics</b><span>5 yemək vaxtı + gündə 4 su xatırlatması · Ramazan ayında avtomatik sahur/iftar və axşam su xatırlatmalarına keçir</span></div>
      </div>
      <p className="text-xs text-ink3 mt-2">Faylları Claude söhbətdə göndərib; həmçinin GitHub-da <b>Fitness-Dashboard/calendar</b> qovluğundadır.</p>
      <ol className="steps steps-sm mt-4">
        <li>Telefonda faylı aç (Fayllarım → Yükləmələr) → «Samsung Calendar» və ya «Google Calendar» seç → «Əlavə et / Import».</li>
        <li>Google Təqvimdə kompüterdən: Ayarlar → İdxal və ixrac → faylı seç → təqvimi seç.</li>
        <li>Bildiriş gəlmirsə: Ayarlar → Tətbiqlər → Təqvim → Bildirişlər → açıq; «Batareya» → «Məhdudiyyətsiz».</li>
        <li>Vaxtları dəyişmək istəsən, təqvimdə hadisəni aç → «Bütün hadisələr» seçərək redaktə et.</li>
      </ol>
      <h3 className="h4 mt-5">📲 Paneli telefonun ana ekranına əlavə et</h3>
      <ol className="steps steps-sm mt-2">
        <li><span>S25 Ultra-da <b>Chrome</b> və ya <b>Samsung Internet</b>-də bu panelin linkini aç (claude.ai hesabına daxil ol).</span></li>
        <li><span>Chrome: sağ yuxarıda <b>⋮</b> → <b>«Ana ekrana əlavə et»</b>. Samsung Internet: aşağıda <b>☰</b> → <b>«Səhifəni əlavə et» → «Ana ekran»</b>.</span></li>
        <li><span>Adını «Prime İli» yaz → <b>Əlavə et</b>. İndi panel tətbiq kimi bir toxunuşla açılır.</span></li>
      </ol>
    </section>
  );
}

function StartDate({ store, startISO, saveSettings }) {
  const [v, setV] = useState(startISO);
  const [saved, setSaved] = useState(false);
  useEffect(() => setV(startISO), [startISO]);
  const save = async (e) => {
    e.preventDefault();
    if (!store || !v || v === startISO) return;
    try { saveSettings({ startDate: v, heightCm: PROFILE.height }); setSaved(true); setTimeout(() => setSaved(false), 2500); } catch { /* göstərilən tarix dəyişmir */ }
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
