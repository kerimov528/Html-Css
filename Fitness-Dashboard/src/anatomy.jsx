import { MUSCLES } from './data/exercises.js';
import { BODYMAP } from './data/bodymap.js';

const { useState, useId } = React;

// Əzələ qruplarının çəkilmə sırası (alt-hissələr bir-birini örtmür — kəsişməyən clip-lər)
const ORDER = ['traps', 'delts_rear', 'delts_side', 'delts_front', 'upper_back', 'lats', 'lower_back', 'chest', 'chest_upper',
  'abs', 'obliques', 'biceps', 'triceps', 'forearms', 'glutes', 'quads', 'adductors', 'hamstrings', 'calves'];

function ClipDefs({ uid }) {
  const r = (x, y, w, h) => <rect x={x} y={y} width={w} height={h} />;
  return (
    <defs>
      <clipPath id={`${uid}cpChestUp`}>{r(0, 0, 724, 357)}</clipPath>
      <clipPath id={`${uid}cpChestLow`}>{r(0, 357, 724, 420)}</clipPath>
      <clipPath id={`${uid}cpDeltFront`}>{r(237, 280, 64, 140)}{r(424, 280, 67, 140)}</clipPath>
      <clipPath id={`${uid}cpDeltSide`}>{r(170, 280, 67, 140)}{r(491, 280, 70, 140)}</clipPath>
      <clipPath id={`${uid}cpDeltSideB`}>{r(890, 290, 48, 130)}{r(1229, 290, 50, 130)}</clipPath>
      <clipPath id={`${uid}cpDeltRear`}>{r(938, 290, 291, 130)}</clipPath>
      <filter id={`${uid}glow`} filterUnits="userSpaceOnUse" x="0" y="0" width="1448" height="1448">
        <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <linearGradient id={`${uid}gp`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" className="ana-gp0" />
        <stop offset="1" className="ana-gp1" />
      </linearGradient>
    </defs>
  );
}

function View({ view, state, uid, hover, setHover, onPick, focus }) {
  const groups = BODYMAP.groups[view];
  return (
    <g className={`ana-view ana-${view}`}>
      <path d={BODYMAP.outline[view]} className="ana-outline" />
      {BODYMAP.skin[view].map((d, i) => <path key={`s${i}`} d={d} className="ana-skin" />)}
      {BODYMAP.hair[view].map((d, i) => <path key={`h${i}`} d={d} className="ana-hair" />)}
      {ORDER.filter((id) => groups[id]).map((id) => {
        const st = state(id);
        const cls = `ana-m ${st} ${hover === id ? 'hov' : ''} ${focus && focus === id ? 'foc' : ''} ${onPick ? 'pick' : ''}`;
        return (
          <g
            key={id}
            className={cls}
            filter={st === 'p' ? `url(#${uid}glow)` : undefined}
            onPointerEnter={() => setHover(id)}
            onPointerLeave={() => setHover(null)}
            onClick={onPick ? () => onPick(id) : undefined}
          >
            <title>{MUSCLES[id]}</title>
            {groups[id].map((p, i) => (
              <path key={i} d={p.d} clipPath={p.clip ? `url(#${uid}${p.clip})` : undefined} style={st === "p" ? { fill: `url(#${uid}gp)` } : undefined} />
            ))}
          </g>
        );
      })}
    </g>
  );
}

// primary: qırmızı + parıltı; secondary: açıq qırmızı. onPick verilərsə əzələlər kliklənir.
export function Anatomy({ primary = [], secondary = [], compact = false, label, onPick, focus, showHoverLabel = true }) {
  const uid = useId().replace(/:/g, '');
  const [hover, setHover] = useState(null);
  const state = (id) => (primary.includes(id) ? 'p' : secondary.includes(id) ? 's' : 'n');
  const names = primary.map((m) => MUSCLES[m]).join(', ');
  return (
    <div className={`ana-box ${compact ? 'ana-compact' : ''}`}>
      <svg
        viewBox="30 80 1388 1350"
        className="ana"
        role="img"
        aria-label={label || `Anatomik xəritə. Əsas işləyən: ${names || 'yoxdur'}`}
      >
        <ClipDefs uid={uid} />
        <View view="front" state={state} uid={uid} hover={hover} setHover={setHover} onPick={onPick} focus={focus} />
        <View view="back" state={state} uid={uid} hover={hover} setHover={setHover} onPick={onPick} focus={focus} />
        <text x="362" y="1418" textAnchor="middle" className="ana-cap">ÖNDƏN</text>
        <text x="1086" y="1418" textAnchor="middle" className="ana-cap">ARXADAN</text>
      </svg>
      {showHoverLabel ? (
        <div className={`ana-hover ${hover ? 'on' : ''}`} aria-hidden="true">
          {hover ? <><i className={`legend-dot ${state(hover) === 'p' ? 'bg-muscle' : state(hover) === 's' ? 'bg-muscle2' : 'legend-base'}`} />{MUSCLES[hover]}{state(hover) === 'p' ? ' · əsas' : state(hover) === 's' ? ' · köməkçi' : ''}</> : (onPick ? 'Əzələnin üstünə bas' : 'Əzələnin üstünə gəl — adı görünəcək')}
        </div>
      ) : null}
    </div>
  );
}

export function AnatomyLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink2">
      <span className="inline-flex items-center gap-1.5"><i className="legend-dot bg-muscle" />Əsas işləyən</span>
      <span className="inline-flex items-center gap-1.5"><i className="legend-dot bg-muscle2" />Köməkçi</span>
      <span className="inline-flex items-center gap-1.5"><i className="legend-dot legend-base" />İştirak etmir</span>
    </div>
  );
}
