// Turnpike 55 hands itself in (Node 22, standard library only).
// The guide is the static app in app/ (index.html, ES modules in js/, css/atlas.css, data/trophies.json) and its four
// screenshots in screenshots/. This program copies both folders to /output and writes /output/dossier.json, the summary
// the judge reads, with the kit's vendored make.fun library (vendor/makefun-frontend.ts, left byte for byte as shipped).
//
// Try the guide:      node serve.ts      then open http://localhost:8080
// Build the hand-in:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(root, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's caps: text_max_bytes shapes the dossier text; the rest refuse what the scorer would refuse
// (more than 4 screenshots or one over 256 KiB, more than 993 entries or 48 MiB in app/).
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
