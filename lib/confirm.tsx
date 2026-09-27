'use client';

/** Native modal dialog supplies focus trapping and Escape support without blocking JS. */
export function askConfirmation(message: string): Promise<boolean> {
  return new Promise(resolve => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.createElement('dialog');
    dialog.className = 'confirmation-dialog';
    dialog.dir = 'rtl';
    const heading = document.createElement('h2');
    heading.id = `confirmation-${crypto.randomUUID()}`;
    heading.textContent = 'تأكيد الإجراء';
    dialog.setAttribute('aria-labelledby', heading.id);
    const text = document.createElement('p');
    text.textContent = message;
    const actions = document.createElement('div');
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'إلغاء';
    const accept = document.createElement('button');
    accept.type = 'button';
    accept.textContent = 'تأكيد';
    accept.className = 'confirmation-accept';
    let settled = false;
    const finish = (confirmed: boolean) => {
      if (settled) return;
      settled = true;
      dialog.close();
      dialog.remove();
      previous?.focus();
      resolve(confirmed);
    };
    cancel.onclick = () => finish(false);
    accept.onclick = () => finish(true);
    dialog.oncancel = event => { event.preventDefault(); finish(false); };
    actions.append(cancel, accept);
    dialog.append(heading, text, actions);
    document.body.append(dialog);
    dialog.showModal();
    cancel.focus();
  });
}
