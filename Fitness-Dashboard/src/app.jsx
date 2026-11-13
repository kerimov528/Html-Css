import { initStore } from './store.js';
import { Overview, TodayStrip } from './overview.jsx';
import { Training, ExerciseModal, VKEY } from './training.jsx';
import { Today } from './today.jsx';
import { Journal } from './journal.jsx';
import { Nutrition } from './nutrition.jsx';
import { Supplements } from './supplements.jsx';
import { Progress } from './progress.jsx';
import { PROFILE, DEFAULT_START, DEFAULT_HOME_WAKE, homeTimes, hmOf, programWeek, weekContext, computeTargets, applyAdj, fromISO, fmtDate, fmtNum, toISO, daysBetween, lsGet, lsSet } from './util.js';
import { DAYS } from './data/exercises.js';
import { RestTimer, GymMode } from './gym.jsx';
import { ExportData } from './coach.jsx';
import { Gyms, chosenGyms } from './gyms.jsx';

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
  // ready: baza ilk dəfə cavab verib — yalnız bundan sonra yazmaq təhlükəsizdir (əks halda boş nüsxə köhnə qeydin üstünə yazılardı)
  const [state, setState] = useState({ data: name.includes('/') ? null : [], loading: true, stale: false, ready: false });
  useEffect(() => {
    if (!store) return undefined;
    let done = false; let got = false;
    const timer = setTimeout(() => { if (!done) setState((s) => ({ ...s, stale: true, loading: false, ready: s.ready || got })); }, 10000);
    const unsub = store.subscribe(name, (data, meta) => {
      const confirmed = !meta || !meta.fromCache;
      got = true;
      if (confirmed) { done = true; clearTimeout(timer); }
      setState((s) => ({ data, loading: !confirmed && !done, stale: false, ready: s.ready || done }));
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
  const daysCol = useCollection(store, 'days');
  const reportsCol = useCollection(store, 'reports');
  const healthCol = useCollection(store, 'health');

  // Ayarlar (alternativ hərəkətlər, menyu dəyişiklikləri) bulud bazasında saxlanır
  // Yazılar: (1) baza cavab verənə qədər növbədə gözləyir, (2) ekranda dərhal görünür (optimist nüsxə),
  // (3) bazadan gələn köhnə şəkil yeni yazını əvəz etmir, (4) alınmasa xəbərdarlıq çıxır.
  const [saveErr, setSaveErr] = useState(false);
  const lastT = useRef(0);
  const stamp = () => { let t = Date.now(); if (t <= lastT.current) t = lastT.current + 1; lastT.current = t; return new Date(t).toISOString(); };
  const sQueue = useRef(Promise.resolve());
  const [sLocal, setSLocal] = useState(null);
  const sLocalRef = useRef(null);
  const sServerRef = useRef({});
  sServerRef.current = settings.data || {};
  const pendingSettings = useRef(null);
  useEffect(() => {
    const l = sLocalRef.current;
    if (l && settings.data && settings.data.updatedAt === l.updatedAt) { sLocalRef.current = null; setSLocal(null); }
  }, [settings.data]);
  const sdata = sLocal || settings.data || {};
  const variants = sdata.variants || localVariants;
  const menuOv = sdata.menu || localMenu;
  const saveSettings = (patch) => {
    if (!store) return;
    if (!settings.ready) { pendingSettings.current = { ...(pendingSettings.current || {}), ...patch }; return; }
    const next = { ...(sLocalRef.current || sServerRef.current), ...patch, updatedAt: stamp() };
    sLocalRef.current = next; setSLocal(next);
    sQueue.current = sQueue.current.then(() => store.setDoc('settings/main', next)).then(() => setSaveErr(false), () => {
      setSaveErr(true);
      if (sLocalRef.current && sLocalRef.current.updatedAt === next.updatedAt) { sLocalRef.current = null; setSLocal(null); }
    });
  };
  useEffect(() => {
    if (settings.ready && pendingSettings.current) { const p = pendingSettings.current; pendingSettings.current = null; saveSettings(p); }
  }, [settings.ready]);
  const chooseVariant = (key, idx) => { const next = { ...variants, [key]: idx }; setLocalVariants(next); lsSet(VKEY, next); saveSettings({ variants: next }); };
  const setMenu = (next) => { setLocalMenu(next); lsSet('prime-ili:menu', next); saveSettings({ menu: next }); };

  // Gündəlik qeydlər: hər gün bir sənəd (days/<tarix>), yazılar növbə ilə göndərilir
  const serverDays = useMemo(() => Object.fromEntries((daysCol.data || []).map((x) => [x.id || x.date, x])), [daysCol.data]);
  const serverDaysRef = useRef({});
  serverDaysRef.current = serverDays;
  const [overlay, setOverlay] = useState({});
  const overlayRef = useRef({});
  const setOv = (fn) => { overlayRef.current = fn(overlayRef.current); setOverlay(overlayRef.current); };
  const queue = useRef(Promise.resolve());
  const pendingDays = useRef([]);
  useEffect(() => {
    // Baza bizim son yazını qaytarıbsa, optimist nüsxəyə ehtiyac qalmır
    const o = overlayRef.current;
    const caught = Object.keys(o).filter((iso) => serverDays[iso] && serverDays[iso].updatedAt === o[iso].updatedAt);
    if (caught.length) setOv((cur) => { const n = { ...cur }; caught.forEach((k) => delete n[k]); return n; });
  }, [serverDays]);
  const days = useMemo(() => (Object.keys(overlay).length ? { ...serverDays, ...overlay } : serverDays), [serverDays, overlay]);
  const updateDay = (iso, patch) => {
    if (!store) return;
    if (!daysCol.ready) { pendingDays.current.push([iso, patch]); return; }
    const cur = { ...(overlayRef.current[iso] || serverDaysRef.current[iso] || {}) };
    delete cur.id;
    const add = typeof patch === 'function' ? patch(cur) : patch;
    const next = { ...cur, ...add, date: iso, updatedAt: stamp() };
    setOv((o) => ({ ...o, [iso]: next }));
    queue.current = queue.current.then(() => store.put('days', iso, next)).then(() => setSaveErr(false), () => {
      setSaveErr(true);
      setOv((o) => { if (!o[iso] || o[iso].updatedAt !== next.updatedAt) return o; const n = { ...o }; delete n[iso]; return n; });
    });
  };
  useEffect(() => {
    if (daysCol.ready && pendingDays.current.length) { const q = pendingDays.current; pendingDays.current = []; q.forEach(([i, p]) => updateDay(i, p)); }
  }, [daysCol.ready]);
  // Qeyd düymələri yalnız baza hazır olanda açılır
  const canWrite = !!store && store.canWrite && settings.ready && daysCol.ready;

  const startISO = (settings.data && settings.data.startDate) || DEFAULT_START;
  const today = useMemo(() => fromISO(toISO(new Date())), []);
  const week = programWeek(startISO, today);
  const wc = weekContext(week);
  const homeWake = sdata.homeWake || DEFAULT_HOME_WAKE;
  const ctx = { today, week, startISO, homeWake, ...wc };

  // Son çəki: son ölçmədən əvvəlki 7 günün ortası — tək ölçmənin ±1 kq oynaması hədəfləri dəyişmir
  const latest = useMemo(() => {
    const list = (checkins.data || []).filter((c) => c.date && c.weight).sort((a, b) => (a.date < b.date ? 1 : -1));
    if (!list[0]) return PROFILE.startWeight;
    const wk = list.filter((c) => daysBetween(fromISO(c.date), fromISO(list[0].date)) <= 6);
    return Math.round((wk.reduce((a, c) => a + c.weight, 0) / wk.length) * 10) / 10;
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
            <div className="hero-goal num"><span>{fmtNum(PROFILE.startWeight, PROFILE.startWeight % 1 ? 1 : 0)}</span><span className="hero-arrow" aria-hidden="true">→</span><span>{PROFILE.goalWeight}</span><span className="hero-unit">kq</span></div>
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
        {saveErr ? <p className="save-warn" role="alert">⚠️ Son dəyişiklik saxlanmadı — interneti yoxla və yenidən cəhd et. <button type="button" className="link-strong" onClick={() => setSaveErr(false)}>Bağla</button></p> : null}
        {store && store.canWrite && !canWrite ? <p className="save-warn wait" role="status">{settings.stale || daysCol.stale ? 'Baza cavab vermir — qeydlər itməsin deyə qeyd düymələri bağlıdır. İnterneti yoxla və səhifəni yenilə.' : 'Qeydlərin yüklənir… bir neçə saniyəyə qeyd edə biləcəksən.'}</p> : null}
        {tab === 'bugun' ? <Today ctx={ctx} targets={targets} variants={variants} onChooseVariant={chooseVariant} onOpenEx={setOpenEx} selDow={selDow} setSelDow={setSelDow} onGo={go} menuOv={menuOv} setMenu={setMenu} days={days} updateDay={updateDay} canWrite={canWrite} onGym={setGym} ramadan={sdata.ramadan} checkins={checkins.data || []} rewards={sdata.rewards} saveSettings={saveSettings} gyms={chosenGyms(sdata.gyms)} /> : null}
        {tab === 'gundelik' ? <Journal ctx={ctx} targets={targets} days={days} updateDay={updateDay} menuOv={menuOv} canWrite={canWrite} /> : null}
        {tab === 'plan' ? <><Reminders ctx={ctx} /><Overview ctx={ctx} targets={targets} latestWeight={latest} latestWaist={latestWaist} onGo={go} /><ExportData store={store} canWrite={canWrite} days={days} checkins={checkins.data || []} sdata={sdata} photos={photos.data || []} health={healthCol.data || []} reports={reportsCol.data || []} /></> : null}
        {tab === 'mesq' ? <Gyms sel={sdata.gyms} saveSettings={saveSettings} canWrite={canWrite} /> : null}
        {tab === 'mesq' ? <Training ctx={ctx} day={trainDay} setDay={setTrainDay} variants={variants} onChooseVariant={chooseVariant} onOpenEx={setOpenEx} /> : null}
        {tab === 'qida' ? <Nutrition targets={targets} ctx={ctx} onGo={go} menuOv={menuOv} ramadan={sdata.ramadan} saveSettings={saveSettings} store={store} canWrite={canWrite} todayLog={days[toISO(today)] || {}} updateToday={(patch) => updateDay(toISO(today), patch)} /> : null}
        {tab === 'elaveler' ? <Supplements /> : null}
        {tab === 'inkisaf' ? (
          <Progress store={store} writable={canWrite} ctx={ctx} checkins={checkins.data || []} photos={photos.data || []} sync={sync} days={days} targets={targets} sdata={sdata} saveSettings={saveSettings} reports={reportsCol.data || []} health={healthCol.data || []} />
        ) : null}
        <PanelSettings canWrite={canWrite} startISO={startISO} homeWake={homeWake} saveSettings={saveSettings} />
      </main>

      {gym ? <GymMode {...gym} ctx={ctx} variants={variants} onChooseVariant={chooseVariant} days={days} updateDay={updateDay} canLog={canWrite && gym.iso <= toISO(today)} onClose={() => setGym(null)} /> : null}
      <RestTimer />
      <ExerciseModal open={!!openEx} data={openEx} variants={variants} onChoose={chooseVariant} onClose={() => setOpenEx(null)} phaseN={wc.phase.n} deload={wc.deload} />

      <footer className="wrap foot">
        <p className="mb-2">Hərəkət fotoşəkilləri: <a className="link-muted" href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener noreferrer">free-exercise-db</a> (ictimai mülkiyyət, Unlicense) — ölçüsü kiçildilib. Anatomik xəritə: react-native-body-highlighter (MIT). Yemək şəkilləri: <a className="link-muted" href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a> — müəllif və lisenziya (CC BY / CC BY-SA / CC0) hər şəklin küncündədir; şəkillər kəsilib və kiçildilib.</p>
        <p>Bu plan ümumi məlumat xarakterlidir və həkim məsləhətini əvəz etmir. Ağrı, başgicəllənmə və ya təzyiq problemi olarsa, məşqi dayandır və həkimə müraciət et.</p>
      </footer>
    </>
  );
}

function Reminders({ ctx }) {
  const H = homeTimes(ctx.homeWake);
  return (
    <section className="card remind">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="h2">📱 Telefona bildirişlər (Samsung S25 Ultra)</h2>
          <p className="text-sm text-ink2 mt-1">Bu səhifə bağlı olanda bildiriş göndərə bilmir, ona görə xatırlatmalar telefon təqviminə əlavə olunur: iki .ics faylını telefonda aç — təqvim hadisələri əlavə edir və vaxtı gələndə bildiriş gəlir (Galaxy Watch-da da).</p>
        </div>
      </div>
      <div className="remind-grid mt-4">
        <div className="remind-btn"><b>🏋️ prime-ili-mesq-ve-olcme.ics</b><span>Ç.a./C.a. 18:30, Ş. {hmOf(H.act)} məşq · hovuz {hmOf(H.act)} · bazar çəki ({hmOf(H.wake + 15)}) və yemək hazırlığı · 21:45 «gündəliyi doldur» · Ramazanda məşq iftardan sonra</span></div>
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

function PanelSettings({ canWrite, startISO, homeWake, saveSettings }) {
  const [v, setV] = useState(startISO);
  const [w, setW] = useState(homeWake);
  const [saved, setSaved] = useState(false);
  useEffect(() => setV(startISO), [startISO]);
  useEffect(() => setW(homeWake), [homeWake]);
  const dirty = (v && v !== startISO) || (w && w !== homeWake);
  const save = (e) => {
    e.preventDefault();
    if (!canWrite || !dirty) return;
    saveSettings({ startDate: v || startISO, homeWake: w || homeWake, heightCm: PROFILE.height });
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };
  return (
    <form className="start-form" onSubmit={save}>
      <label htmlFor="start-date" className="text-sm text-ink2">Proqramın başlanğıc tarixi (1-ci həftənin bazar ertəsi)</label>
      <input id="start-date" type="date" value={v} onChange={(e) => setV(e.target.value)} />
      <label htmlFor="home-wake" className="text-sm text-ink2">Ev günlərində oyanma vaxtı (Ş., B. və hovuz günü — plan buna görə qurulur)</label>
      <input id="home-wake" type="time" step="900" value={w} onChange={(e) => setW(e.target.value)} />
      <button type="submit" className="btn btn-ghost" disabled={!canWrite || !dirty}>Yadda saxla</button>
      {saved ? <span className="text-sm text-good" role="status">Yeniləndi</span> : null}
    </form>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
