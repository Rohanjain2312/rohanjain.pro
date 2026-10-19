// Figures timeline (design spec 7.8). Without this script the timeline entries are plain anchor links
// that jump to the first matching tile. With it they become toggle buttons that highlight a project's tiles.

const panel = document.querySelector<HTMLElement>('[data-figures]');

if (panel) {
  const tiles = Array.from(panel.querySelectorAll<HTMLElement>('.tile'));
  const entries = Array.from(panel.querySelectorAll<HTMLAnchorElement>('a.timeline__entry'));
  const buttons: HTMLButtonElement[] = [];
  let selected: string | null = null;

  const select = (project: string | null): void => {
    selected = project;
    for (const b of buttons)
      b.setAttribute('aria-pressed', String(b.dataset['project'] === project));
    for (const t of tiles) {
      if (t.dataset['project'] === project) t.setAttribute('data-selected', 'true');
      else t.removeAttribute('data-selected');
    }
    if (project) {
      const first = tiles.find((t) => t.dataset['project'] === project);
      // Default (instant) scrolling: the only motion on the site is the fold marker (design spec 10).
      first?.scrollIntoView({ block: 'nearest' });
    }
  };

  for (const a of entries) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = a.className;
    b.textContent = a.textContent;
    b.dataset['project'] = a.dataset['project'] ?? '';
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => {
      // Focus stays on the toggle on purpose (audit A-5): it is an on/off control (aria-pressed), so Enter again undoes it.
      select(selected === b.dataset['project'] ? null : (b.dataset['project'] ?? null));
    });
    a.replaceWith(b);
    buttons.push(b);
  }
}
