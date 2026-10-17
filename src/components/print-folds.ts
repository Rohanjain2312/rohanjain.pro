// Opens every closed fold before printing and closes the same ones afterwards.
let reopened: HTMLDetailsElement[] = [];

window.addEventListener('beforeprint', () => {
  reopened = Array.from(document.querySelectorAll<HTMLDetailsElement>('details:not([open])'));
  for (const d of reopened) d.open = true;
});

window.addEventListener('afterprint', () => {
  for (const d of reopened) d.open = false;
  reopened = [];
});
