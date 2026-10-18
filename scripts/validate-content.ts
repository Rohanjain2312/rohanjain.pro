// Usage: node scripts/validate-content.ts [--dir <content dir>] [--strict]
// Exits 1 and names the file and field of each problem. Missing files are skipped unless --strict.
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ContentParseError, loadRawContent } from '../src/lib/content/load.ts';
import { validateContent, type Problem } from '../src/lib/content/validate.ts';

const args = process.argv.slice(2);
const di = args.indexOf('--dir');
const dir = resolve(di >= 0 && args[di + 1] ? args[di + 1]! : 'src/content');
const strict = args.includes('--strict');

const problems: Problem[] = [];
try {
  if (strict) {
    for (const k of [
      'claims',
      'projects',
      'skills',
      'roles',
      'figures',
      'resume',
      'site',
      'evidence',
    ]) {
      if (!existsSync(join(dir, `${k}.json`)))
        problems.push({ file: `${k}.json`, field: '(file)', message: 'file is missing' });
    }
  }
  problems.push(...validateContent(loadRawContent(dir)));
} catch (e) {
  if (!(e instanceof ContentParseError)) throw e;
  problems.push({ file: e.file, field: '(file)', message: e.message });
}

for (const p of problems) console.error(`${p.file}: ${p.field}: ${p.message}`);
if (problems.length) {
  console.error(`validate-content: ${problems.length} problem(s).`);
  process.exit(1);
}
console.log('validate-content: OK');
