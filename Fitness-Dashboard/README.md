# Prime İli — Fitness Paneli

1 illik fitness transformasiya və izləmə paneli (React 18 + Tailwind CSS).

- **Bu gün**: həftənin istənilən günü üçün saat-saat plan — yeməklər (qramla) və məşq günü hər hərəkətin real insan təsviri, set × təkrar, icra qaydası və işləyən əzələlər.
- **Plan**: profil, gündəlik kalori/protein hədəfləri, həftəlik qrafik (indiki və 1 yanvardan), 52 həftəlik yol xəritəsi.
- **Məşq**: A/B/C günləri, isinmə, hər hərəkət üçün 3 alternativ, 80 hərəkətin hamısı üçün animasiya (işləyən əzələlər qırmızı parıldayır), detallı anatomik xəritə və «Əzələyə görə» axtarış.
- **Qidalanma**: halal ev yeməkləri, öyün variantları, olar/məhdud/olmaz siyahısı, kalori hesablayıcı.
- **Əlavələr**: kreatin, whey, D3, omega-3 və s. — doza və vaxt.
- **İnkişaf**: həftəlik çəki/bel ölçmələri, qrafiklər, həftəlik icra cədvəli, şəkil/video müqayisəsi.

`index.html` hazır build-dir — birbaşa brauzerdə açmaq olar (məlumatlar localStorage və IndexedDB-də saxlanır).

## Build

```bash
npm install
npm run build
```

Mənbə kodu `src/` qovluğundadır.

## Lisenziyalar

Hərəkət fotoşəkilləri (`img/ex/*.webp`) [free-exercise-db](https://github.com/yuhonas/free-exercise-db) layihəsindəndir; müəllif onları ictimai mülkiyyət (Unlicense) kimi paylayır. Ölçü kiçildilib və WebP-yə çevrilib.

Anatomik xəritənin path datası (`src/data/bodymap.js`) [react-native-body-highlighter](https://www.npmjs.com/package/react-native-body-highlighter) paketindən götürülüb — MIT License, Copyright (c) 2022 ELABBASSI Hicham. Animasiyalar (`src/rig.jsx`, `src/data/anims.js`) bu layihə üçün yazılıb.

`npm run sheet` bütün animasiyaların başlanğıc/son pozalarını `dist/sheet.html`-də göstərir (yoxlama üçün).
