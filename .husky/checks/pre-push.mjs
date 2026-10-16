#!/usr/bin/env node
// Blocks pushing to main (R-101). Git passes "<local ref> <local sha> <remote ref> <remote sha>" lines on stdin.
import { readFileSync } from 'node:fs';

const hit = readFileSync(0, 'utf8')
  .split('\n')
  .map((l) => l.trim().split(/\s+/))
  .filter((f) => f.length >= 3 && /^refs\/heads\/(main|master)$/.test(f[2]))
  .map((f) => f[2]);

if (hit.length) {
  console.error(`R-101: never push to ${hit.join(', ')}. Push a branch and open a pull request.`);
  process.exit(1);
}
