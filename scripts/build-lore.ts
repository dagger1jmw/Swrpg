// Builds src/lore/generated/lore-index.json from Docs/SWRPG lore/*.md (read-only; architecture §5).
// Runs before dev, build, test and typecheck (package.json pre-scripts) with Node's type stripping.
// Writes only when the content changed, so the dev server does not reload for nothing.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildLoreIndex, fileKey } from '../src/lore/parse.ts';

const SOURCE = join('Docs', 'SWRPG lore');
const OUT_DIR = join('src', 'lore', 'generated');
const OUT = join(OUT_DIR, 'lore-index.json');

const files = readdirSync(SOURCE)
  .filter((n) => n.endsWith('.md') && fileKey(n) !== null)
  .sort()
  .map((name) => ({ name, content: readFileSync(join(SOURCE, name), 'utf8') }));

const json = JSON.stringify(buildLoreIndex(files));
mkdirSync(OUT_DIR, { recursive: true });
if (!existsSync(OUT) || readFileSync(OUT, 'utf8') !== json) {
  writeFileSync(OUT, json);
  console.log(`lore index: ${files.length} files -> ${OUT} (${Math.round(json.length / 1024)} KB)`);
}
