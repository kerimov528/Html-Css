// Build: Tailwind CSS + esbuild → tək fayllı HTML.
//   node build.mjs                      → index.html (tam sənəd, GitHub Pages üçün)
//   ARTIFACT_OUT=path node build.mjs    → əlavə olaraq Claude Artifact fraqmenti
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
execFileSync('node', ['node_modules/tailwindcss/lib/cli.js', '-c', 'tailwind.config.js', '-i', 'src/styles.css', '-o', 'dist/app.css', '--minify'], { stdio: 'inherit' });

await build({
  entryPoints: ['src/app.jsx'],
  bundle: true,
  format: 'iife',
  minify: true,
  target: ['es2019'],
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  outfile: 'dist/app.js',
  legalComments: 'none',
});

const css = readFileSync('dist/app.css', 'utf8').replace(/<\/style/gi, '<\\/style');
const js = readFileSync('dist/app.js', 'utf8').replace(/<\/script/gi, '<\\/script');

const FONTS = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Unbounded:wght@500;600;700&display=swap';
const REACT = 'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js';
const REACT_DOM = 'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js';

const head = `<title>Prime İli Fitness Paneli</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="1 illik fitness transformasiya planı: məşq, halal qidalanma, əlavələr və həftəlik inkişaf izləmə.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>${css}</style>`;

const body = `<div id="root" lang="az"><p style="padding:24px 16px;font-family:system-ui,sans-serif">Panel yüklənir…</p></div>
<script src="${REACT}"></script>
<script src="${REACT_DOM}"></script>
<script>${js}</script>`;

const full = `<!doctype html>
<html lang="az">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
${head}
</head>
<body>
${body}
</body>
</html>
`;
writeFileSync('index.html', full);
if (process.env.ARTIFACT_OUT) writeFileSync(process.env.ARTIFACT_OUT, `${head}\n${body}\n`);
console.log(`index.html ${(full.length / 1024).toFixed(0)} KB`);
