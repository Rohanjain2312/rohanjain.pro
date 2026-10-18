// Pure helpers for .github/scripts/lighthouse.mjs, kept apart so they can be tested (R-607).

/**
 * A run is valid when Lighthouse reported no runtime error and every score and metric is a finite number.
 * A failed run scores 0 with null metrics, so it must never reach the median.
 * @param {{ runtimeError?: unknown } | undefined} lhr
 * @param {Record<string, number>} row score and metric values by key
 * @returns {boolean}
 */
export function isValidRun(lhr, row) {
  if (!lhr || lhr.runtimeError) return false;
  const values = Object.values(row);
  return values.length > 0 && values.every((v) => typeof v === 'number' && Number.isFinite(v));
}

/**
 * Median of the finite numbers only. NaN, null and non-numbers are ignored, so input order cannot matter.
 * Returns NaN when no number is usable. For an even count, the mean of the two middle values.
 * @param {unknown[]} values
 * @returns {number}
 */
export function median(values) {
  const nums = values
    .filter((v) => typeof v === 'number' && Number.isFinite(v))
    .sort((a, b) => a - b);
  if (nums.length === 0) return Number.NaN;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

/**
 * Valid runs needed before a page can be judged: 2 when 3 or more runs were asked for, else 1.
 * @param {number} runs
 * @returns {number}
 */
export function minValidRuns(runs) {
  return runs >= 3 ? 2 : 1;
}
