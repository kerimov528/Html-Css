import { FOOD_IMG } from './data/foodimg.js';

// Yemək şəkli (Wikimedia Commons, açıq lisenziya) — müəllif və lisenziya şəkil üzərində göstərilir.
export const mealImg = (meal, oi) => FOOD_IMG[`${meal}-${oi}`] || null;

export function MealImg({ meal, oi }) {
  const im = mealImg(meal, oi);
  if (!im) return null;
  return (
    <figure className="mimg">
      <img src={`img/food/${im.f}`} alt={im.alt} loading="lazy" decoding="async" />
      <figcaption><a href={im.u} target="_blank" rel="noopener noreferrer" className="text-white">{im.a} · {im.l}</a></figcaption>
    </figure>
  );
}
