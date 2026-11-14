import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
execFileSync('node', ['node_modules/tailwindcss/lib/cli.js', '-c', 'tailwind.config.js', '-i', 'src/styles.css', '-o', 'dist/sheet.css', '--minify'], { stdio: 'ignore' });
await build({ entryPoints: ['dev/sheet.jsx'], bundle: true, format: 'iife', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment', outfile: 'dist/sheet.js' });
writeFileSync('dist/sheet.html', `<!doctype html><html><head><meta charset="utf-8"><style>${readFileSync('dist/sheet.css', 'utf8')}</style></head><body><div id="root"></div><script src="react.js"></script><script src="react-dom.js"></script><script>${readFileSync('dist/sheet.js', 'utf8')}</script></body></html>`);
