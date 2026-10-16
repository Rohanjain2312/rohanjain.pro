export function f(el, s) {
  el.textContent = s;
  return localStorage.getItem('theme');
}
