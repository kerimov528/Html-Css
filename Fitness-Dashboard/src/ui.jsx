const { useState, useEffect, useRef, useLayoutEffect } = React;

export function Card({ className = '', children, as: Tag = 'section', ...rest }) {
  return <Tag className={`card ${className}`} {...rest}>{children}</Tag>;
}

export function Eyebrow({ children, className = '' }) {
  return <div className={`eyebrow ${className}`}>{children}</div>;
}

export function H2({ children, sub, right }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h2 className="h2">{children}</h2>
        {sub ? <p className="text-ink2 text-sm mt-1 max-w-prose">{sub}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function Segmented({ value, onChange, options, label, size = 'md' }) {
  return (
    <div className={`seg seg-${size}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.sub ? <span className="seg-sub">{o.sub}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function HowTo({ children }) {
  return (
    <div className="howto" role="note">
      <span className="howto-ic"><Icon name="info" /></span>
      <p>{children}</p>
    </div>
  );
}

export function Pill({ tone = 'neutral', children, className = '' }) {
  return <span className={`pill pill-${tone} ${className}`}>{children}</span>;
}

export function Icon({ name, className = '' }) {
  const paths = {
    close: 'M6 6l12 12M18 6L6 18',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    x: 'M7 7l10 10M17 7L7 17',
    tilde: 'M5 13c2-3 4-3 7 0s5 3 7 0',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    play: 'M8 5.5v13l11-6.5z',
    plus: 'M12 5v14M5 12h14',
    trash: 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12',
    upload: 'M12 16V5M7 10l5-5 5 5M5 19h14',
    swap: 'M7 8h11l-3-3M17 16H6l3 3',
    info: 'M12 11v6M12 7.5v.5',
  };
  return (
    <svg viewBox="0 0 24 24" className={`icon ${className}`} aria-hidden="true" fill={name === 'play' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {name === 'info' ? <circle cx="12" cy="12" r="9" /> : null}
      <path d={paths[name]} />
    </svg>
  );
}

export function useMeasure() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return undefined;
    const el = ref.current;
    setW(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export function Modal({ open, onClose, title, children, labelledBy }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.documentElement.classList.add('modal-open');
    setTimeout(() => closeRef.current && closeRef.current.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('modal-open');
      if (prev && prev.focus) prev.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : title}>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel">
        <button ref={closeRef} type="button" className="modal-close" onClick={onClose} aria-label="Bağla">
          <Icon name="close" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function Bar({ value, max, tone = 'cobalt', label }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = value > max * 1.05;
  return (
    <div className="bar" role="img" aria-label={label}>
      <div className={`bar-fill ${over ? 'bar-over' : `bar-${tone}`}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
