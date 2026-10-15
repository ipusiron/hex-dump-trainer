// Optional local browser smoke test: node test/browser_qa.mjs <chrome.exe> [page URL]
// Uses the Chrome DevTools Protocol directly; no npm dependencies are required.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const chromePath = process.argv[2];
if (!chromePath) throw new Error('Pass the Chrome executable path');
const pageUrl = process.argv[3] || pathToFileURL(resolve('index.html')).href;
const allowedBase = pageUrl.startsWith('file:') ? new URL('.', pageUrl).href : new URL(pageUrl).origin + '/';
const profile = await mkdtemp(join(tmpdir(), 'day114-chrome-qa-'));
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions',
  '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  'about:blank'
], { stdio: 'ignore', windowsHide: true });
let socket;

async function waitUntil(check, label) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const value = await check();
      if (value) return value;
    } catch { /* Browser startup may not have finished yet. */ }
    if (chrome.exitCode !== null) throw new Error(`Chrome exited before ${label}`);
    await new Promise(resolveDelay => setTimeout(resolveDelay, 100));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

try {
  const portText = await waitUntil(() => readFile(join(profile, 'DevToolsActivePort'), 'utf8'), 'DevTools port');
  const port = Number(portText.split(/\r?\n/)[0]);
  const target = await waitUntil(async () => {
    const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    return pages.find(page => page.type === 'page');
  }, 'page target');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', rejectOpen, { once: true });
  });
  let nextId = 1;
  const pending = new Map();
  const browserErrors = [];
  const externalRequests = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') browserErrors.push(message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') browserErrors.push('console.error');
    if (message.method === 'Network.requestWillBeSent') {
      const requested = message.params.request.url;
      if (!requested.startsWith(allowedBase)) {
        externalRequests.push(requested);
      }
    }
    if (!message.id) return;
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    if (message.error) entry.reject(new Error(JSON.stringify(message.error)));
    else entry.resolve(message.result);
  });
  function send(method, params = {}) {
    const id = nextId++;
    return new Promise((resolveSend, rejectSend) => {
      pending.set(id, { resolve: resolveSend, reject: rejectSend });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Page.navigate', { url: pageUrl });
  await waitUntil(async () => evaluate("document.readyState === 'complete' && !!document.querySelector('#custom-tab') && document.querySelector('#practice-tab').textContent === '演習'"), 'app render');

  const sample = await evaluate(`(() => {
    document.querySelector('#custom-tab').click();
    const input = document.querySelector('#custom-input');
    input.value = HexDumpData.frames.ipv4.hex;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#custom-analyze').click();
    return {
      visible: !document.querySelector('#custom-results').hidden,
      fields: document.querySelectorAll('#custom-fields button').length,
      warnings: document.querySelectorAll('#custom-warnings li').length,
      error: document.querySelector('#custom-error').textContent,
      bytes: document.querySelectorAll('#custom-dump [data-offset]').length
    };
  })()`);
  assert.equal(sample.visible, true);
  assert.ok(sample.fields >= 15, JSON.stringify(sample));
  assert.equal(sample.warnings, 0, JSON.stringify(sample));
  assert.ok(sample.bytes >= 42, JSON.stringify(sample));

  const highlight = await evaluate(`(() => {
    const button = [...document.querySelectorAll('#custom-fields button')]
      .find(item => item.textContent.includes('宛先MAC'));
    button.click();
    return {
      pressed: button.getAttribute('aria-pressed'),
      highlighted: document.querySelectorAll('#custom-dump .is-inspected').length,
      preview: document.querySelector('#custom-selection').textContent
    };
  })()`);
  assert.equal(highlight.pressed, 'true');
  assert.equal(highlight.highlighted, 6);
  assert.match(highlight.preview, /0～5/);

  const language = await evaluate(`(() => {
    document.querySelector('#language-button').click();
    return {
      title: document.querySelector('#custom-title').textContent,
      fields: document.querySelectorAll('#custom-fields button').length,
      textRetained: document.querySelector('#custom-input').value.length > 0,
      highlighted: document.querySelectorAll('#custom-dump .is-inspected').length
    };
  })()`);
  assert.equal(language.title, 'Read your own hex dump');
  assert.equal(language.fields, sample.fields);
  assert.equal(language.textRetained, true);
  assert.equal(language.highlighted, 6);

  const injection = await evaluate(`(() => {
    const input = document.querySelector('#custom-input');
    input.value = '<img src=x onerror=alert(1)>';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#custom-analyze').click();
    return {
      rejected: !document.querySelector('#custom-error').hidden,
      noResult: document.querySelector('#custom-results').hidden,
      noInjectedImage: document.querySelector('#custom-panel img') === null
    };
  })()`);
  assert.deepEqual(injection, { rejected: true, noResult: true, noInjectedImage: true });

  const partial = await evaluate(`(() => {
    const input = document.querySelector('#custom-input');
    input.value = '02 FE DC BA 98 76';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#custom-analyze').click();
    return {
      fields: document.querySelectorAll('#custom-fields button').length,
      warning: document.querySelector('#custom-warnings').textContent
    };
  })()`);
  assert.equal(partial.fields, 1);
  assert.match(partial.warning, /incomplete/);

  const offset = await evaluate(`(() => {
    const select = document.querySelector('#custom-format');
    select.value = 'offset';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const bytes = HexDumpCore.parseHex(HexDumpData.frames.ipv4.hex);
    const lines = [];
    for (let i = 0; i < bytes.length; i += 8) {
      lines.push(i.toString(16).padStart(4, '0') + ': ' +
        [...bytes.slice(i, i + 8)].map(HexDumpCore.byteHex).join(' '));
    }
    const input = document.querySelector('#custom-input');
    input.value = lines.join('\\n');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#custom-analyze').click();
    return {
      fields: document.querySelectorAll('#custom-fields button').length,
      error: document.querySelector('#custom-error').textContent
    };
  })()`);
  assert.equal(offset.fields, sample.fields, JSON.stringify(offset));

  const controls = await evaluate(`(() => {
    const tabs = document.querySelector('.main-tabs');
    tabs.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    const home = document.querySelector('#practice-tab').getAttribute('aria-selected');
    tabs.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    const end = document.querySelector('#custom-tab').getAttribute('aria-selected');
    tabs.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    const left = document.querySelector('#learn-tab').getAttribute('aria-selected');
    document.querySelector('#custom-tab').click();
    document.querySelector('#custom-clear').click();
    return {
      home, end, left,
      clearedText: document.querySelector('#custom-input').value,
      clearedResult: document.querySelector('#custom-results').hidden
    };
  })()`);
  assert.deepEqual(controls, { home: 'true', end: 'true', left: 'true', clearedText: '', clearedResult: true });

  const icmpUi = await evaluate(`(() => {
    document.querySelector('#language-button').click();
    const select = document.querySelector('#custom-format');
    select.value = 'raw';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const input = document.querySelector('#custom-input');
    input.value = HexDumpData.frames.echoReply.hex;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#custom-analyze').click();
    const type = [...document.querySelectorAll('#custom-fields button')]
      .find(item => item.textContent.includes('ICMPv4 · Type'));
    type.click();
    const inspected = document.querySelectorAll('#custom-dump .is-inspected').length;
    const warningCount = document.querySelectorAll('#custom-warnings li').length;
    document.querySelector('#learn-tab').click();
    const field = document.querySelector('#learn-icmp-ja [data-learn-field="icmp-type"]');
    field.click();
    const highlighted = document.querySelectorAll('#learn-icmp-ja .learning-byte.is-highlighted').length;
    const selectedText = document.querySelector('#learn-icmp-ja .learning-selection').textContent;
    document.querySelector('#practice-tab').click();
    document.querySelector('[data-lesson-index="8"]').click();
    const answer = document.querySelector('#answer-input');
    answer.value = '0';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#answer-form').requestSubmit();
    return { inspected, warningCount, highlighted, selectedText,
      feedback: document.querySelector('#feedback').textContent,
      pairVisible: !document.querySelector('#comparison-reference').hidden };
  })()`);
  assert.equal(icmpUi.inspected, 1, JSON.stringify(icmpUi));
  assert.equal(icmpUi.warningCount, 0, JSON.stringify(icmpUi));
  assert.equal(icmpUi.highlighted, 1, JSON.stringify(icmpUi));
  assert.match(icmpUi.selectedText, /34/);
  assert.match(icmpUi.feedback, /正解/);
  assert.equal(icmpUi.pairVisible, true);
  if (pageUrl.startsWith('file:') && process.env.DAY114_CAPTURE_ICMP === '1') {
    await evaluate("document.querySelector('#learn-tab').click()");
    for (const width of [390, 1280]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
      await evaluate("document.querySelector('#learn-icmp-ja').scrollIntoView({ block: 'start' })");
      const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await writeFile(resolve(`assets/screenshot-icmp-learning-${width}.png`), Buffer.from(image.data, 'base64'));
    }
  }
  await evaluate("document.querySelector('#custom-tab').click()");

  // Return to a representative raw-input result for visual checks.
  await evaluate(`(() => {
    const select = document.querySelector('#custom-format');
    select.value = 'raw';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const input = document.querySelector('#custom-input');
    input.value = HexDumpData.frames.ipv4.hex;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#custom-analyze').click();
    [...document.querySelectorAll('#custom-fields button')]
      .find(item => item.textContent.includes('宛先MAC')).click();
  })()`);
  for (const width of [320, 390, 768, 1280]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    const size = await evaluate(`({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, tabCount: document.querySelectorAll('.main-tab').length })`);
    assert.equal(size.tabCount, 3);
    assert.ok(size.scrollWidth <= size.width, `Overflow at ${width}px: ${JSON.stringify(size)}`);
    const icmpLayout = await evaluate(`(() => {
      document.querySelector('#learn-tab').click();
      const card = document.querySelector('#learn-icmp-ja');
      const diagram = card.querySelector('.diagram-scroll');
      const dump = card.querySelector('.learning-dump');
      const result = { page: document.documentElement.scrollWidth, viewport: innerWidth,
        diagramScroll: diagram.scrollWidth > diagram.clientWidth,
        dumpScroll: dump.scrollWidth > dump.clientWidth };
      document.querySelector('#custom-tab').click();
      return result;
    })()`);
    assert.ok(icmpLayout.page <= icmpLayout.viewport, `ICMP page overflow at ${width}px: ${JSON.stringify(icmpLayout)}`);
    if (width <= 390) assert.equal(icmpLayout.diagramScroll, true, `ICMP diagram scroll at ${width}px`);
    if ((width === 390 || width === 1280) && pageUrl.startsWith('file:') && process.env.DAY114_SKIP_SCREENSHOTS !== '1') {
      await evaluate("document.querySelector('#custom-results').scrollIntoView({ block: 'start' })");
      const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await writeFile(resolve(`assets/screenshot-free-input-${width}.png`), Buffer.from(image.data, 'base64'));
    }
  }
  assert.deepEqual(browserErrors, []);
  assert.deepEqual(externalRequests, []);
  console.log(JSON.stringify({ url: pageUrl, sample, highlight, language, injection, partial, offset, controls, icmpUi, widths: [320, 390, 768, 1280], browserErrors, externalRequests }, null, 2));
} finally {
  socket?.close();
  chrome.kill();
  await new Promise(resolveExit => setTimeout(resolveExit, 300));
  const expectedPrefix = resolve(tmpdir()) + '\\day114-chrome-qa-';
  if (!resolve(profile).startsWith(expectedPrefix)) throw new Error('Refusing to remove unexpected Chrome profile path');
  await rm(profile, { recursive: true, force: true });
}
