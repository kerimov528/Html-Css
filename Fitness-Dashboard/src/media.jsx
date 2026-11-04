import { MEDIA } from './data/media.js';
import { ANIMS } from './data/anims.js';
import { EX } from './data/exercises.js';
import { RigFigure } from './rig.jsx';

export const hasPhoto = (id) => !!MEDIA[id];

// Real insan təsviri: iki kadr (başlanğıc ↔ son) yumşaq keçidlə növbələnir.
// Təsviri olmayan hərəkətlərdə sxematik animasiya göstərilir.
export function ExMedia({ id, size = 'card', still = false }) {
  const m = MEDIA[id];
  const ex = EX[id];
  if (m) {
    return (
      <span className={`exm exm-${size} ${still ? 'still' : ''}`} style={size === 'thumb' ? undefined : { aspectRatio: `${m[0]} / ${m[1]}` }} role="img" aria-label={`${ex.az}: hərəkətin başlanğıc və son vəziyyəti`}>
        <img src={`img/ex/${id}-1.webp`} alt="" loading="lazy" decoding="async" />
        <img src={`img/ex/${id}-2.webp`} alt="" className="exm-b" loading="lazy" decoding="async" />
        {size === 'thumb' ? null : (
          <span className="exm-tag" aria-hidden="true"><i className="d1">Başlanğıc</i><i className="d2">Son</i></span>
        )}
      </span>
    );
  }
  if (ANIMS[id]) {
    return (
      <span className={`exm exm-${size} exm-rig`}>
        <RigFigure spec={ANIMS[id]} primary={ex.p} secondary={ex.s} still={still || size === 'thumb'} />
        {size === 'thumb' ? null : <span className="exm-tag exm-tag-static" aria-hidden="true"><i>Sxematik</i></span>}
      </span>
    );
  }
  return <span className={`exm exm-${size}`} />;
}
