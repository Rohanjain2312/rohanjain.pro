// Résumé dialog (design spec 7.13, F-04). Tabs follow the ARIA tabs pattern: arrows move and select, Home and
// End jump, only the selected tab is in the tab order. All text goes in as text nodes (R-405). Without this
// script the "View résumé" controls stay plain links to the PDF.

const dialog = document.querySelector<HTMLDialogElement>('[data-resume-dialog]');

if (dialog && typeof dialog.showModal === 'function') {
  const tabs = [...dialog.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panel = dialog.querySelector<HTMLElement>('[role="tabpanel"]');
  const summary = dialog.querySelector<HTMLElement>('[data-resume-summary]');
  const pdfs = [...dialog.querySelectorAll<HTMLAnchorElement>('[data-resume-pdf]')];
  const close = dialog.querySelector<HTMLButtonElement>('[data-resume-close]');
  const fallbackId = 'ml';
  let opener: HTMLElement | null = null;

  const select = (tab: HTMLButtonElement, focus: boolean): void => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    }
    panel?.setAttribute('aria-labelledby', tab.id);
    if (summary) summary.textContent = tab.dataset['summary'] ?? '';
    for (const a of pdfs) a.hidden = a.dataset['resumePdf'] !== tab.dataset['role'];
    if (focus) tab.focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (e) => {
      let next: number;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      else return;
      e.preventDefault();
      const target = tabs[next];
      if (target) select(target, true);
    });
  });

  // The role family of the last fit-check result (fit-check.ts), otherwise ML Engineer.
  const familyTab = (): HTMLButtonElement | undefined => {
    const wanted = document.body.dataset['fitFamily'] ?? fallbackId;
    return (
      tabs.find((t) => t.dataset['role'] === wanted) ??
      tabs.find((t) => t.dataset['role'] === fallbackId)
    );
  };

  // With JavaScript each opener is a button; without it, it stays a link to the PDF.
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-resume-open]')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = link.className;
    button.textContent = link.textContent;
    button.dataset['resumeOpen'] = '';
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', () => {
      opener = button;
      const tab = familyTab();
      if (tab) select(tab, false);
      dialog.showModal();
      // The first focusable element would be the first tab; focus the selected one instead.
      tab?.focus();
    });
    link.replaceWith(button);
  }

  close?.addEventListener('click', () => dialog.close());
  // Escape and Close both end here. The browser restores focus too; this makes it certain.
  dialog.addEventListener('close', () => opener?.focus());
  // A click on the backdrop (the dialog element itself, outside the column) closes it.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}
