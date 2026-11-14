import { Icon, useBackClose, FilePick } from './ui.jsx';

const { useState, useEffect, useRef } = React;

// Kamera «kölgə» rejimi: əvvəlki şəkil şəffaf olaraq kamera görüntüsünün üstündə görünür.
// Brauzer kameranı açmağa icazə verməsə, telefonun öz kamerası ilə çəkilir və sonra üst-üstə yoxlanılır.
export function GhostCam({ prevUrl, pose, onFile, onClose }) {
  const vid = useRef(null);
  const [mode, setMode] = useState('init');
  const [facing, setFacing] = useState('environment');
  const [op, setOp] = useState(0.4);
  const [count, setCount] = useState(0);
  const [shot, setShot] = useState(null);
  const [cmpOp, setCmpOp] = useState(0.5);
  useBackClose(true, onClose);

  useEffect(() => {
    if (shot) return undefined;
    let stream = null; let live = true;
    (async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
        if (!live) { stream.getTracks().forEach((t) => t.stop()); return; }
        vid.current.srcObject = stream; await vid.current.play();
        setMode('live');
      } catch { if (live) setMode('fallback'); }
    })();
    return () => { live = false; if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, [facing, shot]);

  useEffect(() => {
    document.documentElement.classList.add('modal-open');
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.documentElement.classList.remove('modal-open'); window.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(() => {
    if (!count) return undefined;
    const t = setTimeout(() => { if (count === 1) capture(); setCount(count - 1); }, 1000);
    return () => clearTimeout(t);
  }, [count]);

  const capture = () => {
    const v = vid.current; if (!v || !v.videoWidth) return;
    const cv = document.createElement('canvas'); cv.width = v.videoWidth; cv.height = v.videoHeight;
    cv.getContext('2d').drawImage(v, 0, 0);
    cv.toBlob((b) => { if (b) setShot({ blob: b, url: URL.createObjectURL(b) }); }, 'image/jpeg', 0.9);
    try { navigator.vibrate && navigator.vibrate(80); } catch { /* */ }
  };
  const pick = (f) => { if (f) setShot({ blob: f, url: URL.createObjectURL(f) }); };

  return (
    <div className="gcam" role="dialog" aria-modal="true" aria-label="Kölgə ilə şəkil çək">
      <div className="gcam-top">
        <div className="min-w-0"><div className="gm-k">Əvvəl/sonra şəkli · {pose}</div><div className="gm-t">{shot ? 'Yoxla: əvvəlki şəkillə üst-üstə düşür?' : prevUrl ? 'Bədənini kölgəyə uyğunlaşdır' : 'İlk şəkil — kölgə yoxdur'}</div></div>
        <button type="button" className="modal-close gm-x" onClick={onClose} aria-label="Bağla"><Icon name="close" /></button>
      </div>
      <div className="gcam-stage">
        {!shot ? (
          <>
            <video ref={vid} playsInline muted className={mode === 'live' ? '' : 'hidden'} />
            {mode === 'live' && prevUrl ? <img src={prevUrl} alt="" className="gcam-ghost" style={{ opacity: op }} /> : null}
            {mode === 'live' ? <div className="gcam-grid" aria-hidden="true" /> : null}
            {count ? <div className="gcam-count num">{count}</div> : null}
            {mode === 'fallback' ? (
              <div className="gcam-fb">
                <p>Brauzer bu səhifədə kameranı birbaşa açmağa icazə vermədi.</p>
                <p className="text-sm">Telefonun kamerası ilə çək — sonra şəkli əvvəlki ilə üst-üstə qoyub yoxlayacaqsan.</p>
                <FilePick className="btn btn-primary mt-3" accept="image/*" capture="environment" onFile={pick}>📷 Kameranı aç</FilePick>
              </div>
            ) : null}
            {mode === 'init' ? <div className="gcam-fb"><p>Kamera açılır…</p></div> : null}
          </>
        ) : (
          <>
            <img src={shot.url} alt="Yeni şəkil" className="gcam-shot" />
            {prevUrl ? <img src={prevUrl} alt="" className="gcam-ghost" style={{ opacity: cmpOp }} /> : null}
          </>
        )}
      </div>
      <div className="gcam-bar">
        {!shot && mode === 'live' ? (
          <>
            {prevUrl ? <label className="gcam-sl"><span>Kölgə</span><input type="range" min="0" max="0.8" step="0.05" value={op} onChange={(e) => setOp(Number(e.target.value))} /></label> : null}
            <div className="flex gap-2 w-full">
              <button type="button" className="btn btn-ghost" onClick={() => setFacing(facing === 'environment' ? 'user' : 'environment')}>Kameranı çevir</button>
              <button type="button" className="btn btn-ghost" onClick={() => setCount(10)} disabled={!!count}>⏱ 10 san</button>
              <button type="button" className="btn btn-primary flex-1" onClick={capture}>Çək</button>
            </div>
          </>
        ) : null}
        {shot ? (
          <>
            {prevUrl ? <label className="gcam-sl"><span>Əvvəlki</span><input type="range" min="0" max="1" step="0.05" value={cmpOp} onChange={(e) => setCmpOp(Number(e.target.value))} /></label> : null}
            <div className="flex gap-2 w-full">
              <button type="button" className="btn btn-ghost" onClick={() => { setShot(null); setMode('init'); }}>Yenidən çək</button>
              <button type="button" className="btn btn-primary flex-1" onClick={() => onFile(shot.blob)}>Yadda saxla</button>
            </div>
          </>
        ) : null}
        <p className="text-xs gcam-tip">Telefon bel hündürlüyündə, 2 m məsafədə. Çiyinlər və ayaqlar kölgənin xətləri ilə üst-üstə düşsün.</p>
      </div>
    </div>
  );
}
