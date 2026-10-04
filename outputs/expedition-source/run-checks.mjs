// Run one of the generated check pages (checks.html, lookout-checks.html, rifle-checks.html, ...) in headless
// Chrome or Edge and print its results.   usage: node run-checks.mjs <page.html> <results element id> [out.json]
// e.g.  node run-checks.mjs rifle-checks.html rifle-results rifle-check-results.json
// Set BROWSER to the path of chrome/msedge if it is not found automatically.
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const [,, page, id, out] = process.argv;
if (!page || !id) { console.error('usage: node run-checks.mjs <page.html> <results element id> [out.json]'); process.exit(2); }
const here = path.dirname(fileURLToPath(import.meta.url));
const candidates = [process.env.BROWSER,
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const browser = candidates.find(p => fs.existsSync(p));
if (!browser) { console.error('No Chrome or Edge found; set BROWSER.'); process.exit(2); }
const port = 9300 + Math.floor(Math.random() * 500), profile = path.join(process.env.TEMP || '/tmp', 'expedition-checks-' + port);
const child = spawn(browser, ['--headless=new', '--no-first-run', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist', '--window-size=1280,720', '--remote-debugging-port=' + port, '--user-data-dir=' + profile,
  '--allow-file-access-from-files', 'about:blank'], {stdio: 'ignore'});
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.some(t => t.type === 'page')) break; } catch {} await sleep(300); }
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let n = 0; const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++n; pending.set(i, r); ws.send(JSON.stringify({id: i, method, params})); });
const evaluate = async expression => (await send('Runtime.evaluate', {expression, returnByValue: true})).result?.result?.value;
await send('Runtime.enable'); await send('Page.enable');
await send('Page.navigate', {url: 'file:///' + path.resolve(here, page).split(path.sep).join('/')});
let text = null;
for (let i = 0; i < 240 && !text; i++) { await sleep(500); text = await evaluate(`document.getElementById(${JSON.stringify(id)})?.textContent||null`); }
ws.close(); child.kill();
if (!text) { console.error('No results appeared in #' + id); process.exit(1); }
const raw = JSON.parse(text), data = Array.isArray(raw) ? {results: raw} : raw;
const failed = data.results.filter(r => !r.pass);
for (const r of data.results) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  (' + r.detail + ')' : ''));
console.log(`${data.results.length - failed.length}/${data.results.length} passed`);
if (out) fs.writeFileSync(path.resolve(here, out), JSON.stringify(data));
process.exit(failed.length ? 1 : 0);
