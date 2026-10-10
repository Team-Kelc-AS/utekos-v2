/** Bounded foreground integration test; always closes its server and browsers. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
import { load } from 'cheerio';

const require = createRequire(import.meta.url);
const { loadTypeScript } = require('../../tests/load-typescript.cjs');
const { supportPages } = loadTypeScript('lib/seo/supportPages.ts');
const port = Number(process.env.SEO_TEST_PORT ?? 3107);
const base = `http://localhost:${port}`;
const output = process.env.SEO_TEST_OUTPUT ?? '/tmp/utekos-support-seo-build';
fs.mkdirSync(output, { recursive: true });
const log = fs.openSync(`${output}/server.log`, 'w');
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], { stdio: ['ignore', log, log] });
let browser;
async function run(script, evidenceDirectory = output) {
  const child = spawn(process.execPath, [script], { stdio: 'inherit', env: { ...process.env, SEO_TEST_ORIGIN: base, SEO_TEST_OUTPUT: evidenceDirectory } });
  const code = await new Promise(resolve => child.once('exit', resolve));
  assert.equal(code, 0, script);
}
try {
  const deadline = Date.now() + 30_000;
  while (true) {
    try {
      if (/\bReady in\b/.test(fs.readFileSync(`${output}/server.log`, 'utf8')) && (await fetch(base + '/robots.txt')).ok) break;
    } catch { /* Server startup only. */ }
    assert.ok(Date.now() < deadline, 'Test server startup');
    assert.equal(server.exitCode, null, 'Test server remains alive');
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  await run('scripts/seo/check-support-http.mjs');
  await run('scripts/seo/check-site-http.mjs', `${output}/site`);
  const xml = load(await (await fetch(base + '/sitemap.xml')).text(), { xmlMode: true });
  for (const [key, page] of Object.entries(supportPages)) {
    const entry = xml('url').filter((_, el) => xml(el).find('loc').first().text() === 'https://utekos.no' + page.path);
    assert.equal(entry.length, 1, `${key} sitemap count`);
    assert.equal(entry.find('lastmod').text(), page.dateModified ?? page.article?.dateModified ?? '');
    assert.ok(!entry.text().includes('opengraph-image'), 'Sharing-only images stay out of sitemap');
  }
  assert.equal((await fetch(base + '/handlehjelp')).status, 404);
  assert.equal((await fetch(base + '/handlehjelp/teknologi-materialer')).status, 404);
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  await page.goto(base + '/om-oss', { waitUntil: 'networkidle' });
  const navigation = [];
  for (const key of ['about', 'contact', 'sizeGuide', 'maintenance', 'shippingReturns', 'about']) {
    const entry = supportPages[key];
    if (new URL(page.url()).pathname !== entry.path) {
      await page.locator(`a[href="${entry.path}"]:visible`).first().click();
      await page.waitForURL(base + entry.path);
    }
    await page.waitForFunction(({ title, id }) => document.title === title && document.querySelectorAll('script[id^="support-"]').length === 1 && document.querySelector(`script#support-${id}`), { title: entry.title, id: key });
    assert.equal(await page.locator('script#site-jsonld').count(), 1);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://utekos.no' + entry.path);
    navigation.push({ route: entry.path, supportScripts: await page.locator('script[id^="support-"]').count() });
  }
  await page.locator('a[href="/uteguiden"]:visible').first().click();
  await page.waitForURL(base + '/uteguiden');
  await page.waitForFunction(() => document.querySelectorAll('script[id^="support-"]').length === 0);
  assert.equal(await page.locator('script#site-jsonld').count(), 1);
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const noJsPage = await noJs.newPage();
  const noJsResults = [];
  for (const entry of Object.values(supportPages)) {
    const response = await noJsPage.goto(base + entry.path);
    assert.equal(response.status(), 200);
    assert.equal(await noJsPage.title(), entry.title);
    assert.ok((await noJsPage.locator('main').innerText()).length > 300);
    assert.equal(await noJsPage.locator('script[id^="support-"]').count(), 1);
    noJsResults.push(entry.path);
  }
  fs.writeFileSync(`${output}/browser.json`, JSON.stringify({ navigation, noJs: noJsResults, sitemap: 'passed', known404s: 'confirmed' }, null, 2));
  console.log(`Production-build sitemap, client navigation and all ${Object.keys(supportPages).length} JavaScript-disabled pages passed.`);
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await new Promise(resolve => server.exitCode !== null ? resolve() : server.once('exit', resolve));
  fs.closeSync(log);
}
