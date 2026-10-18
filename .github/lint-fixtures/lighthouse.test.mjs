// Self-test for the Lighthouse run validity and median helpers (R-607).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidRun, median, minValidRuns } from '../scripts/lighthouse-lib.mjs';

test('median ignores NaN and null whatever the order', () => {
  assert.equal(median([Number.NaN, 1700, 1900]), 1800);
  assert.equal(median([1700, Number.NaN, 1900]), 1800);
  assert.equal(median([1900, 1700, null, Number.NaN, 1800]), 1800);
});

test('median of odd and even counts, and of nothing', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1]), 2.5);
  assert.ok(Number.isNaN(median([])));
  assert.ok(Number.isNaN(median([Number.NaN, null])));
});

test('a run with a runtime error, a NaN or a missing metric is invalid', () => {
  const ok = { performance: 100, 'largest-contentful-paint': 1500 };
  assert.equal(isValidRun({}, ok), true);
  assert.equal(isValidRun({ runtimeError: { code: 'NO_FCP' } }, ok), false);
  assert.equal(isValidRun({}, { ...ok, 'largest-contentful-paint': Number.NaN }), false);
  assert.equal(isValidRun({}, { ...ok, 'total-blocking-time': undefined }), false);
  assert.equal(isValidRun(undefined, ok), false);
  assert.equal(isValidRun({}, {}), false);
});

test('how many valid runs a page needs', () => {
  assert.equal(minValidRuns(1), 1);
  assert.equal(minValidRuns(3), 2);
  assert.equal(minValidRuns(5), 2);
});
