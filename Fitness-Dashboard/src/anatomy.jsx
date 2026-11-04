import { MUSCLES } from './data/exercises.js';

// Stilizə edilmiş anatomik xəritə. Hər fiqur 160×340 sahədə, mərkəz x=80.
// Yalnız sol yarı çəkilir, sağ yarı güzgü ilə alınır.
const MIRROR = 'matrix(-1 0 0 1 160 0)';

const FRONT = {
  traps: ['M73,46 C69,51 63,54 56,56 L60,58 C66,57 71,55 74,52 Z'],
  delts_side: ['M55,57 C46,56 39,62 37,72 C36,80 37,87 39,92 L42,87 C41,78 44,68 52,62 Z'],
  delts_front: ['M56,59 C49,62 44,69 43,78 L43,88 C47,82 52,77 58,74 L58,61 Z'],
  chest_upper: ['M78.5,57 C72,57 65,58 60,60 L60,72.5 C66,70.5 72,70 78.5,70 Z'],
  chest: ['M78.5,71.5 C71,71.5 64,72.5 59,75 C53,80 50,88 51.5,95 C57.5,101 68,103 78.5,99 Z'],
  biceps: ['M44.5,90 C40.5,97 39,108 39.5,120 C40.5,126 42.5,130 45,132 C48,124 50,114 50,104 C50,97 48,92 44.5,90 Z'],
  triceps: ['M39,95 C36,103 35,113 36,123 L38.2,127 C37.2,116 37.8,105 40.2,96 Z'],
  forearms: ['M39,133.5 C34,142 31,154 30,166 C29.5,173 29.5,178 30.5,182 L35.5,182 C37.5,171 41,159 45,147 C46,141 46,136 45,134 Z'],
  abs: [
    'M69.5,104 h9 v13 h-9 Z', 'M69.5,119 h9 v13 h-9 Z', 'M69.5,134 h9 v13 h-9 Z',
    'M69.5,149 L78.5,149 L78.5,172 C74.5,168 71.5,162 69.5,156 Z',
  ],
  obliques: ['M52.5,98 C57,102 62,104 67.5,105 L67.5,156 C63.5,152 59.5,147 56.5,141 C54.5,128 52.5,112 52.5,98 Z'],
  quads: ['M56,156.5 C51,176 50,200 53,220 C55,230 59,237 64,240 C69,236 72,226 73,212 C74,196 73,182 70,170 C66,163 61,158.5 56,156.5 Z'],
  adductors: ['M72.5,168 C75.5,172 78,178 79.4,182 L79.4,212 C77.5,206 75.6,198 74.8,190 C74.6,182 73.8,174 72.5,168 Z'],
  calves: ['M57,250 C53,262 53,282 57,298 C59,308 61,316 62,320 L68,320 C69,306 70,290 70,276 C70,262 68,254 64,249 Z'],
};

const BACK = {
  traps: ['M79.4,40 C77,46 72,50 64,53 C59,55 56,56.5 54.5,58 C61,61 67,66 71,74 C75,82 77.8,90 79.4,98 Z'],
  delts_rear: ['M53.5,58.5 C45.5,57.5 39,63 37,73 C36,81 37,87 39,92 C43,83 49,74 56.5,68 C56.5,64 55.5,60.5 53.5,58.5 Z'],
  upper_back: ['M58,69.5 C52.5,75 50.5,83 52.5,90 C58,92 64,93 70,93 C71.5,86 70,78 66,72.5 C63,70.5 60.5,69.5 58,69.5 Z'],
  lats: ['M52.5,92.5 C51.5,105 54,120 59,133 C63,141 68,147 72,150 L72,104 C72,100 71.2,96.5 70,95 C64,95.5 57.5,94.5 52.5,92.5 Z'],
  lower_back: ['M74,100.5 C76,99.6 78,99.4 79.4,99.4 L79.4,160 C77,157 75,154 74,150 Z'],
  triceps: ['M39,93 C35,101 34,112 35,123 C36,128 39,132 43,133 C46,124 48,113 48,103 C48,97 46,93 43,91 Z'],
  forearms: ['M39,133.5 C34,142 31,154 30,166 C29.5,173 29.5,178 30.5,182 L35.5,182 C37.5,171 41,159 45,147 C46,141 46,136 45,134 Z'],
  glutes: ['M57,152.5 C52,160 52,172 56,180 C62,187 72,189 79.4,187 L79.4,156 C73,152 64,150.5 57,152.5 Z'],
  hamstrings: ['M55,186 C52,201 53,218 57,232 C59,237 62,240 64,241 L72,241 C75,227 77,210 77,196 L78,190.5 C71,191.5 62,190 55,186 Z'],
  calves: ['M56,250 C52,262 53,278 57,290 C60,298 64,302 68,302 C71,292 72,278 71,265 C70,256 67,250 62,248 Z'],
};

function Skin({ back }) {
  return (
    <g className="ana-skin">
      <ellipse cx="80" cy="24" rx="14" ry="17" />
      <path d="M72.5,38 L87.5,38 L88.5,53 L71.5,53 Z" />
      {[false, true].map((m) => (
        <g key={String(m)} transform={m ? MIRROR : undefined}>
          <ellipse cx="29.5" cy="191" rx="5.5" ry="9" />
          <ellipse cx="64.5" cy="245" rx="8" ry="6.5" />
          <path d="M57.5,322 L69.5,322 L72,334 C68,338.5 60,338.5 55,334.5 Z" />
          {back ? <path d="M61,301 L68,302.5 L67.5,320 L62.5,320 Z" /> : <path d="M60,150 C64,156 68,162 72,166.5 L79.4,174 L79.4,176 C74,172 68,166 63,160 C61.5,157 60.5,153.5 60,150 Z" />}
        </g>
      ))}
    </g>
  );
}

function Muscles({ map, state }) {
  return Object.entries(map).map(([id, paths]) => {
    const st = state(id);
    return (
      <g key={id} className={`ana-m ${st}`}>
        <title>{MUSCLES[id]}</title>
        {[false, true].map((m) => (
          <g key={String(m)} transform={m ? MIRROR : undefined}>
            {paths.map((d, i) => <path key={i} d={d} />)}
          </g>
        ))}
      </g>
    );
  });
}

export function Anatomy({ primary = [], secondary = [], compact = false, label }) {
  const state = (id) => (primary.includes(id) ? 'p' : secondary.includes(id) ? 's' : 'n');
  const names = primary.map((m) => MUSCLES[m]).join(', ');
  return (
    <svg
      viewBox="0 0 340 362"
      className={`ana ${compact ? 'ana-compact' : ''}`}
      role="img"
      aria-label={label || `Anatomik xəritə. Əsas işləyən əzələlər: ${names || 'yoxdur'}`}
    >
      <g>
        <Skin />
        <Muscles map={FRONT} state={state} />
        <text x="80" y="356" textAnchor="middle" className="ana-cap">ÖNDƏN</text>
      </g>
      <g transform="translate(180 0)">
        <Skin back />
        <Muscles map={BACK} state={state} />
        <text x="80" y="356" textAnchor="middle" className="ana-cap">ARXADAN</text>
      </g>
    </svg>
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
