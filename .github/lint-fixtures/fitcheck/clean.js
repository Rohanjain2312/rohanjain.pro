export function score(words) {
  return words.filter((w) => w.length > 2).length;
}
