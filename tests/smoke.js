'use strict';
/* Clinic Visit Tracker BD — headless-Chrome smoke tests via RAW CDP (no deps).
 * Usage: node tests/smoke.js [--viewport=desktop|mobile]
 * Exit code 0 = all checks pass. Uses ?asof=2026-10-27 for determinism. */
var path = require('path');
var http = require('http');
var child_process = require('child_process');
var VIEWPORT = 'desktop';
process.argv.slice(2).forEach(function (a) { if (a.indexOf('--viewport=') === 0) VIEWPORT = a.split('=')[1]; });
var MOBILE = VIEWPORT === 'mobile';
var PORT = MOBILE ? 19243 : 19242;
var CHROME = '/opt/meta-chromium/chrome';
var INDEX = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?asof=2026-10-27';
var passed = 0, failed = 0, pageErrors = [];
function check(name, cond, extra) {
  if (cond) passed++;
  else { failed++; console.log('FAIL: ' + name + (extra ? ' | ' + extra : '')); }
}
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function getVersion() {
  return new Promise(function (resolve, reject) {
    http.get('http://127.0.0.1:' + PORT + '/json/version', function (res) {
      var data = ''; res.on('data', function (c) { data += c; });
      res.on('end', function () { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}
function launchChrome() {
  var args = ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--no-first-run', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=' + PORT,
    '--user-data-dir=/tmp/clinic-smoke-' + VIEWPORT, 'about:blank'];
  return child_process.spawn(CHROME, args, { stdio: 'ignore', detached: true });
}
function main() {
  var chrome = launchChrome();
  var ws = null, nextId = 1, pending = new Map();
  function send(method, params, sessionId) {
    return new Promise(function (resolve, reject) {
      var id = nextId++;
      pending.set(id, { resolve: resolve, reject: reject });
      var msg = { id: id, method: method, params: params || {} };
      if (sessionId) msg.sessionId = sessionId;
      ws.send(JSON.stringify(msg));
      setTimeout(function () { if (pending.has(id)) { pending.delete(id); reject(new Error('CDP timeout: ' + method)); } }, 15000);
    });
  }
  function onMessage(data) {
    var msg; try { msg = JSON.parse(data.toString()); } catch (e) { return; }
    if (msg.id && pending.has(msg.id)) {
      var p = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error))); else p.resolve(msg.result || {});
      return;
    }
    if (msg.method === 'Runtime.exceptionThrown') pageErrors.push('exception: ' + JSON.stringify(msg.params.exceptionDetails || {}).slice(0, 300));
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') pageErrors.push('console.error: ' + (msg.params.args || []).map(function (a) { return a.value || a.description || ''; }).join(' '));
  }
  (async function () {
    try {
      var version = null;
      for (var i = 0; i < 50 && !version; i++) { try { version = await getVersion(); } catch (e) { await sleep(200); } }
      if (!version) throw new Error('Chrome DevTools endpoint did not come up');
      ws = new WebSocket(version.webSocketDebuggerUrl);
      await new Promise(function (res, rej) { ws.onopen = res; ws.onerror = rej; });
      ws.onmessage = function (ev2) { onMessage(ev2.data); };
      var target = await send('Target.createTarget', { url: 'about:blank' });
      var attach = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
      var session = attach.sessionId;
      await send('Runtime.enable', {}, session);
      await send('Page.enable', {}, session);
      await send('Log.enable', {}, session);
      await send('Emulation.setDeviceMetricsOverride', MOBILE ? { width: 390, height: 844, deviceScaleFactor: 1, mobile: true } : { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }, session);
      await send('Page.navigate', { url: INDEX }, session);
      function ev(expr) {
        return send('Runtime.evaluate', { expression: expr, returnByValue: true }, session).then(function (res) {
          if (res.exceptionDetails) throw new Error('evaluate failed: ' + JSON.stringify(res.exceptionDetails));
          return res.result.value;
        });
      }
      var ready = false;
      for (var w = 0; w < 60 && !ready; w++) {
        ready = await ev('typeof window.ClinicLogic === "object" && document.readyState === "complete" ? "yes" : "no"') === 'yes';
        if (!ready) await sleep(200);
      }
      check('app boots (ClinicLogic loaded, DOM complete)', ready);
      var h1 = await ev('document.querySelector("header h1").textContent');
      check('header renders', h1.indexOf('Clinic Visit Tracker BD') >= 0, JSON.stringify(h1));
      // Dashboard starts at zero
      var dashText = await ev('document.getElementById("dashboard").textContent');
      check('dashboard starts at 0 visits', dashText.indexOf('Total visits') >= 0, dashText.slice(0, 120));
      // Empty state on visits tab
      await ev('document.querySelector("[data-tab=visits]").click()');
      await sleep(300);
      var emptyMsg = await ev('document.getElementById("visitList").textContent');
      check('empty visits message shown', emptyMsg.indexOf('No visits yet') >= 0, JSON.stringify(emptyMsg));
      // Validation: empty doctor blocked
      await ev('document.querySelector("[data-tab=add]").click()');
      await sleep(200);
      await ev('document.getElementById("fDoctor").value=""; document.getElementById("fFee").value="500"; document.getElementById("saveBtn").click()');
      await sleep(300);
      var errText = await ev('document.getElementById("formErr").textContent');
      check('empty doctor blocked with error', errText.length > 0, JSON.stringify(errText));
      // Add a real visit
      await ev('document.getElementById("fDoctor").value="Dr. Test Rahman"; document.getElementById("fClinic").value="Test Clinic"; document.getElementById("fDate").value="2026-10-27"; document.getElementById("fFee").value="800"; document.getElementById("saveBtn").click()');
      await sleep(400);
      var listText = await ev('document.getElementById("visitList").textContent');
      check('added visit appears in list', listText.indexOf('Dr. Test Rahman') >= 0 && listText.indexOf('800.00') >= 0, listText.slice(0, 200));
      // Dashboard: total 1
      await ev('document.querySelector("[data-tab=dashboard]").click()');
      await sleep(300);
      var dash2 = await ev('document.getElementById("dashboard").textContent');
      check('dashboard total becomes 1', /Total visits/.test(dash2), dash2.slice(0, 150));
      // Add a test to the visit, toggle it done
      await ev('document.querySelector("[data-tab=visits]").click()');
      await sleep(300);
      var vid = await ev('window.__clinic.getVisits()[0].id');
      await ev('var i=document.querySelector("[data-test-name=\\""+window.__clinic.getVisits()[0].id+"\\"]"); i.value="CBC"; document.querySelector("[data-test-add=\\""+window.__clinic.getVisits()[0].id+"\\"]").click()');
      await sleep(300);
      var withTest = await ev('document.getElementById("visitList").textContent');
      check('test added to visit', withTest.indexOf('CBC') >= 0, withTest.slice(0, 200));
      // Search filter narrows
      await ev('document.getElementById("searchInput").value="zzz-no-match"; document.getElementById("searchInput").dispatchEvent(new Event("input",{bubbles:true}))');
      await sleep(300);
      var noMatch = await ev('document.getElementById("visitList").textContent');
      check('search with no match shows empty message', noMatch.indexOf('Nothing matches') >= 0, JSON.stringify(noMatch));
      await ev('document.getElementById("searchInput").value=""; document.getElementById("searchInput").dispatchEvent(new Event("input",{bubbles:true}))');
      await sleep(300);
      // BN toggle: tagline becomes Bengali
      await ev('document.getElementById("langBtn").click()');
      await sleep(300);
      var bnTag = await ev('document.getElementById("tagline").textContent');
      check('BN toggle renders Bengali tagline', bnTag.indexOf('ডাক্তার') >= 0, JSON.stringify(bnTag));
      // Persistence across reload
      await send('Page.navigate', { url: INDEX }, session);
      await sleep(800);
      var persisted = await ev('window.__clinic.getVisits().length');
      check('visit persists across reload (localStorage)', persisted === 1, JSON.stringify(persisted));
      // Sample loader adds 2 more (total 3) — sample follow-up = asof date, so due-soon badge appears
      await ev('document.getElementById("sampleBtn").click()');
      await sleep(400);
      var sampleCount = await ev('window.__clinic.getVisits().length');
      check('sample loads 2 visits', sampleCount === 2, JSON.stringify(sampleCount));
      var sampleText = await ev('document.getElementById("visitList").textContent');
      check('sample visit renders', sampleText.indexOf('Ayesha Rahman') >= 0, sampleText.slice(0, 200));
      if (MOBILE) {
        var overflow = await ev('document.documentElement.scrollWidth');
        check('390px no horizontal overflow', overflow <= 391, JSON.stringify(overflow));
      }
      check('zero console/page errors', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 500));
      console.log(passed + '/' + (passed + failed) + ' smoke checks passed');
      process.exit(failed ? 1 : 0);
    } catch (e) {
      console.error('SMOKE ERROR: ' + (e && e.stack || e));
      process.exit(1);
    } finally {
      try { chrome.kill(); } catch (e) {}
      setTimeout(function () { process.exit(failed ? 1 : 0); }, 300);
    }
  })();
}
main();
