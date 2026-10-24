import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

// Run the actual standalone script with a small DOM boundary fixture. Browser
// validation is still required for native tab order, layout and accessibility.
function workspace() {
  const handlers = new Map();
  const elements = new Map();
  const document = {
    activeElement: null,
    body: { classList: { toggle() {} } },
    addEventListener(type, handler) {
      handlers.set(type, [...(handlers.get(type) || []), handler]);
    },
    querySelector(selector) { return elements.get(selector) || null; },
    querySelectorAll() { return []; },
  };
  function element(extra = {}) {
    return Object.defineProperties({
      isConnected: true, disabled: false, tabIndex: 0, dataset: {},
      classList: { remove() {}, contains() { return false; } },
      addEventListener(type, handler) { this[type] = handler; },
      focus() { document.activeElement = this; },
      getClientRects() { return [{}]; },
      closest() { return null; },
    }, Object.getOwnPropertyDescriptors(extra));
  }
  for (const id of ['sidebar', 'sidebarScrim', 'breadcrumbCurrent',
    'sidebarApprovalCount', 'notificationDot', 'mainContent', 'searchTrigger',
    'notificationBtn', 'openNav', 'closeNav', 'commandInput', 'commandResults']) {
    elements.set('#' + id, element());
  }
  const shell = element({ inert: false });
  elements.set('.app-shell', shell);
  const controls = [element(), element(), element()];
  const dialog = element({
    querySelectorAll() { return controls; },
    contains(target) { return controls.includes(target); },
  });
  for (const id of ['modalRoot', 'commandRoot']) {
    let markup = '';
    elements.set('#' + id, element({
      get innerHTML() { return markup; },
      set innerHTML(value) {
        markup = value;
        if (id === 'modalRoot') elements.set('#modalRoot input', value ? controls[1] : null);
        if (id === 'commandRoot') elements.set('#commandInput', value ? controls[0] : null);
      },
      querySelector() { return markup ? dialog : null; },
    }));
  }
  const html = readFileSync(new URL('../MAKMA_LifeOS_Preview.html', import.meta.url), 'utf8');
  const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)][0][1];
  runInNewContext(script, {
    document, localStorage: { getItem() { return null; } }, structuredClone,
    location: { hash: '' }, window: { addEventListener() {}, scrollTo() {} },
    Intl, Date, URL, console,
  });
  const opener = element({ dataset: { action: 'new-task' } });
  opener.closest = selector => selector === '[data-action]' ? opener : null;
  function dispatch(type, event) {
    event.preventDefault = () => { event.prevented = true; };
    for (const handler of handlers.get(type) || []) handler(event);
  }
  function open() {
    opener.focus();
    dispatch('click', { target: opener });
  }
  return { document, elements, shell, controls, opener, dispatch, open };
}

test('opening a record dialog makes background controls inert', () => {
  const page = workspace();
  page.open();
  assert.equal(page.shell.inert, true);
  assert.equal(page.document.activeElement, page.controls[1]);
});

test('Tab and Shift+Tab wrap at the dialog boundaries', () => {
  const page = workspace();
  page.open();
  page.controls[0].focus();
  page.dispatch('keydown', { key: 'Tab', shiftKey: true });
  assert.equal(page.document.activeElement, page.controls.at(-1));
  page.dispatch('keydown', { key: 'Tab', shiftKey: false });
  assert.equal(page.document.activeElement, page.controls[0]);
});

test('Escape restores the invoking control and background interaction', () => {
  const page = workspace();
  page.open();
  page.dispatch('keydown', { key: 'Escape' });
  assert.equal(page.shell.inert, false);
  assert.equal(page.document.activeElement, page.opener);
});

test('closing after a render uses the main region if the opener was removed', () => {
  const page = workspace();
  page.open();
  page.opener.isConnected = false;
  page.dispatch('keydown', { key: 'Escape' });
  assert.equal(page.document.activeElement, page.elements.get('#mainContent'));
});

test('command palette contains focus and returns it to the search trigger', () => {
  const page = workspace();
  const search = page.elements.get('#searchTrigger');
  search.focus();
  search.click();
  page.dispatch('keydown', { key: 'Tab', shiftKey: true });
  assert.equal(page.document.activeElement, page.controls.at(-1));
  page.dispatch('keydown', { key: 'Escape' });
  assert.equal(page.document.activeElement, search);
  assert.equal(page.shell.inert, false);
});

test('command shortcut cannot stack another dialog over an open record', () => {
  const page = workspace();
  page.open();
  page.dispatch('keydown', { key: 'k', ctrlKey: true });
  assert.equal(page.elements.get('#commandRoot').innerHTML, '');
  assert.equal(page.shell.inert, true);
  assert.equal(page.document.activeElement, page.controls[1]);
});
