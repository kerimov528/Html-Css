import { OUT_FOODS } from './data/recipes.js';
import { RECIPES } from './data/recipes.js';
import { fmtInt } from './util.js';

const { useState } = React;
const MULT = [[0.5, '½'], [1, '1'], [1.5, '1½'], [2, '2']];

// «Bayırda yedim»: bir kliklə günün siyahısına təxmini porsiya əlavə edir
export function OutFoodPicker({ onAdd, disabled }) {
  const [k, setK] = useState(1);
  const [last, setLast] = useState(null);
  const add = ([n, portion, kcal, p, c, f]) => {
    const lab = k === 1 ? portion : `${MULT.find((m) => m[0] === k)[1]} × ${portion}`;
    onAdd({ id: Date.now(), name: `${n} (${lab})`, grams: 0, portion: lab, kcal: kcal * k, p: p * k, c: c * k, f: f * k, out: true });
    setLast(n);
    setTimeout(() => setLast(null), 1800);
  };
  return (
    <div className="outf">
      <div className="outf-head">
        <b className="text-ink text-sm">Bayırda yedim — 1 kliklə əlavə et</b>
        <div className="seg seg-sm" role="radiogroup" aria-label="Porsiya">
          {MULT.map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={k === v} className={k === v ? 'on' : ''} onClick={() => setK(v)}>{l} porsiya</button>)}
        </div>
      </div>
      <ul className="outf-list">
        {OUT_FOODS.map((x) => (
          <li key={x[0]}>
            <button type="button" disabled={disabled} className={last === x[0] ? 'added' : ''} onClick={() => add(x)}>
              <span className="min-w-0"><b>{x[0]}</b><span className="block text-xs text-ink3">{x[1]}</span></span>
              <span className="num outf-k">{last === x[0] ? '✓' : fmtInt(x[2] * k)}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink3 mt-2">Dəyərlər restoran porsiyası üçün təxminidir. Bayırda yeyəndə: əvvəlcə salat və ət, çörəyi və plovu yarıya endir, şirin içki əvəzinə su/ayran.</p>
    </div>
  );
}

export function Recipe({ meal, oi }) {
  const r = RECIPES[`${meal}-${oi}`];
  if (!r) return null;
  return (
    <details className="recipe">
      <summary>Necə hazırlanır · ~{r.min} dəq</summary>
      <ol className="steps steps-sm mt-2">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol>
    </details>
  );
}
