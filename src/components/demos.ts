// Click-to-load demo embeds (F-09, R-512, design spec 7.6). Nothing loads before the click on "Load live
// demo": the dialog holds no iframe until then. Without this script the trigger is a plain link to the Space.

const dialog = document.querySelector<HTMLDialogElement>('[data-demo-dialog]');

if (dialog && typeof dialog.showModal === 'function') {
  const q = <T extends HTMLElement>(sel: string): T => {
    const el = dialog.querySelector<T>(sel);
    if (!el) throw new Error(`demo dialog is missing ${sel}`);
    return el;
  };
  const title = q<HTMLElement>('[data-demo-title]');
  const address = q<HTMLElement>('[data-demo-address]');
  const what = q<HTMLElement>('[data-demo-what]');
  const stage = q<HTMLElement>('[data-demo-stage]');
  const direct = q<HTMLAnchorElement>('[data-demo-direct]');
  const load = q<HTMLButtonElement>('[data-demo-load]');
  const close = q<HTMLButtonElement>('[data-demo-close]');
  let embed = '';
  let frame: HTMLIFrameElement | null = null;
  // Safari does not focus a link on click, so the browser has nothing to restore focus to. Track the opener.
  let opener: HTMLElement | null = null;

  const reset = (): void => {
    frame?.remove();
    frame = null;
    what.hidden = false;
    load.hidden = false;
  };

  const SPACES = 'https://huggingface.co/spaces/';

  const isEmbedHost = (url: string): boolean => {
    try {
      const u = new URL(url);
      return u.protocol === 'https:' && u.hostname.endsWith('.hf.space');
    } catch {
      return false;
    }
  };

  for (const a of document.querySelectorAll<HTMLAnchorElement>('a[data-demo-embed]')) {
    a.setAttribute('aria-haspopup', 'dialog');
    a.addEventListener('click', (e) => {
      // Let modified clicks open the Space itself, as a link would.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const target = a.dataset['demoEmbed'] ?? '';
      if (!isEmbedHost(target)) return;
      e.preventDefault();
      embed = target;
      title.textContent = a.dataset['demoName'] ?? '';
      what.textContent = a.dataset['demoWhat'] ?? '';
      // Break opportunities after each slash only (no mid-word breaks).
      const parts = (a.dataset['demoUrl'] ?? '').replace(/^https:\/\//, '').split('/');
      address.replaceChildren(
        ...parts.flatMap((part, i) =>
          i < parts.length - 1
            ? [document.createTextNode(`${part}/`), document.createElement('wbr')]
            : [document.createTextNode(part)],
        ),
      );
      // The direct link goes only to a Hugging Face Space; anything else keeps the link's own href.
      const spaceUrl = a.dataset['demoUrl'] ?? '';
      direct.href = spaceUrl.startsWith(SPACES) ? spaceUrl : a.href;
      reset();
      opener = a;
      dialog.showModal();
    });
  }

  load.addEventListener('click', () => {
    if (!isEmbedHost(embed)) return;
    frame = document.createElement('iframe');
    frame.title = `${dialog.dataset['frameTitle'] ?? ''} ${title.textContent ?? ''}`.trim();
    frame.className = 'demo__frame';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    frame.src = embed;
    what.hidden = true;
    load.hidden = true;
    stage.append(frame);
    // The button that had focus is now hidden. Focus the stage, not the iframe: keys pressed inside an
    // iframe never reach the dialog, so Escape would stop closing it (audit A-1).
    stage.focus();
  });

  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    reset();
    opener?.focus();
  });
  // A click on the backdrop (the dialog element itself, outside the column) closes it.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}
