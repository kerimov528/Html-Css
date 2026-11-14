// Hər hərəkətin animasiya təsviri. A = başlanğıc, B = əzələnin yığıldığı son nöqtə.
// Koordinatlar 260×214 səhnədə; döşəmə y=204, fiqur sağa baxır.
const TAU = Math.PI * 2;
const LBL = {
  press: ['İtələ', 'Nəzarətlə endir'], pull: ['Dart, kürəkləri sıx', 'Nəzarətlə burax'], fly: ['Qucaqla — sinəni sıx', 'Aç, sinəni dart'],
  raise: ['Qaldır', 'Yavaş endir'], curl: ['Bük, yuxarıda sıx', 'Yavaş aç'], ext: ['Aç, sonda sıx', 'Nəzarətlə bük'],
  squat: ['Dabanla it, qalx', 'Nəzarətlə en'], hinge: ['Kalçanı irəli it, qalx', 'Kalçanı geri ver, en'],
  crunch: ['Bükül, qarnı sıx', 'Yavaş aç'], hold: ['Saxla — nəfəs al', 'Saxla — nəfəs ver'], swing: ['İrəli', 'Geri'],
  lcurl: ['Dabanı çək', '3 saniyəyə aç'], lext: ['Ayağı aç, budu sıx', '3 saniyəyə endir'], dip: ['İt, qolları aç', 'Nəzarətlə en'],
  rot: ['Fırlan / it', 'Qayıt'], cardio: ['Ritmik temp'],
};

// ---------- Ümumi rekvizitlər ----------
const flatBench = (z = 'mid') => [
  { k: 'rect', x: 50, y: 150, w: 124, h: 8, c: 'pad', z },
  { k: 'line', a: [68, 158], b: [68, 204], w: 4, z: 'back' }, { k: 'line', a: [156, 158], b: [156, 204], w: 4, z: 'back' },
];
const seat = (x0 = 100, x1 = 146, y = 158) => [
  { k: 'rect', x: x0, y, w: x1 - x0, h: 8, c: 'pad', z: 'back' },
  { k: 'line', a: [(x0 + x1) / 2, y + 8], b: [(x0 + x1) / 2, 204], w: 4, z: 'back' },
];
const backrest = (a, b) => ({ k: 'line', a, b, w: 9, c: 'pad', z: 'back' });
const dbs = () => [{ k: 'db', j: 'wri2', far: true, z: 'far' }, { k: 'db', j: 'wri1', z: 'front' }];
const dbF = () => [{ k: 'dbH', j: 'wriR', z: 'front' }, { k: 'dbH', j: 'wriL', z: 'front' }];
const frontSeat = () => [
  { k: 'rect', x: 108, y: 80, w: 44, h: 70, c: 'pad2', z: 'back' },
  { k: 'rect', x: 104, y: 148, w: 52, h: 9, c: 'pad', z: 'back' },
  { k: 'line', a: [130, 157], b: [130, 204], w: 4, z: 'back' },
];
const SEATED_F = { pel: [130, 150], ls: 0.35, lns: 0.85, thR: 86, snR: 90 };
const STAND_F = { pel: [130, 113], thR: 86, snR: 90 };
const STAND = { hip: [127, 115], t: -88, k1: [125, 200], k2: [132, 200] };

// ---------- Yan görünüş: uzanaraq press ----------
function lyingPress({ incline = false, imp = 'db', close = false } = {}) {
  const props = [];
  let A; let B;
  if (incline) {
    props.push({ k: 'rect', x: 128, y: 150, w: 46, h: 8, c: 'pad', z: 'mid' }, { k: 'rect', x: 50, y: 150, w: 86, h: 8, c: 'pad', z: 'mid', rot: [30, 136, 154] },
      { k: 'line', a: [160, 158], b: [160, 204], w: 4 }, { k: 'line', a: [92, 140], b: [86, 204], w: 4 });
    const base = { hip: [148, 140], t: 210, k1: [190, 200], k2: [194, 200], as: 0.92 };
    A = { ...base, w1: [112, 100] }; B = { ...base, w1: [106, 58] };
  } else {
    props.push(...flatBench());
    const base = { hip: [150, 139], t: 180, k1: [190, 200], k2: [194, 200], as: 0.92 };
    A = { ...base, w1: [close ? 100 : 104, 125] }; B = { ...base, w1: [98, 82] };
  }
  if (imp === 'db') props.push(...dbs());
  if (imp === 'bb') props.push({ k: 'plate', j: 'wri1', r: 15, z: 'front' });
  if (imp === 'smith') props.push({ k: 'line', a: [incline ? 110 : 101, 26], b: [incline ? 110 : 101, 204], w: 4, z: 'back' }, { k: 'plate', j: 'wri1', r: 8, z: 'front' });
  return { view: 'side', A, B, props, labels: LBL.press };
}

function seatedPress({ incline = false } = {}) {
  const base = { hip: [122, 150], t: -96, k1: [168, 200], k2: [172, 200] };
  return {
    view: 'side',
    A: { ...base, w1: incline ? [140, 98] : [140, 110] },
    B: { ...base, w1: incline ? [170, 64] : [176, 102] },
    props: [...seat(), backrest([107, 154], [101, 78]), { k: 'line', a: incline ? [96, 196] : [156, 24], b: 'wri1', w: 4, z: 'near' }, { k: 'circ', at: incline ? [96, 196] : [156, 24], r: 5 }, { k: 'handle', j: 'wri1', z: 'front' }],
    labels: LBL.press,
  };
}

// ---------- Ön görünüş: fly ----------
function fly(mode) {
  if (mode === 'pecdeck') {
    return {
      view: 'front', A: { ...SEATED_F, uaR: 0, sR: 1, faR: -12, fR: 1 }, B: { ...SEATED_F, uaR: 0, sR: -0.32, faR: 0, fR: -0.32 },
      props: [...frontSeat(), { k: 'line', a: [40, 24], b: [220, 24], w: 5, z: 'back' }, { k: 'pad', at: 'wriR', r: 5, z: 'front' }, { k: 'pad', at: 'wriL', r: 5, z: 'front' }],
      labels: LBL.fly,
    };
  }
  if (mode === 'crossover') {
    return {
      view: 'front', A: { ...STAND_F, uaR: -38, faR: -30 }, B: { ...STAND_F, uaR: 108, faR: 104, sR: 0.9 },
      props: [{ k: 'line', a: [236, 10], b: [236, 204], w: 5 }, { k: 'line', a: [24, 10], b: [24, 204], w: 5 }, { k: 'cable', a: [234, 18], b: 'wriR', z: 'front' }, { k: 'cable', a: [26, 18], b: 'wriL', z: 'front' }, { k: 'handle', j: 'wriR', z: 'front' }, { k: 'handle', j: 'wriL', z: 'front' }],
      labels: LBL.fly,
    };
  }
  if (mode === 'lowhigh') {
    return {
      view: 'front', A: { ...STAND_F, uaR: 62, faR: 58 }, B: { ...STAND_F, uaR: -150, sR: 0.45, faR: -155, fR: 0.4 },
      props: [{ k: 'line', a: [236, 10], b: [236, 204], w: 5 }, { k: 'line', a: [24, 10], b: [24, 204], w: 5 }, { k: 'cable', a: [234, 194], b: 'wriR', z: 'front' }, { k: 'cable', a: [26, 194], b: 'wriL', z: 'front' }, { k: 'handle', j: 'wriR', z: 'front' }, { k: 'handle', j: 'wriL', z: 'front' }],
      labels: LBL.fly,
    };
  }
  return { // meyilli skamyada hantel fly (öndən)
    view: 'front', A: { ...SEATED_F, uaR: 14, faR: 18 }, B: { ...SEATED_F, uaR: 0, sR: -0.22, faR: 0, fR: -0.22 },
    props: [{ k: 'rect', x: 108, y: 44, w: 44, h: 106, c: 'pad2', z: 'back' }, { k: 'rect', x: 104, y: 148, w: 52, h: 9, c: 'pad', z: 'back' }, { k: 'line', a: [130, 157], b: [130, 204], w: 4 }, ...dbF()],
    labels: LBL.fly,
  };
}

// ---------- Çiyin ----------
function shoulderPress(imp) {
  const props = [...frontSeat()];
  if (imp === 'db') props.push(...dbF());
  if (imp === 'machine') props.push({ k: 'line', a: [212, 150], b: 'wriR', w: 4 }, { k: 'line', a: [48, 150], b: 'wriL', w: 4 }, { k: 'handle', j: 'wriR', z: 'front' }, { k: 'handle', j: 'wriL', z: 'front' });
  if (imp === 'smith') props.push({ k: 'line', a: [70, 14], b: [70, 204], w: 4 }, { k: 'line', a: [190, 14], b: [190, 204], w: 4 }, { k: 'bar', a: 'wriL', b: 'wriR', ext: 22, z: 'front' });
  return { view: 'front', A: { ...SEATED_F, uaR: 8, faR: -88 }, B: { ...SEATED_F, uaR: -62, faR: -96 }, props, labels: LBL.press };
}
function landmine() {
  const base = { hip: [127, 115], t: -84, k1: [146, 200], k2: [108, 200] };
  return {
    view: 'side', A: { ...base, w1: [148, 66] }, B: { ...base, w1: [178, 26] },
    props: [{ k: 'line', a: [36, 202], b: { j: 'wri1', dx: 8, dy: -8 }, w: 4, c: 'bar', z: 'back' }, { k: 'circ', at: [36, 202], r: 5 }, { k: 'circ', at: { j: 'wri1', dx: 10, dy: -10 }, r: 9, c: 'iron', z: 'front' }],
    labels: LBL.press,
  };
}
function lateral(imp) {
  const base = imp === 'machine' ? SEATED_F : STAND_F;
  const B = imp === 'y' ? { ...base, uaR: -40, faR: -42 } : { ...base, uaR: -4, faR: -8 };
  const props = imp === 'machine' ? [...frontSeat(), { k: 'pad', at: 'elbR', r: 5.5, z: 'front' }, { k: 'pad', at: 'elbL', r: 5.5, z: 'front' }]
    : imp === 'db' ? dbF()
      : [{ k: 'line', a: [236, 60], b: [236, 204], w: 5 }, { k: 'line', a: [24, 60], b: [24, 204], w: 5 }, { k: 'cable', a: [26, 196], b: 'wriR', z: 'front' }, { k: 'cable', a: [234, 196], b: 'wriL', z: 'front' }, { k: 'handle', j: 'wriR', z: 'front' }, { k: 'handle', j: 'wriL', z: 'front' }];
  return { view: 'front', A: { ...base, uaR: 80, faR: 84 }, B, props, labels: LBL.raise };
}

// ---------- Kürək ----------
function row(mode) {
  if (mode === 'cable') {
    const base = { hip: [110, 162], k1: [192, 170], k2: [194, 172] };
    return {
      view: 'side', A: { ...base, t: -74, w1: [182, 118] }, B: { ...base, t: -95, w1: [124, 128] },
      props: [{ k: 'rect', x: 64, y: 170, w: 78, h: 7, c: 'pad', z: 'back' }, { k: 'line', a: [103, 177], b: [103, 204], w: 4 }, { k: 'line', a: [214, 146], b: [214, 196], w: 5 }, { k: 'cable', a: [212, 156], b: 'wri1', z: 'front' }, { k: 'handle', j: 'wri1', z: 'front' }],
      labels: LBL.pull,
    };
  }
  if (mode === 'machine') {
    const base = { hip: [122, 150], t: -86, k1: [166, 200], k2: [170, 200] };
    return {
      view: 'side', A: { ...base, w1: [190, 104] }, B: { ...base, w1: [142, 110] },
      props: [...seat(), { k: 'rect', x: 140, y: 92, w: 8, h: 38, c: 'pad', z: 'mid' }, { k: 'line', a: [144, 92], b: [144, 40], w: 4 }, { k: 'line', a: [204, 30], b: 'wri1', w: 4, z: 'near' }, { k: 'circ', at: [204, 30], r: 5 }, { k: 'handle', j: 'wri1', z: 'front' }],
      labels: LBL.pull,
    };
  }
  if (mode === 'tbar') {
    const base = { hip: [116, 118], t: -38, k1: [128, 200], k2: [110, 200] };
    return {
      view: 'side', A: { ...base, w1: [163, 142] }, B: { ...base, w1: [150, 116] },
      props: [{ k: 'line', a: [146, 115], b: [172, 92], w: 8, c: 'pad', z: 'mid' }, { k: 'line', a: [160, 104], b: [182, 204], w: 4 }, { k: 'line', a: [40, 202], b: 'wri1', w: 4, c: 'bar', z: 'back' }, { k: 'plate', j: 'wri1', r: 11, z: 'front' }],
      labels: LBL.pull,
    };
  }
  // tək əllə hantel dartışı (skamyada)
  const base = { hip: [110, 122], t: -6, k1: [104, 200], th2: 92, sn2: 180, w2: [170, 170] };
  return {
    view: 'side', A: { ...base, w1: [167, 172] }, B: { ...base, w1: [138, 128] },
    props: [{ k: 'rect', x: 42, y: 172, w: 136, h: 8, c: 'pad', z: 'back' }, { k: 'line', a: [58, 180], b: [58, 204], w: 4 }, { k: 'line', a: [162, 180], b: [162, 204], w: 4 }, { k: 'db', j: 'wri1', z: 'front' }],
    labels: LBL.pull,
  };
}

function pulldown(mode) {
  const seatB = [{ k: 'rect', x: 104, y: 148, w: 52, h: 9, c: 'pad', z: 'back' }, { k: 'line', a: [130, 157], b: [130, 204], w: 4 }];
  if (mode === 'assist') {
    const legs = { ls: 0.55, lns: 0.4, thR: 92, snR: 90 };
    return {
      view: 'back', A: { ...legs, pel: [130, 146], wR: [178, 28] }, B: { ...legs, pel: [130, 100], wR: [168, 28] },
      props: [{ k: 'line', a: [60, 26], b: [200, 26], w: 4, c: 'bar' }, { k: 'line', a: [62, 26], b: [62, 204], w: 5 }, { k: 'line', a: [198, 26], b: [198, 204], w: 5 }, { k: 'line', a: { j: 'kneL', dx: -10, dy: 8 }, b: { j: 'kneR', dx: 10, dy: 8 }, w: 7, c: 'pad', z: 'front' }],
      labels: LBL.pull,
    };
  }
  if (mode === 'single') {
    return {
      view: 'back', A: { ...SEATED_F, wR: [176, 32], uaL: 100, faL: 60 }, B: { ...SEATED_F, wR: [164, 92], uaL: 100, faL: 60 },
      props: [...seatB, { k: 'cable', a: [176, 4], b: 'wriR', z: 'back' }, { k: 'handle', j: 'wriR', z: 'front' }],
      labels: LBL.pull,
    };
  }
  const props = [...seatB];
  if (mode === 'machine') props.push({ k: 'line', a: [96, 6], b: 'wriL', w: 4 }, { k: 'line', a: [164, 6], b: 'wriR', w: 4 }, { k: 'handle', j: 'wriR', z: 'front' }, { k: 'handle', j: 'wriL', z: 'front' });
  else props.push({ k: 'cable', a: [130, 4], b: { mid: ['wriL', 'wriR'] }, z: 'back' }, { k: 'bar', a: 'wriL', b: 'wriR', ext: 20, plates: false, z: 'front' });
  return { view: 'back', A: { ...SEATED_F, wR: [176, 32] }, B: { ...SEATED_F, wR: [166, 92] }, props, labels: LBL.pull };
}

// ---------- Ayaq ----------
function squat(mode) {
  const k = { k1: [128, 200], k2: [134, 200] };
  const props = [];
  let A = { ...k, hip: [126, 115], t: -86 };
  let B = { ...k, hip: [98, 152], t: -52 };
  if (mode === 'goblet') { A = { ...A, wr1: [44, 18] }; B = { ...B, t: -64, wr1: [44, 18] }; props.push({ k: 'db', j: 'wri1', z: 'front' }); }
  if (mode === 'smith') {
    A = { ...A, wr1: [54, -9] }; B = { ...B, t: -60, wr1: [54, -9] };
    props.push({ k: 'line', a: [122, 18], b: [122, 204], w: 4 }, { k: 'plate', j: 'sho', r: 9, z: 'front' });
  }
  if (mode === 'hack') {
    const kk = { k1: [140, 200], k2: [146, 200] };
    A = { ...kk, hip: [130, 116], t: -80, wr1: [52, -4] }; B = { ...kk, hip: [106, 150], t: -58, wr1: [52, -4] };
    props.push({ k: 'line', a: { j: 'hip', seg: ['hip', 'sho'], side: -1, d: 14, along: -6 }, b: { j: 'sho', seg: ['hip', 'sho'], side: -1, d: 13, along: 6 }, w: 8, c: 'pad', z: 'back' },
      { k: 'line', a: [60, 30], b: [150, 204], w: 4 });
  }
  if (mode === 'box' || mode === 'bw') {
    A = { ...A, ua1: 86, fa1: 86 }; B = { ...B, hip: mode === 'box' ? [100, 146] : B.hip, t: -58, ua1: 2, fa1: 2 };
    if (mode === 'box') props.push({ k: 'rect', x: 62, y: 150, w: 50, h: 8, c: 'pad' }, { k: 'line', a: [70, 158], b: [70, 204], w: 4 }, { k: 'line', a: [104, 158], b: [104, 204], w: 4 });
  }
  return { view: 'side', A, B, props, labels: LBL.squat };
}

function legPress() {
  const ft = -135;
  const base = { hip: [116, 160], t: -136, w1: [122, 162], ft1: ft, ft2: ft };
  return {
    view: 'side', A: { ...base, k1: [178, 104], k2: [181, 101] }, B: { ...base, k1: [152, 130], k2: [155, 127] },
    props: [{ k: 'line', a: [110, 172], b: [64, 128], w: 9, c: 'pad' }, { k: 'rect', x: 98, y: 166, w: 40, h: 8, c: 'pad' }, { k: 'line', a: [118, 174], b: [118, 204], w: 4 },
      { k: 'line', a: [150, 160], b: [232, 78], w: 4 }, { k: 'line', a: { j: 'ank1', dx: 20.5, dy: 13.5 }, b: { j: 'ank1', dx: -13.5, dy: -20.5 }, w: 6, c: 'pad', z: 'front' }],
    labels: ['Platformanı it', 'Endir — dizlər 90°'],
  };
}

function hinge(imp) {
  const k = { k1: [128, 200], k2: [134, 200] };
  if (imp === 'ext45') {
    const base = { hip: [122, 120], th1: 132, sn1: 132, wr1: [42, 9] };
    return {
      view: 'side', A: { ...base, t: 64 }, B: { ...base, t: -46 },
      props: [{ k: 'circ', at: [134, 133], r: 9, c: 'pad', z: 'mid' }, { k: 'line', a: [134, 140], b: [150, 204], w: 4 }, { k: 'line', a: [54, 196], b: [74, 176], w: 5, c: 'pad' }, { k: 'line', a: [62, 190], b: [62, 204], w: 4 }],
      labels: LBL.hinge,
    };
  }
  if (imp === 'dowel') {
    const dw = { wr1: [60, -16], wr2: [6, -18] };
    return {
      view: 'side', A: { ...k, ...dw, hip: [128, 115], t: -87 }, B: { ...k, ...dw, hip: [106, 120], t: -14 },
      props: [{ k: 'line', a: { j: 'hip', seg: ['hip', 'sho'], side: -1, d: 14, along: -10 }, b: { j: 'sho', seg: ['hip', 'sho'], side: -1, d: 13, along: 26 }, w: 3.5, c: 'bar', z: 'front' }],
      labels: LBL.hinge,
    };
  }
  const A = { ...k, hip: [128, 115], t: -87, ua1: 90, fa1: 90 };
  const B = { ...k, hip: imp === 'smith' ? [102, 122] : [106, 120], t: imp === 'smith' ? -18 : -14, ua1: 90, fa1: 90 };
  const props = imp === 'db' ? dbs() : imp === 'bb' ? [{ k: 'plate', j: 'wri1', r: 15, z: 'front' }] : [{ k: 'line', a: [146, 30], b: [146, 204], w: 4 }, { k: 'plate', j: 'wri1', r: 8, z: 'front' }];
  return { view: 'side', A, B, props, labels: LBL.hinge };
}

function legCurl(mode) {
  if (mode === 'lying') {
    const base = { hip: [138, 139], t: 180, prone: true, th1: 0, w1: [72, 170] };
    return {
      view: 'side', A: { ...base, sn1: 2 }, B: { ...base, sn1: -112 },
      props: [{ k: 'rect', x: 40, y: 150, w: 150, h: 8, c: 'pad', z: 'mid' }, { k: 'line', a: [60, 158], b: [60, 204], w: 4 }, { k: 'line', a: [176, 158], b: [176, 204], w: 4 },
        { k: 'pad', at: { j: 'ank1', seg: ['kne1', 'ank1'], side: -1, d: 8, along: -5 }, r: 6.5, z: 'front' }],
      labels: LBL.lcurl,
    };
  }
  if (mode === 'standing') {
    const base = { hip: [126, 115], t: -82, k2: [128, 200], th1: 94, w1: [172, 96] };
    return {
      view: 'side', A: { ...base, sn1: 92 }, B: { ...base, sn1: 208 },
      props: [{ k: 'line', a: [180, 66], b: [180, 204], w: 5 }, { k: 'pad', at: { j: 'kne1', seg: ['hip', 'kne1'], side: -1, d: 9, along: -8 }, r: 6, z: 'front' }, { k: 'pad', at: { j: 'ank1', seg: ['kne1', 'ank1'], side: 1, d: 8, along: -6 }, r: 6, z: 'front' }],
      labels: LBL.lcurl,
    };
  }
  const base = { hip: [120, 142], t: -102, th1: 2, w1: [128, 160] };
  return {
    view: 'side', A: { ...base, sn1: 14 }, B: { ...base, sn1: 116 },
    props: [...seat(98, 146, 150), backrest([102, 150], [88, 82]), { k: 'pad', at: [152, 128], r: 7, z: 'near' }, { k: 'pad', at: { j: 'ank1', seg: ['kne1', 'ank1'], side: 1, d: 8, along: -4 }, r: 6.5, z: 'near' }],
    labels: LBL.lcurl,
  };
}

function legExt() {
  const base = { hip: [120, 142], t: -102, th1: 2, w1: [128, 160] };
  return {
    view: 'side', A: { ...base, sn1: 96 }, B: { ...base, sn1: 4 },
    props: [...seat(98, 146, 150), backrest([102, 150], [88, 82]), { k: 'pad', at: { j: 'ank1', seg: ['kne1', 'ank1'], side: -1, d: 8, along: -5 }, r: 6.5, z: 'near' }],
    labels: LBL.lext,
  };
}

function lunge(mode) {
  const bulg = mode === 'bulgarian';
  const k = bulg ? { k1: [160, 200], k2: [66, 160], ft2: 180 } : { k1: [160, 200], k2: [92, 200], ft2: 22 };
  let arms = { ua1: 90, fa1: 90 };
  const props = [];
  if (mode === 'bw') arms = { wr1: [8, 14] };
  if (mode === 'smith') { arms = { wr1: [54, -9] }; props.push({ k: 'line', a: [124, 18], b: [124, 204], w: 4 }, { k: 'plate', j: 'sho', r: 9, z: 'front' }); }
  if (mode === 'walking' || bulg) props.push(...dbs());
  if (bulg) props.push({ k: 'rect', x: 28, y: 166, w: 60, h: 8, c: 'pad', z: 'back' }, { k: 'line', a: [40, 174], b: [40, 204], w: 4 }, { k: 'line', a: [78, 174], b: [78, 204], w: 4 });
  return {
    view: 'side',
    A: { ...k, ...arms, hip: bulg ? [128, 120] : [126, 120], t: -88 },
    B: { ...k, ...arms, hip: bulg ? [116, 152] : [124, 153], t: -84 },
    props, labels: ['Ön dabanla it, qalx', 'En — arxa diz aşağı'],
  };
}

// ---------- Qollar ----------
function curl(mode) {
  if (mode === 'preacher') {
    const base = { hip: [110, 152], t: -68, ua1: 40, k1: [150, 200], k2: [154, 200] };
    return {
      view: 'side', A: { ...base, fa1: 48 }, B: { ...base, fa1: -78 },
      props: [...seat(88, 128, 160), { k: 'line', a: { j: 'sho', seg: ['sho', 'elb1'], side: 1, d: 8, along: 4 }, b: { j: 'elb1', seg: ['sho', 'elb1'], side: 1, d: 8, along: 4 }, w: 9, c: 'pad', z: 'mid' }, { k: 'line', a: [150, 132], b: [156, 204], w: 4 }, { k: 'plate', j: 'wri1', r: 6, z: 'front' }],
      labels: LBL.curl,
    };
  }
  if (mode === 'incline') {
    const base = { hip: [142, 150], t: -122, ua1: 96, k1: [182, 200], k2: [186, 200] };
    return {
      view: 'side', A: { ...base, fa1: 96 }, B: { ...base, fa1: -44 },
      props: [{ k: 'rect', x: 130, y: 158, w: 42, h: 8, c: 'pad' }, { k: 'line', a: [150, 160], b: [106, 90], w: 9, c: 'pad' }, { k: 'line', a: [150, 166], b: [150, 204], w: 4 }, ...dbs()],
      labels: LBL.curl,
    };
  }
  if (mode === 'bayesian') {
    const base = { hip: [127, 115], t: -86, k1: [146, 200], k2: [108, 200], ua1: 118, ua2: 92, fa2: 60 };
    return {
      view: 'side', A: { ...base, fa1: 118 }, B: { ...base, fa1: -52 },
      props: [{ k: 'line', a: [30, 60], b: [30, 204], w: 5 }, { k: 'cable', a: [32, 194], b: 'wri1', z: 'front' }, { k: 'handle', j: 'wri1', z: 'front' }],
      labels: LBL.curl,
    };
  }
  const base = { ...STAND, ua1: 92 };
  const A = { ...base, fa1: 92 }; const B = { ...base, ua1: 86, fa1: -64 };
  let props = dbs();
  if (mode === 'ez') props = [{ k: 'plate', j: 'wri1', r: 6.5, z: 'front' }];
  if (mode === 'cable' || mode === 'rope') {
    props = [{ k: 'line', a: [182, 120], b: [182, 204], w: 5 }, { k: 'cable', a: [180, 196], b: 'wri1', z: 'front' }, mode === 'rope' ? { k: 'band', a: 'wri1', b: { j: 'wri1', dy: 8 }, z: 'front' } : { k: 'handle', j: 'wri1', z: 'front' }];
  }
  return { view: 'side', A, B, props, labels: LBL.curl };
}

function triceps(mode) {
  if (mode === 'overhead' || mode === 'seatedOH') {
    const seated = mode === 'seatedOH';
    const base = seated ? { hip: [126, 152], t: -90, ua1: -82, k1: [170, 200], k2: [174, 200] } : { hip: [124, 115], t: -72, ua1: -74, k1: [142, 200], k2: [106, 200] };
    return {
      view: 'side', A: { ...base, fa1: seated ? 158 : 152 }, B: { ...base, fa1: seated ? 278 : 284 },
      props: seated ? [...seat(104, 148, 160), backrest([112, 156], [110, 80]), { k: 'db', j: 'wri1', z: 'front' }]
        : [{ k: 'line', a: [30, 60], b: [30, 204], w: 5 }, { k: 'cable', a: [32, 134], b: 'wri1', z: 'back' }, { k: 'band', a: 'wri1', b: { j: 'wri1', dx: -3, dy: 7 }, z: 'front' }],
      labels: LBL.ext,
    };
  }
  if (mode === 'skull') {
    const base = { hip: [150, 139], t: 180, k1: [190, 200], k2: [194, 200], ua1: -102 };
    return { view: 'side', A: { ...base, fa1: 136 }, B: { ...base, fa1: 260 }, props: [...flatBench(), { k: 'plate', j: 'wri1', r: 6.5, z: 'front' }], labels: LBL.ext };
  }
  if (mode === 'machine') {
    const base = { hip: [112, 152], t: -84, ua1: 28, k1: [156, 200], k2: [160, 200] };
    return {
      view: 'side', A: { ...base, fa1: -58 }, B: { ...base, fa1: 34 },
      props: [...seat(90, 132, 160), { k: 'line', a: { j: 'sho', seg: ['sho', 'elb1'], side: 1, d: 8, along: 4 }, b: { j: 'elb1', seg: ['sho', 'elb1'], side: 1, d: 8, along: 4 }, w: 9, c: 'pad', z: 'mid' }, { k: 'line', a: [150, 126], b: [150, 204], w: 4 }, { k: 'handle', j: 'wri1', z: 'front' }],
      labels: LBL.ext,
    };
  }
  if (mode === 'close') return { ...lyingPress({ imp: 'smith', close: true }) };
  const base = { hip: [122, 115], t: -80, k1: [118, 200], k2: [126, 200], ua1: 98 };
  return {
    view: 'side', A: { ...base, fa1: -34 }, B: { ...base, fa1: 92 },
    props: [{ k: 'line', a: [184, 6], b: [184, 204], w: 5 }, { k: 'cable', a: [182, 12], b: 'wri1', z: 'front' }, mode === 'rope' ? { k: 'band', a: 'wri1', b: { j: 'wri1', dx: 2, dy: 7 }, z: 'front' } : { k: 'handle', j: 'wri1', z: 'front' }],
    labels: LBL.ext,
  };
}

function dip(mode) {
  if (mode === 'machine') {
    const base = { hip: [120, 150], t: -92, k1: [166, 200], k2: [170, 200] };
    return {
      view: 'side', A: { ...base, w1: [126, 108] }, B: { ...base, w1: [124, 150] },
      props: [...seat(), backrest([105, 154], [102, 80]), { k: 'line', a: [56, 112], b: 'wri1', w: 4, z: 'near' }, { k: 'circ', at: [56, 112], r: 5 }, { k: 'handle', j: 'wri1', z: 'front' }],
      labels: LBL.dip,
    };
  }
  const base = { w1: [140, 110], th1: 96, sn1: 160 };
  return {
    view: 'side', A: { ...base, hip: [126, 107], t: -80 }, B: { ...base, hip: [127, 134], t: -70 },
    props: [{ k: 'line', a: [140, 114], b: [140, 204], w: 5 }, { k: 'circ', at: [140, 112], r: 5, c: 'iron', z: 'front' }, { k: 'line', a: { j: 'kne1', dx: -14, dy: 8 }, b: { j: 'kne1', dx: 14, dy: 8 }, w: 6, c: 'pad', z: 'near' }],
    labels: LBL.dip, noShadow: true,
  };
}

// ---------- Baldır ----------
function calf(mode) {
  const labels = ['Barmaqların ucuna qalx, sıx', 'Dabanı aşağı burax — dartıl'];
  const block = (x) => ({ k: 'rect', x, y: 198, w: 28, h: 6, rx: 2, c: 'pad', z: 'back' });
  if (mode === 'seated') {
    const base = { hip: [118, 142], t: -86, ua1: 60, fa1: 10 };
    return {
      view: 'side', A: { ...base, k1: [163, 197], k2: [166, 197], ft1: -20, ft2: -20 }, B: { ...base, k1: [162, 187], k2: [165, 187], ft1: 40, ft2: 40 },
      props: [...seat(96, 142, 150), backrest([100, 150], [94, 86]), block(158), { k: 'pad', at: { j: 'kne1', dy: -10 }, r: 7, z: 'front' }, { k: 'line', a: { j: 'kne1', dy: -10 }, b: [196, 150], w: 4, z: 'back' }],
      labels,
    };
  }
  if (mode === 'legpress') {
    const base = { hip: [116, 160], t: -136, w1: [122, 162], k1: [178, 104], k2: [181, 101] };
    return {
      view: 'side', A: { ...base, ft1: -160, ft2: -160 }, B: { ...base, ft1: -100, ft2: -100 },
      props: [{ k: 'line', a: [110, 172], b: [64, 128], w: 9, c: 'pad' }, { k: 'rect', x: 98, y: 166, w: 40, h: 8, c: 'pad' }, { k: 'line', a: [118, 174], b: [118, 204], w: 4 },
        { k: 'line', a: [150, 160], b: [232, 78], w: 4 }, { k: 'line', a: { j: 'toe1', dx: 17, dy: 17 }, b: { j: 'toe1', dx: -17, dy: -17 }, w: 6, c: 'pad', z: 'front' }],
      labels: ['Barmaqlarla platformanı it', 'Yavaş geri burax'],
    };
  }
  const smith = mode === 'smith';
  const arms = smith ? { wr1: [54, -9] } : { wr1: [56, 9] };
  const props = [block(130)];
  if (smith) props.push({ k: 'line', a: [124, 14], b: [124, 204], w: 4 }, { k: 'plate', j: 'sho', r: 9, z: 'front' });
  else props.push({ k: 'line', a: [96, 16], b: [96, 204], w: 5 }, { k: 'line', a: [96, 50], b: { j: 'sho', dy: -7 }, w: 5 }, { k: 'pad', at: { j: 'sho', dy: -7 }, r: 6.5, z: 'front' });
  return {
    view: 'side',
    A: { ...arms, hip: [127, 116], t: -88, k1: [128.8, 200.8], k2: [132, 200.8], ft1: -20, ft2: -20 },
    B: { ...arms, hip: [128, 103], t: -88, k1: [131.3, 187], k2: [134.5, 187], ft1: 40, ft2: 40 },
    props, labels,
  };
}

// ---------- Qarın ----------
function crunch(mode) {
  if (mode === 'machine') {
    const base = { hip: [122, 150], k1: [166, 200], k2: [170, 200], wr1: [54, 6] };
    return {
      view: 'side', A: { ...base, t: -94, c: 0 }, B: { ...base, t: -80, c: 42 },
      props: [...seat(), backrest([106, 154], [100, 96]), { k: 'line', a: [96, 46], b: 'wri1', w: 4, z: 'back' }, { k: 'handle', j: 'wri1', z: 'front' }],
      labels: LBL.crunch,
    };
  }
  if (mode === 'decline') {
    const base = { hip: [150, 129], k1: [194, 118], k2: [197, 116], wr1: [40, 9] };
    return {
      view: 'side', A: { ...base, t: 162, c: 0 }, B: { ...base, t: 190, c: 44 },
      props: [{ k: 'rect', x: 48, y: 150, w: 146, h: 8, c: 'pad', z: 'mid', rot: [-18, 120, 154] }, { k: 'line', a: [72, 168], b: [72, 204], w: 4 }, { k: 'line', a: [170, 134], b: [176, 204], w: 4 }, { k: 'pad', at: [200, 110], r: 6.5, z: 'front' }],
      labels: LBL.crunch,
    };
  }
  if (mode === 'cable') {
    const base = { hip: [127, 115], k1: [124, 200], k2: [132, 200], wr1: [56, 5] };
    return {
      view: 'side', A: { ...base, t: -86, c: 0 }, B: { ...base, t: -76, c: 56 },
      props: [{ k: 'line', a: [62, 4], b: [62, 204], w: 5 }, { k: 'cable', a: [64, 10], b: 'wri1', z: 'back' }, { k: 'band', a: 'wri1', b: { j: 'wri1', dy: 7 }, z: 'front' }],
      labels: LBL.crunch,
    };
  }
  if (mode === 'captain') {
    const base = { hip: [124, 104], t: -90, ua1: 92, fa1: 0 };
    return {
      view: 'side', A: { ...base, th1: 92, sn1: 90 }, B: { ...base, th1: -28, sn1: 72 },
      props: [{ k: 'line', a: [110, 122], b: [110, 46], w: 8, c: 'pad' }, { k: 'line', a: [112, 87], b: [156, 87], w: 7, c: 'pad', z: 'mid' }, { k: 'line', a: [106, 46], b: [106, 204], w: 4 }, { k: 'line', a: [156, 90], b: [156, 204], w: 4 }],
      labels: ['Dizləri sinəyə qaldır', 'Nəzarətlə endir'], noShadow: true,
    };
  }
  // meyilli planka (skamyada)
  const base = { t: -38.8, ua1: 90, fa1: 0, k1: [50, 201], k2: [54, 201] };
  return {
    view: 'side', A: { ...base, hip: [116.4, 149.1] }, B: { ...base, hip: [116.4, 150.6] },
    props: [{ k: 'rect', x: 140, y: 152, w: 64, h: 8, c: 'pad' }, { k: 'line', a: [150, 160], b: [150, 204], w: 4 }, { k: 'line', a: [196, 160], b: [196, 204], w: 4 }],
    labels: LBL.hold, tempo: [1.8, 0.3, 1.8, 0.3],
  };
}

function core(mode) {
  if (mode === 'pallof') {
    const base = { hip: [127, 115], t: -89, k1: [118, 200], k2: [140, 200] };
    return {
      view: 'side', A: { ...base, w1: [148, 80] }, B: { ...base, w1: [188, 80] },
      props: [{ k: 'line', a: [36, 30], b: [36, 204], w: 5 }, { k: 'cable', a: [38, 80], b: 'wri1', z: 'back' }, { k: 'handle', j: 'wri1', z: 'front' }],
      labels: ['İrəli it — gövdə dönməsin', 'Sinəyə qaytar'], tempo: [1, 1.2, 1.2, 0.4],
    };
  }
  if (mode === 'woodchop') {
    const legs = { pel: [130, 113], thR: 80, snR: 88 };
    return {
      view: 'front', A: { ...legs, t: -84, sw: 0.86, wR: [196, 30], wL: [190, 34] }, B: { ...legs, t: -97, sw: 0.86, wR: [84, 150], wL: [90, 146] },
      props: [{ k: 'line', a: [238, 6], b: [238, 204], w: 5 }, { k: 'cable', a: [236, 14], b: { mid: ['wriL', 'wriR'] }, z: 'back' }, { k: 'handle', j: 'wriR', z: 'front' }],
      labels: ['Çəpinə aşağı dart', 'Nəzarətlə qaytar'],
    };
  }
  // gövdə fırlatma trenajoru
  return {
    view: 'front', A: { ...SEATED_F, sw: 1, wR: [140, 108], wL: [120, 108] }, B: { ...SEATED_F, sw: 0.6, wR: [126, 108], wL: [110, 108] },
    props: [...frontSeat(), { k: 'pad', at: { mid: ['wriL', 'wriR'] }, r: 6, z: 'front' }],
    labels: LBL.rot,
  };
}

// ---------- İsinmə ----------
function warm(mode) {
  if (mode === 'facepull') {
    const base = { hip: [124, 115], t: -88, k1: [118, 200], k2: [130, 200], ab: -1 };
    return {
      view: 'side', A: { ...base, w1: [184, 56] }, B: { ...base, w1: [150, 44] },
      props: [{ k: 'line', a: [206, 20], b: [206, 204], w: 5 }, { k: 'cable', a: [204, 54], b: 'wri1', z: 'front' }, { k: 'band', a: 'wri1', b: { j: 'wri1', dy: 7 }, z: 'front' }],
      labels: ['Üzə doğru dart, dirsəklər yuxarı', 'Burax'],
    };
  }
  if (mode === 'pullapart') {
    return {
      view: 'front', A: { ...STAND_F, uaR: 0, sR: -0.3, faR: 0, fR: -0.3 }, B: { ...STAND_F, uaR: -2, sR: 1, faR: -2, fR: 1 },
      props: [{ k: 'band', a: 'wriL', b: 'wriR', z: 'front' }], labels: ['Lenti yanlara dart', 'Yavaş qaytar'],
    };
  }
  if (mode === 'dislocate') {
    return {
      view: 'side', A: { ...STAND, ua1: 64, fa1: 64 }, B: { ...STAND, ua1: -210, fa1: -210 },
      props: [{ k: 'circ', at: 'wri1', r: 3.5, c: 'bandc', z: 'front' }], labels: ['Başın üstündən arxaya', 'Önə qaytar'], tempo: [1.6, 0.2, 1.6, 0.2],
    };
  }
  if (mode === 'revpec') {
    return {
      view: 'back', A: { ...SEATED_F, uaR: 0, sR: -0.3, faR: 0, fR: -0.3 }, B: { ...SEATED_F, uaR: 0, sR: 1, faR: 4, fR: 1 },
      props: [{ k: 'rect', x: 104, y: 148, w: 52, h: 9, c: 'pad', z: 'back' }, { k: 'line', a: [130, 157], b: [130, 204], w: 4 }, { k: 'pad', at: 'wriR', r: 5, z: 'front' }, { k: 'pad', at: 'wriL', r: 5, z: 'front' }],
      labels: ['Qolları geri aç', 'Nəzarətlə qaytar'],
    };
  }
  if (mode === 'legswing') {
    const base = { hip: [127, 115], t: -88, k2: [129, 200], w1: [176, 72] };
    return {
      view: 'side', A: { ...base, th1: 48, sn1: 54 }, B: { ...base, th1: 126, sn1: 122 },
      props: [{ k: 'line', a: [180, 40], b: [180, 204], w: 5 }], labels: LBL.swing, tempo: [0.7, 0.05, 0.7, 0.05],
    };
  }
  return null;
}

// ---------- Kardio ----------
function cardio(mode) {
  if (mode === 'walk') {
    return {
      view: 'side', period: 1.15, labels: LBL.cardio,
      cycle: (phi) => {
        const s = Math.sin(phi * TAU);
        const f1 = 4 + 30 * Math.max(0, Math.sin(phi * TAU + 2.2)); const f2 = 4 + 30 * Math.max(0, Math.sin(phi * TAU + Math.PI + 2.2));
        return { hip: [127, 116 + 1.5 * Math.abs(Math.cos(phi * TAU))], t: -86, th1: 90 - 22 * s, sn1: 90 - 22 * s + f1, th2: 90 + 22 * s, sn2: 90 + 22 * s + f2, ua1: 90 + 20 * s, fa1: 70 + 20 * s, ua2: 90 - 20 * s, fa2: 70 - 20 * s };
      },
      props: [{ k: 'rect', x: 44, y: 201, w: 164, h: 6, c: 'pad', rot: [-4, 126, 204] }, { k: 'line', a: [200, 196], b: [212, 92], w: 5 }, { k: 'line', a: [212, 92], b: [184, 96], w: 4 }],
      noShadow: true,
    };
  }
  if (mode === 'bike') {
    const C = [148, 176];
    return {
      view: 'side', period: 1, labels: LBL.cardio,
      cycle: (phi) => {
        const a = phi * 360;
        const p1 = [C[0] + 15 * Math.cos(a * Math.PI / 180), C[1] + 15 * Math.sin(a * Math.PI / 180) - 3];
        const p2 = [C[0] + 15 * Math.cos((a + 180) * Math.PI / 180), C[1] + 15 * Math.sin((a + 180) * Math.PI / 180) - 3];
        return { hip: [110, 112], t: -62, w1: [172, 98], k1: p1, k2: p2 };
      },
      props: [{ k: 'line', a: [104, 118], b: [118, 118], w: 6, c: 'pad' }, { k: 'line', a: [111, 122], b: C, w: 4 }, { k: 'line', a: C, b: [174, 100], w: 4 }, { k: 'line', a: [166, 98], b: [180, 98], w: 4 }, { k: 'line', a: [100, 204], b: [190, 204], w: 6 }, { k: 'line', a: C, b: [148, 204], w: 4 }, { k: 'line', a: C, b: 'ank1', w: 3, z: 'near' }],
    };
  }
  if (mode === 'elliptical') {
    return {
      view: 'side', period: 1.4, labels: LBL.cardio,
      cycle: (phi) => {
        const a = phi * TAU;
        return { hip: [127, 104], t: -84, k1: [130 + 20 * Math.cos(a), 188 + 7 * Math.sin(a)], k2: [130 + 20 * Math.cos(a + Math.PI), 188 + 7 * Math.sin(a + Math.PI)], w1: [168 + 10 * Math.cos(a + Math.PI), 80], w2: [168 + 10 * Math.cos(a), 80] };
      },
      props: [{ k: 'line', a: [182, 192], b: 'wri1', w: 4, z: 'near' }, { k: 'line', a: [182, 192], b: 'wri2', w: 4, z: 'far' }, { k: 'line', a: [80, 204], b: [196, 204], w: 6 }],
    };
  }
  // avarçəkmə
  const ank = { k1: [190, 176], k2: [193, 176] };
  return {
    view: 'side', labels: LBL.cardio, times: [0.45, 0.4, 1.0],
    keys: [
      { ...ank, hip: [138, 172], t: -58, w1: [198, 152] },
      { ...ank, hip: [102, 172], t: -66, w1: [172, 148] },
      { ...ank, hip: [102, 172], t: -106, w1: [128, 136] },
    ],
    props: [{ k: 'line', a: [56, 188], b: [214, 188], w: 5 }, { k: 'circ', at: [216, 170], r: 12 }, { k: 'line', a: [198, 160], b: [202, 190], w: 5, c: 'pad' }, { k: 'line', a: { j: 'hip', dx: -13, dy: 10 }, b: { j: 'hip', dx: 13, dy: 10 }, w: 6, c: 'pad', z: 'mid' }, { k: 'cable', a: [214, 160], b: 'wri1', z: 'front' }, { k: 'line', a: [60, 188], b: [60, 204], w: 4 }, { k: 'line', a: [210, 188], b: [210, 204], w: 4 }],
    noShadow: true,
  };
}

export const ANIMS = {
  treadmill_incline: cardio('walk'), stationary_bike: cardio('bike'), elliptical: cardio('elliptical'), rower: cardio('rower'),
  face_pull: warm('facepull'), band_pull_apart: warm('pullapart'), band_dislocate: warm('dislocate'), reverse_pec_deck: warm('revpec'),
  box_squat_bench: squat('box'), leg_swings: warm('legswing'), bw_lunge: lunge('bw'), hip_hinge_dowel: hinge('dowel'),

  db_bench: lyingPress({ imp: 'db' }), machine_chest_press: seatedPress(), smith_bench: lyingPress({ imp: 'smith' }), bb_bench: lyingPress({ imp: 'bb' }),
  pec_deck: fly('pecdeck'), cable_crossover: fly('crossover'), low_high_cable_fly: fly('lowhigh'), incline_db_fly: fly('inclinefly'),
  incline_db_press: lyingPress({ incline: true, imp: 'db' }), incline_machine_press: seatedPress({ incline: true }),
  incline_smith_press: lyingPress({ incline: true, imp: 'smith' }), incline_bb_press: lyingPress({ incline: true, imp: 'bb' }),

  leg_press: legPress(), hack_squat: squat('hack'), goblet_squat: squat('goblet'), smith_squat: squat('smith'),
  db_rdl: hinge('db'), bb_rdl: hinge('bb'), smith_rdl: hinge('smith'), back_extension_45: hinge('ext45'),
  seated_leg_curl: legCurl('seated'), lying_leg_curl: legCurl('lying'), standing_leg_curl: legCurl('standing'), leg_extension: legExt(),
  bulgarian_split_squat: lunge('bulgarian'), db_walking_lunge: lunge('walking'), smith_split_squat: lunge('smith'),

  seated_cable_row: row('cable'), chest_supported_row: row('machine'), db_row_bench: row('db'), tbar_row: row('tbar'),
  lat_pulldown: pulldown('bar'), assisted_pullup: pulldown('assist'), machine_pulldown: pulldown('machine'), single_arm_pulldown: pulldown('single'),

  db_shoulder_press: shoulderPress('db'), machine_shoulder_press: shoulderPress('machine'), smith_shoulder_press: shoulderPress('smith'), landmine_press: landmine(),
  cable_lateral: lateral('cable'), db_lateral: lateral('db'), machine_lateral: lateral('machine'), cable_y_raise: lateral('y'),

  ez_curl: curl('ez'), db_curl: curl('db'), cable_curl: curl('cable'), preacher_curl: curl('preacher'),
  incline_db_curl: curl('incline'), bayesian_curl: curl('bayesian'), hammer_curl: curl('db'), rope_hammer_curl: curl('rope'),

  rope_pushdown: triceps('rope'), bar_pushdown: triceps('bar'), machine_triceps_ext: triceps('machine'), overhead_cable_ext: triceps('overhead'),
  seated_db_overhead_ext: triceps('seatedOH'), ez_skullcrusher: triceps('skull'), assisted_dip: dip('assisted'), machine_dip: dip('machine'),
  close_grip_bench: triceps('close'),

  ab_crunch_machine: crunch('machine'), captains_chair: crunch('captain'), decline_crunch: crunch('decline'), standing_cable_crunch: crunch('cable'),
  standing_calf_raise: calf('standing'), seated_calf_raise: calf('seated'), leg_press_calf: calf('legpress'), smith_calf_raise: calf('smith'),
  pallof_press: core('pallof'), cable_woodchop: core('woodchop'), rotary_torso: core('rotary'), incline_plank_bench: crunch('plank'),

  // Foto ilə gələn yeni hərəkətlər — əzələ işığı üçün oxşar sxem
  arm_circles: lateral('db'), band_fly: warm('pullapart'), bb_row: row('tbar'), seated_bb_press: shoulderPress('smith'), arnold_press: shoulderPress('db'),
  incline_cable_oh_ext: triceps('overhead'), standing_bb_oh_ext: triceps('overhead'), seated_cable_crunch: crunch('cable'), flat_bench_leg_raise: crunch('captain'),
  bb_calf_raise: calf('smith'), vbar_pulldown: pulldown('bar'), underhand_pulldown: pulldown('bar'), step_ups_db: lunge('walking'), rear_lunge_db: lunge('walking'),
  db_upright_row: lateral('db'), oh_cable_curl: curl('cable'), db_side_bend: core('woodchop'), decline_oblique_crunch: crunch('decline'), smith_close_grip: triceps('close'),
  rear_delt_raise_bench: warm('revpec'), lying_rear_raise: warm('revpec'), seated_rear_cable_raise: warm('revpec'),
};
