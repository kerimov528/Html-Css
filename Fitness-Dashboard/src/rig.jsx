// Hərəkət animasiyası: 2D skelet (yan, ön və arxa görünüş), IK ilə oynaqlar,
// işləyən əzələlər qırmızı parıldayır — yığılma anında daha güclü.
const { useState, useEffect, useRef, useId, useMemo } = React;

const DEG = Math.PI / 180;
const cs = (a) => Math.cos(a * DEG);
const sn = (a) => Math.sin(a * DEG);
const pt = (p, a, l) => [p[0] + cs(a) * l, p[1] + sn(a) * l];
const ang = (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]) / DEG;
const dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
const lerp = (a, b, t) => a + (b - a) * t;
const lerpP = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));

export const GROUND = 204;
const L = { t: 56, nk: 7, hr: 11, ua: 32, fa: 28, hd: 6, th: 44, sn: 42, ft: 14 };
const TH = { ua: 11, fa: 9, th: 15, sn: 11, nk: 9, ft: 7 };

// İki seqmentli IK. sign>0: (T-A)×(K-A) > 0 olan həll seçilir.
function ik(A, T, l1, l2, sign) {
  const base = ang(A, T);
  const d = Math.max(Math.abs(l1 - l2) + 0.5, Math.min(l1 + l2 - 0.3, dist(A, T)));
  const c = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const a = Math.acos(Math.max(-1, Math.min(1, c))) / DEG;
  const k1 = pt(A, base + a, l1);
  const k2 = pt(A, base - a, l1);
  const cr = (K) => (T[0] - A[0]) * (K[1] - A[1]) - (T[1] - A[1]) * (K[0] - A[0]);
  const K = (sign > 0 ? cr(k1) > 0 : cr(k1) < 0) ? k1 : k2;
  return [K, pt(K, ang(K, T), l2)];
}

function mix(A, B, u) {
  if (typeof A === 'number' && typeof B === 'number') return lerp(A, B, u);
  if (Array.isArray(A) && Array.isArray(B)) return A.map((v, i) => mix(v, B[i], u));
  if (A && B && typeof A === 'object') {
    const o = {};
    for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) o[k] = k in A && k in B ? mix(A[k], B[k], u) : (k in A ? A[k] : B[k]);
    return o;
  }
  return u < 0.5 ? A : B;
}

// ---------- Yan görünüş ----------
function torsoAt(J, f) {
  if (f <= 0.5) return { p: lerpP(J.hip, J.mid, f * 2), a: J.tA };
  return { p: lerpP(J.mid, J.sho, (f - 0.5) * 2), a: J.tU };
}

function solveSide(P) {
  const J = { prone: !!P.prone };
  J.hip = P.hip;
  J.tA = P.t; J.tU = P.t + (P.c || 0);
  J.mid = pt(J.hip, J.tA, L.t / 2);
  J.sho = pt(J.mid, J.tU, L.t / 2);
  const hd = P.hd != null ? P.hd : J.tU;
  J.hdA = hd;
  J.neck = pt(J.sho, hd, L.nk);
  J.head = pt(J.sho, hd, L.nk + L.hr);
  const fn = J.prone ? -90 : 90;
  J.fn = fn;
  for (const i of [1, 2]) {
    const s = P['as' + i] ?? P.as ?? 1;
    const l1 = L.ua * s; const l2 = L.fa * s;
    const w = P['w' + i] || (i === 2 && !P.ua2 ? P.w1 : null);
    const wr = P['wr' + i] || (i === 2 && !P.ua2 && !P.w2 ? P.wr1 : null);
    let E; let W;
    if (w || wr) {
      let T = w;
      if (wr) { const b = torsoAt(J, wr[0] / L.t); T = pt(b.p, b.a + fn, wr[1]); }
      [E, W] = ik(J.sho, T, l1, l2, P['ab' + i] ?? P.ab ?? 1);
    } else {
      const off = P.armRel ? J.tU : 0;
      const ua = (P['ua' + i] ?? P.ua1) + off; const fa = (P['fa' + i] ?? P.fa1) + off;
      E = pt(J.sho, ua, l1); W = pt(E, fa, l2);
    }
    J['elb' + i] = E; J['wri' + i] = W; J['hnd' + i] = pt(W, ang(E, W), L.hd);
  }
  for (const i of [1, 2]) {
    const k = P['k' + i] || (i === 2 && P.th2 == null ? P.k1 : null);
    let K; let A;
    if (k) [K, A] = ik(J.hip, k, L.th, L.sn, P['lb' + i] ?? P.lb ?? -1);
    else {
      const th = P['th' + i] ?? P.th1; const s = P['sn' + i] ?? P.sn1;
      K = pt(J.hip, th, L.th); A = pt(K, s, L.sn);
    }
    const snA = ang(K, A);
    const ft = P['ft' + i] ?? (J.prone ? snA + 90 : snA - 90);
    J['kne' + i] = K; J['ank' + i] = A; J['toe' + i] = pt(A, ft, L.ft); J['heel' + i] = pt(A, ft + 180, 4);
  }
  return J;
}

// Yan görünüşdə əzələlərin yeri: seqment, başlanğıc/son payı, ön tərəfə sürüşmə, en
const SIDE_MUS = [
  ['lower_back', 'torso', 0.08, 0.45, -8, 7],
  ['lats', 'torso', 0.45, 0.86, -5.5, 10],
  ['upper_back', 'torso', 0.74, 0.95, -8.5, 8],
  ['glutes', 'torso', -0.07, 0.1, -9.5, 13],
  ['obliques', 'torso', 0.14, 0.5, 1.5, 9],
  ['abs', 'torso', 0.12, 0.55, 7.5, 6],
  ['chest', 'torso', 0.6, 0.85, 8.5, 9],
  ['chest_upper', 'torso', 0.83, 0.94, 6.5, 6.5],
  ['traps', 'neck', -0.2, 0.9, -3, 8],
];
const LIMB_MUS = [
  ['delts_rear', 'ua', 0, 0.3, -3.2, 9.5],
  ['delts_side', 'ua', 0, 0.3, 0, 10.5],
  ['delts_front', 'ua', 0, 0.3, 3.2, 9.5],
  ['triceps', 'ua', 0.3, 0.86, -2.8, 6.5],
  ['biceps', 'ua', 0.32, 0.86, 2.8, 6.5],
  ['forearms', 'fa', 0.08, 0.62, 0, 7.5],
  ['adductors', 'th', 0.06, 0.45, 0, 6],
  ['hamstrings', 'th', 0.14, 0.86, -3.8, 8.5],
  ['quads', 'th', 0.14, 0.86, 3.8, 10],
  ['calves', 'sn', 0.08, 0.5, -3, 8],
];

function sideSegments(J, i) {
  return {
    ua: [J.sho, J['elb' + i]], fa: [J['elb' + i], J['wri' + i]],
    th: [J.hip, J['kne' + i]], sn: [J['kne' + i], J['ank' + i]],
  };
}

function capsule(p, q, a, b, off, nAng) {
  const P1 = lerpP(p, q, a); const P2 = lerpP(p, q, b);
  return [pt(P1, nAng, off), pt(P2, nAng, off)];
}

function sideMuscles(J, near) {
  const out = [];
  for (const [id, seg, a, b, off, w] of SIDE_MUS) {
    if (seg === 'neck') {
      const n = J.hdA + J.fn;
      const [p1, p2] = capsule(J.sho, J.neck, a, b, off, n);
      out.push({ id, p1, p2, w });
      continue;
    }
    if (!near) continue;
    const s1 = torsoAt(J, Math.max(0, a)); const s2 = torsoAt(J, Math.min(1, b));
    const ext = (s, f) => (f < 0 ? pt(s.p, s.a + 180, -f * L.t) : s.p);
    const p1 = pt(ext(s1, a), s1.a + J.fn, off); const p2 = pt(s2.p, s2.a + J.fn, off);
    out.push({ id, p1, p2, w });
  }
  return out;
}

function limbMuscles(J, i) {
  const S = sideSegments(J, i);
  return LIMB_MUS.map(([id, seg, a, b, off, w]) => {
    const [p, q] = S[seg];
    const legFlip = J.prone && (seg === 'th' || seg === 'sn');
    const n = ang(p, q) + (legFlip ? 90 : -90);
    const [p1, p2] = capsule(p, q, a, b, off, n);
    return { id, p1, p2, w };
  });
}

function smooth(pts) {
  // Kapalı Catmull-Rom → Bezier
  const n = pts.length; let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]; const p1 = pts[i]; const p2 = pts[(i + 1) % n]; const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

function sideTorsoPath(J) {
  const at = (f, w) => { const s = torsoAt(J, f); return pt(s.p, s.a + J.fn, w); };
  const back = (f, w) => at(f, -w);
  return smooth([
    back(-0.04, 10), back(0.1, 13), back(0.38, 10.5), back(0.7, 12.5), back(0.95, 10),
    at(1.02, 2), at(0.95, 9), at(0.74, 14), at(0.42, 10.5), at(0.12, 11), at(-0.04, 8),
  ]);
}

// ---------- Ön / arxa görünüş ----------
function solveFront(P) {
  const J = {};
  const t = P.t ?? -90; const sw = P.sw ?? 1;
  J.t = t; J.sw = sw;
  J.pel = P.pel;
  J.sc = pt(J.pel, t, 52);
  const pr = t + 90;
  J.pr = pr;
  J.shoR = pt(pt(J.sc, pr, 20 * sw), t, -2);
  J.shoL = pt(pt(J.sc, pr + 180, 20 * sw), t, -2);
  J.neck = pt(J.sc, t, 7);
  J.head = pt(J.sc, t, 19);
  J.hipR = pt(J.pel, pr, 8.5);
  J.hipL = pt(J.pel, pr + 180, 8.5);
  const mirA = (a) => -180 - a;
  const mirP = (p) => [2 * J.pel[0] - p[0], p[1]];
  for (const side of ['R', 'L']) {
    const S = J['sho' + side];
    const sgn = side === 'R' ? 1 : -1;
    const sa = side === 'R' ? (P.sR ?? 1) : (P.sL ?? P.sR ?? 1);
    const fa = side === 'R' ? (P.fR ?? sa) : (P.fL ?? P.fR ?? sa);
    let E; let W;
    let tgt = side === 'R' ? P.wR : (P.wL || (P.wR && P.uaL == null ? mirP(P.wR) : null));
    if (tgt) {
      [E, W] = ik(S, tgt, L.ua * Math.abs(sa), L.fa * Math.abs(fa), sgn * (P.ab ?? 1));
    } else {
      const ua = side === 'R' ? P.uaR : (P.uaL ?? mirA(P.uaR));
      const fA = side === 'R' ? P.faR : (P.faL ?? mirA(P.faR));
      E = pt(S, ua, L.ua * sa); W = pt(E, fA, L.fa * fa);
    }
    J['elb' + side] = E; J['wri' + side] = W;
    J['fwd' + side] = sa < 0.25; // qol izləyiciyə doğru (ön planda)
    const H = J['hip' + side];
    const ls = P.ls ?? 1; const lns = P.lns ?? 1;
    let K; let A;
    const kt = side === 'R' ? P.kR : (P.kL || (P.kR ? mirP(P.kR) : null));
    if (kt) [K, A] = ik(H, kt, L.th * ls, L.sn * lns, sgn);
    else {
      const th = side === 'R' ? (P.thR ?? 88) : (P.thL ?? mirA(P.thR ?? 88));
      const s = side === 'R' ? (P.snR ?? 90) : (P.snL ?? mirA(P.snR ?? 90));
      K = pt(H, th, L.th * ls); A = pt(K, s, L.sn * lns);
    }
    J['kne' + side] = K; J['ank' + side] = A;
  }
  return J;
}

function local(J, x, y) {
  // x: yan istiqamət (sağ +), y: çanaqdan yuxarı
  const sx = y > 30 ? J.sw : lerp(1, J.sw, Math.max(0, y) / 30);
  return pt(pt(J.pel, J.pr, x * sx), J.t, y);
}

function frontTorsoPath(J) {
  const R = [[15.5, -1], [14, 16], [15.5, 32], [18.5, 45], [21, 51], [9, 56]];
  const pts = [...R.map(([x, y]) => local(J, x, y)), ...R.slice().reverse().map(([x, y]) => local(J, -x, y)), local(J, -8, -7), local(J, 8, -7)];
  return smooth(pts);
}

const ELL = (cx, cy, rx, ry) => ({ e: [cx, cy, rx, ry] });
const FRONT_SHAPES = {
  chest: [ELL(9.5, 44, 9, 6.5), ELL(-9.5, 44, 9, 6.5)],
  chest_upper: [ELL(9.5, 48.6, 8, 2.8), ELL(-9.5, 48.6, 8, 2.8)],
  obliques: [ELL(13.2, 24, 3, 9.5), ELL(-13.2, 24, 3, 9.5)],
  lats: [ELL(16.6, 39, 2.2, 6), ELL(-16.6, 39, 2.2, 6)],
  abs: [35.5, 28.5, 21.5, 13.5].flatMap((y, i) => [ELL(3.3, y, 2.8, i === 3 ? 4.2 : 3), ELL(-3.3, y, 2.8, i === 3 ? 4.2 : 3)]),
  traps: [{ c: [[4.5, 56.5], [15, 53]], w: 5 }, { c: [[-4.5, 56.5], [-15, 53]], w: 5 }],
};
const BACK_SHAPES = {
  traps: [{ poly: [[0, 59], [15, 53], [6, 40], [0, 23], [-6, 40], [-15, 53]] }],
  upper_back: [ELL(9, 45, 5.2, 5), ELL(-9, 45, 5.2, 5)],
  lats: [{ poly: [[18.5, 47], [15.5, 30], [7, 21], [9, 39]] }, { poly: [[-18.5, 47], [-15.5, 30], [-7, 21], [-9, 39]] }],
  lower_back: [{ c: [[3.4, 6], [3.4, 24]], w: 5 }, { c: [[-3.4, 6], [-3.4, 24]], w: 5 }],
  obliques: [ELL(13.5, 18, 2.5, 6), ELL(-13.5, 18, 2.5, 6)],
  glutes: [ELL(7.5, -1, 8.5, 8.5), ELL(-7.5, -1, 8.5, 8.5)],
};
// Ön/arxa görünüşdə əzaların əzələləri: [id, seg, a, b, kənara sürüşmə (+ çölə), en]
const FRONT_LIMB = [['biceps', 'ua', 0.28, 0.84, 0, 7], ['triceps', 'ua', 0.22, 0.8, 3.4, 2.8], ['forearms', 'fa', 0.08, 0.62, 0, 7],
  ['quads', 'th', 0.12, 0.86, 0, 11.5], ['adductors', 'th', 0.04, 0.42, -4.6, 5], ['calves', 'sn', 0.1, 0.48, 2.6, 5.5]];
const BACK_LIMB = [['triceps', 'ua', 0.22, 0.85, 0, 7.5], ['forearms', 'fa', 0.08, 0.62, 0, 7],
  ['hamstrings', 'th', 0.16, 0.85, 0, 10.5], ['adductors', 'th', 0.05, 0.35, -4.5, 4], ['calves', 'sn', 0.06, 0.5, 0, 9]];

// ---------- Rekvizit ----------
function P_(J, ref) {
  if (Array.isArray(ref)) return ref;
  if (typeof ref === 'string') return J[ref];
  if (ref && ref.mid) return lerpP(J[ref.mid[0]], J[ref.mid[1]], 0.5);
  if (ref && ref.j) {
    const base = J[ref.j];
    if (ref.seg) {
      const [a, b] = ref.seg; const aa = ang(J[a], J[b]);
      return pt(pt(base, aa, ref.along || 0), aa + (ref.side || 1) * 90, ref.d || 0);
    }
    return [base[0] + (ref.dx || 0), base[1] + (ref.dy || 0)];
  }
  return [0, 0];
}

function Prop({ p, J }) {
  switch (p.k) {
    case 'line': { const a = P_(J, p.a); const b = P_(J, p.b); return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className={`rp-${p.c || 'frame'}`} strokeWidth={p.w || 3} />; }
    case 'circ': { const c = P_(J, p.at); return <circle cx={c[0]} cy={c[1]} r={p.r || 4} className={`rp-${p.c || 'frame'}`} />; }
    case 'rect': return <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx ?? 3} className={`rp-${p.c || 'pad'}`} transform={p.rot ? `rotate(${p.rot[0]} ${p.rot[1]} ${p.rot[2]})` : undefined} />;
    case 'poly': return <polygon points={p.pts.map((q) => q.join(',')).join(' ')} className={`rp-${p.c || 'frame'}`} />;
    case 'db': { const c = P_(J, p.j); return <g className={p.far ? 'rp-far' : ''}><circle cx={c[0]} cy={c[1]} r={6.5} className="rp-iron" /><circle cx={c[0]} cy={c[1]} r={2.4} className="rp-hub" /></g>; }
    case 'plate': { const c = P_(J, p.j); return <g><circle cx={c[0]} cy={c[1]} r={p.r || 14} className="rp-iron" /><circle cx={c[0]} cy={c[1]} r={(p.r || 14) * 0.62} className="rp-plate-in" /><circle cx={c[0]} cy={c[1]} r={2.6} className="rp-hub" /></g>; }
    case 'dbH': { const c = P_(J, p.j); return <g><line x1={c[0] - 9} y1={c[1]} x2={c[0] + 9} y2={c[1]} className="rp-bar" strokeWidth="3" /><rect x={c[0] - 13} y={c[1] - 6} width="5" height="12" rx="1.5" className="rp-iron" /><rect x={c[0] + 8} y={c[1] - 6} width="5" height="12" rx="1.5" className="rp-iron" /></g>; }
    case 'bar': {
      const a = P_(J, p.a); const b = P_(J, p.b); const aa = ang(a, b); const e = p.ext ?? 16;
      const A = pt(a, aa + 180, e); const B = pt(b, aa, e);
      return (
        <g>
          <line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} className="rp-bar" strokeWidth="3.5" />
          {p.plates !== false ? [A, B].map((q, i) => <rect key={i} x={q[0] - 3.5} y={q[1] - 11} width="7" height="22" rx="2" className="rp-iron" />) : null}
        </g>
      );
    }
    case 'cable': { const a = P_(J, p.a); const b = P_(J, p.b); return <g><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="rp-cable" /><circle cx={a[0]} cy={a[1]} r="4.5" className="rp-pulley" /></g>; }
    case 'band': { const a = P_(J, p.a); const b = P_(J, p.b); return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="rp-band" />; }
    case 'handle': { const c = P_(J, p.j); return <rect x={c[0] - 2.5} y={c[1] - 6} width="5" height="12" rx="2" className="rp-iron" />; }
    case 'pad': { const c = P_(J, p.at); return <circle cx={c[0]} cy={c[1]} r={p.r || 6.5} className="rp-pad" />; }
    default: return null;
  }
}

// ---------- Vaxt ----------
export function timeline(spec, tsec) {
  if (spec.cycle) { const per = spec.period || 1.6; return { phi: (tsec % per) / per, ph: -1 }; }
  if (spec.keys) {
    const ts = spec.times; const T = ts.reduce((a, b) => a + b, 0);
    let x = tsec % T; let i = 0;
    while (x > ts[i]) { x -= ts[i]; i++; }
    return { key: i, f: ease(x / ts[i]), ph: -1 };
  }
  const [up, h1, down, h2] = spec.tempo || [1, 0.35, 2, 0.45];
  const T = up + h1 + down + h2; let x = tsec % T;
  if (x < up) return { u: ease(x / up), ph: 0 };
  x -= up; if (x < h1) return { u: 1, ph: 1 };
  x -= h1; if (x < down) return { u: 1 - ease(x / down), ph: 2 };
  return { u: 0, ph: 3 };
}

function poseAt(spec, tl) {
  if (spec.cycle) return spec.cycle(tl.phi);
  if (spec.keys) return mix(spec.keys[tl.key], spec.keys[(tl.key + 1) % spec.keys.length], tl.f);
  return mix(spec.A, spec.B, tl.u);
}

function effort(tl) {
  if (tl.u != null) return tl.u;
  if (tl.phi != null) return 0.6 + 0.4 * Math.sin(tl.phi * Math.PI * 2);
  return 0.5 + 0.5 * Math.sin(((tl.key + tl.f) / 3) * Math.PI);
}

// ---------- Çəkiliş ----------
function Muscle({ m, st }) {
  return <line x1={m.p1[0]} y1={m.p1[1]} x2={m.p2[0]} y2={m.p2[1]} strokeWidth={m.w} className={`rm rm-${st}`} />;
}

function renderSide(spec, P, state, act, gid) {
  const J = solveSide(P);
  const props = spec.props || [];
  const layer = (z) => props.filter((p) => (p.z || 'back') === z).map((p, i) => <Prop key={z + i} p={p} J={J} />);
  const limb = (i, cls) => (
    <g className={cls}>
      <line x1={J.hip[0]} y1={J.hip[1]} x2={J['kne' + i][0]} y2={J['kne' + i][1]} strokeWidth={TH.th} className="rb" />
      <line x1={J['kne' + i][0]} y1={J['kne' + i][1]} x2={J['ank' + i][0]} y2={J['ank' + i][1]} strokeWidth={TH.sn} className="rb" />
      <line x1={J['heel' + i][0]} y1={J['heel' + i][1]} x2={J['toe' + i][0]} y2={J['toe' + i][1]} strokeWidth={TH.ft} className="rb rb-foot" />
    </g>
  );
  const arm = (i, cls) => (
    <g className={cls}>
      <line x1={J.sho[0]} y1={J.sho[1]} x2={J['elb' + i][0]} y2={J['elb' + i][1]} strokeWidth={TH.ua} className="rb" />
      <line x1={J['elb' + i][0]} y1={J['elb' + i][1]} x2={J['wri' + i][0]} y2={J['wri' + i][1]} strokeWidth={TH.fa} className="rb" />
      <circle cx={J['hnd' + i][0]} cy={J['hnd' + i][1]} r="4.6" className="rb-hand" />
    </g>
  );
  const mus = (list) => {
    const n = list.filter((m) => state(m.id) === 'n');
    const s = list.filter((m) => state(m.id) === 's');
    const p = list.filter((m) => state(m.id) === 'p');
    return (
      <>
        {n.map((m, i) => <Muscle key={'n' + i} m={m} st="n" />)}
        {s.map((m, i) => <Muscle key={'s' + i} m={m} st="s" />)}
        {p.length ? <g filter={`url(#${gid})`} opacity={0.55 + 0.45 * act}>{p.map((m, i) => <Muscle key={'p' + i} m={m} st="p" />)}</g> : null}
      </>
    );
  };
  const legM = (i) => limbMuscles(J, i).filter((m) => ['adductors', 'hamstrings', 'quads', 'calves'].includes(m.id));
  const armM = (i) => limbMuscles(J, i).filter((m) => !['adductors', 'hamstrings', 'quads', 'calves'].includes(m.id));
  const shadowX = (J.ank1[0] + J.ank2[0]) / 2;
  return (
    <>
      {spec.noShadow ? null : <ellipse cx={shadowX} cy={GROUND + 1} rx="30" ry="3.2" className="rig-shadow" />}
      {layer('back')}
      <g className="rig-far">
        {arm(2, '')}{limb(2, '')}
        <g opacity="0.75">{mus([...armM(2), ...legM(2)])}</g>
      </g>
      {layer('far')}
      {layer('mid')}
      <path d={sideTorsoPath(J)} className="rb-torso" />
      <line x1={J.sho[0]} y1={J.sho[1]} x2={J.neck[0]} y2={J.neck[1]} strokeWidth={TH.nk} className="rb" />
      <circle cx={J.head[0]} cy={J.head[1]} r={L.hr} className="rb-head" />
      <circle cx={pt(J.head, J.hdA + J.fn, 6.5)[0]} cy={pt(J.head, J.hdA + J.fn, 6.5)[1]} r="2.2" className="rb-face" />
      {mus(sideMuscles(J, true))}
      {limb(1, '')}
      {mus(legM(1))}
      {layer('near')}
      {arm(1, '')}
      {mus(armM(1))}
      {layer('front')}
    </>
  );
}

function renderFront(spec, P, state, act, gid, back) {
  const J = solveFront(P);
  const props = spec.props || [];
  const layer = (z) => props.filter((p) => (p.z || 'back') === z).map((p, i) => <Prop key={z + i} p={p} J={J} />);
  const seg = (a, b, w, cls = 'rb') => <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={w} className={cls} />;
  const limbs = { R: { ua: [J.shoR, J.elbR], fa: [J.elbR, J.wriR], th: [J.hipR, J.kneR], sn: [J.kneR, J.ankR] }, L: { ua: [J.shoL, J.elbL], fa: [J.elbL, J.wriL], th: [J.hipL, J.kneL], sn: [J.kneL, J.ankL] } };
  const limbMus = [];
  for (const side of ['R', 'L']) {
    const out = side === 'R' ? 1 : -1;
    for (const [id, sg, a, b, off, w] of back ? BACK_LIMB : FRONT_LIMB) {
      const [p, q] = limbs[side][sg];
      const n = J.pr + (out > 0 ? 0 : 180);
      const P1 = pt(lerpP(p, q, a), n, off); const P2 = pt(lerpP(p, q, b), n, off);
      limbMus.push({ id, p1: P1, p2: P2, w, arm: sg === 'ua' || sg === 'fa', side });
    }
  }
  const shapes = back ? BACK_SHAPES : FRONT_SHAPES;
  const torsoMus = [];
  for (const [id, list] of Object.entries(shapes)) {
    for (const s of list) {
      if (s.e) {
        const [cx, cy, rx, ry] = s.e; const c = local(J, cx, cy);
        torsoMus.push({ id, el: <ellipse cx={c[0]} cy={c[1]} rx={rx * J.sw} ry={ry} transform={`rotate(${J.t + 90} ${c[0]} ${c[1]})`} /> });
      } else if (s.c) {
        const a = local(J, ...s.c[0]); const b = local(J, ...s.c[1]);
        torsoMus.push({ id, el: <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={s.w} strokeLinecap="round" /> });
      } else if (s.poly) {
        torsoMus.push({ id, el: <polygon points={s.poly.map(([x, y]) => local(J, x, y).map((v) => v.toFixed(1)).join(',')).join(' ')} /> });
      }
    }
  }
  // Deltoid başları
  const delts = [];
  for (const side of ['R', 'L']) {
    const S = J['sho' + side]; const o = side === 'R' ? J.pr : J.pr + 180;
    if (back) {
      const c1 = pt(S, o, 3); delts.push({ id: 'delts_side', el: <circle cx={c1[0]} cy={c1[1]} r="5" /> });
      delts.push({ id: 'delts_rear', el: <circle cx={S[0]} cy={S[1] + 1} r="6.3" /> });
    } else {
      const c1 = pt(S, o, 2.6); delts.push({ id: 'delts_side', el: <circle cx={c1[0]} cy={c1[1]} r="6.4" /> });
      const c2 = pt(pt(S, o, -1.8), J.t, -1.5); delts.push({ id: 'delts_front', el: <circle cx={c2[0]} cy={c2[1]} r="5.4" /> });
    }
  }
  const all = [...torsoMus, ...delts];
  const tor = (st) => all.filter((m) => state(m.id) === st).map((m, i) => <g key={st + i} className={`rm-f rm-${st}`}>{m.el}</g>);
  const lm = (filter, st) => limbMus.filter((m) => filter(m) && state(m.id) === st).map((m, i) => <Muscle key={st + i} m={m} st={st} />);
  const musSet = (filter, torso) => (
    <>
      {torso ? tor('n') : null}{lm(filter, 'n')}
      {torso ? tor('s') : null}{lm(filter, 's')}
      <g filter={`url(#${gid})`} opacity={0.55 + 0.45 * act}>{torso ? tor('p') : null}{lm(filter, 'p')}</g>
    </>
  );
  const arm = (side) => (
    <g key={side}>
      {seg(J['sho' + side], J['elb' + side], TH.ua)}
      {seg(J['elb' + side], J['wri' + side], TH.fa)}
      <circle cx={J['wri' + side][0]} cy={J['wri' + side][1]} r="4.8" className="rb-hand" />
    </g>
  );
  const leg = (side) => (
    <g key={side}>
      {seg(J['hip' + side], J['kne' + side], TH.th)}
      {seg(J['kne' + side], J['ank' + side], TH.sn)}
      {seg(J['ank' + side], pt(J['ank' + side], side === 'R' ? 70 : 110, 6), 7, 'rb rb-foot')}
    </g>
  );
  const behind = back ? ['R', 'L'].filter((s) => J['fwd' + s]) : [];
  const infront = ['R', 'L'].filter((s) => !behind.includes(s));
  return (
    <>
      {spec.noShadow ? null : <ellipse cx={(J.ankR[0] + J.ankL[0]) / 2} cy={GROUND + 1} rx="34" ry="3.2" className="rig-shadow" />}
      {layer('back')}
      {behind.map(arm)}
      {behind.length ? musSet((m) => m.arm && behind.includes(m.side), false) : null}
      {layer('mid')}
      {leg('R')}{leg('L')}
      {musSet((m) => !m.arm, false)}
      <path d={frontTorsoPath(J)} className="rb-torso" />
      {seg(J.sc, J.neck, TH.nk)}
      <circle cx={J.head[0]} cy={J.head[1]} r={L.hr} className={back ? 'rb-head rb-hair' : 'rb-head'} />
      {musSet(() => false, true)}
      {layer('near')}
      {infront.map(arm)}
      {musSet((m) => m.arm && infront.includes(m.side), false)}
      {layer('front')}
    </>
  );
}

// Hərəkətin bütün fazalarını əhatə edən çərçivə (fiqur kadrı doldursun)
function autoVB(spec) {
  const poses = spec.cycle ? [0, 0.25, 0.5, 0.75].map((f) => spec.cycle(f)) : spec.keys ? spec.keys : [spec.A, spec.B, mix(spec.A, spec.B, 0.5)];
  const xs = []; const ys = [];
  const add = (q) => { if (Array.isArray(q) && q.length === 2 && typeof q[0] === 'number') { xs.push(q[0]); ys.push(q[1]); } };
  for (const P of poses) {
    const J = spec.view === 'side' ? solveSide(P) : solveFront(P);
    Object.values(J).forEach(add);
  }
  for (const p of spec.props || []) {
    [p.a, p.b, p.at].forEach(add);
    if (p.k === 'rect' && !p.rot) { add([p.x, p.y]); add([p.x + p.w, p.y + p.h]); }
  }
  let x0 = Math.min(...xs) - 18; let x1 = Math.max(...xs) + 18;
  let y0 = Math.min(...ys) - 20; const y1 = GROUND + 7;
  let w = x1 - x0; let h = y1 - y0;
  if (w / h < 1.05) { const d = h * 1.05 - w; x0 -= d / 2; w += d; }
  if (w / h > 1.5) { const d = w / 1.5 - h; y0 -= d; h += d; }
  return `${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
}

export function RigFigure({ spec, primary = [], secondary = [], playing = true, speed = 1, still = false, stillU, onPhase, className = '' }) {
  const gid = 'rg' + useId().replace(/:/g, '');
  const [t, setT] = useState(still ? 0 : 0);
  const tRef = useRef(0);
  const phRef = useRef(null);
  useEffect(() => { tRef.current = 0; setT(0); }, [spec]);
  useEffect(() => {
    if (still || !playing) return undefined;
    let raf; let last = performance.now();
    const loop = (now) => {
      tRef.current += ((now - last) / 1000) * speed; last = now;
      setT(tRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, still, spec]);

  const su = stillU ?? spec.thumbU ?? 1;
  const tl = still ? (spec.cycle ? { phi: su * 0.5 } : spec.keys ? { key: su > 0.5 ? 1 : 0, f: 0.5 } : { u: su, ph: 1 }) : timeline(spec, t);
  useEffect(() => {
    if (onPhase && tl.ph !== phRef.current) { phRef.current = tl.ph; onPhase(tl.ph); }
  });
  const P = poseAt(spec, tl);
  const state = (id) => (primary.includes(id) ? 'p' : secondary.includes(id) ? 's' : 'n');
  const act = still ? 1 : effort(tl);
  const vb = useMemo(() => spec.vb || autoVB(spec), [spec]);
  return (
    <svg viewBox={vb} className={`rig ${className}`} aria-hidden="true">
      <defs>
        <filter id={gid} filterUnits="userSpaceOnUse" x="-200" y="-200" width="700" height="600">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <line x1="-300" y1={GROUND + 0.5} x2="600" y2={GROUND + 0.5} className="rig-floor" />
      {spec.view === 'side' ? renderSide(spec, P, state, act, gid) : renderFront(spec, P, state, act, gid, spec.view === 'back')}
    </svg>
  );
}
