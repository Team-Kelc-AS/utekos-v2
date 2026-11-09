/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const { loadTypeScript } = require('./load-typescript.cjs');
const { knowledgeArticleList: articles } = loadTypeScript('lib/knowledge/knowledgeArticles.ts');
const baseURL = process.env.KNOWLEDGE_NAV_BASE_URL;

test('navigation audit covers every Uteguiden article route', () => {
  const root = path.resolve(__dirname, '../src/app/(site)/(blog)/uteguiden');
  const routes = fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && ['page.mdx', 'page.tsx'].some(file =>
      fs.existsSync(path.join(root, entry.name, file))))
    .map(entry => entry.name).sort();
  assert.deepEqual(Array.from(articles, article => article.slug).sort(), routes);
  for (const article of articles) {
    assert.ok(article.toc.length > 0, `${article.slug} has registered navigation`);
    assert.equal(new Set(article.toc.map(item => item.id)).size, article.toc.length);
  }
});

for (const [engineName, engine] of Object.entries({ chromium, webkit })) {
  test(`all guides share desktop/mobile navigation and reading progress (${engineName})`, {
    skip: !baseURL, timeout: 300_000,
  }, async t => {
    const browser = await engine.launch();
    try {
      for (const article of articles) await t.test(article.slug, { timeout: 45_000 }, async () => {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        try {
          await page.addInitScript(() => sessionStorage.setItem('utekos:klarna-arrival-dismissed:v1', '1'));
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          await page.goto(new URL(article.path, baseURL).href, { waitUntil: 'domcontentloaded' });
          await page.evaluate(() => document.fonts.ready);
          const desktop = page.locator('[data-article-toc="list"]');
          const mobile = page.locator('[data-article-toc="accordion"]');
          assert.equal(await desktop.count(), 1);
          assert.equal(await mobile.count(), 1);
          assert.equal(await page.locator('[data-reading-progress]').count(), 1);
          assert.equal(await desktop.isVisible(), true);
          assert.equal(await mobile.isVisible(), false);
          assert.equal(await page.locator('h1').count(), 1);
          const broken = await desktop.locator('a').evaluateAll(links => links.flatMap(link => {
            const id = decodeURIComponent(link.hash.slice(1));
            const target = document.getElementById(id);
            return target?.closest('article') ? [] : [id];
          }));
          assert.deepEqual(broken, [], 'every TOC anchor exists in the article');
          assert.equal(await desktop.locator('a').count(), article.toc.length);
          await page.locator('[data-reading-progress][data-active]').waitFor({ state: 'attached' });
          await desktop.locator('a').nth(1).click();
          await page.waitForFunction(() => window.scrollY > 100);
          assert.equal(await desktop.evaluate(nav => getComputedStyle(nav.parentElement).position), 'sticky');
          await page.waitForFunction(() => {
            const nav = document.querySelector('[data-article-toc="list"]');
            return Math.abs(nav.parentElement.getBoundingClientRect().top - 32) < 2;
          });
          await page.waitForFunction(expected => {
            const active = document.querySelector('[data-article-toc="list"] a[aria-current="location"]');
            return active && decodeURIComponent(active.hash.slice(1)) === expected;
          }, article.toc[1].id);
          await page.waitForFunction(() => {
            const progress = document.querySelector('[data-reading-progress]');
            return new DOMMatrixReadOnly(getComputedStyle(progress).transform).a > 0;
          });
          const before = await page.locator('[data-reading-progress]').evaluate(el =>
            new DOMMatrixReadOnly(getComputedStyle(el).transform).a);
          await page.evaluate(() => {
            const element = document.querySelector('article#top');
            window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY + element.offsetHeight * 0.75);
          });
          await page.waitForFunction(value => {
            const progress = document.querySelector('[data-reading-progress]');
            return new DOMMatrixReadOnly(getComputedStyle(progress).transform).a > value;
          }, before);

          await page.setViewportSize({ width: 390, height: 844 });
          await page.goto(new URL(article.path, baseURL).href, { waitUntil: 'domcontentloaded' });
          const trigger = mobile.getByRole('button', { name: 'I denne artikkelen', exact: true });
          await page.waitForFunction(() => {
            const button = document.querySelector('[data-article-toc="accordion"] button');
            return button && Object.keys(button).some(key => key.startsWith('__reactProps'));
          });
          assert.equal(await desktop.isVisible(), false);
          assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
          assert.equal(await mobile.locator('a').first().isVisible(), false);
          await trigger.focus();
          await page.keyboard.press('Enter');
          await mobile.locator('a').first().waitFor({ state: 'visible' });
          assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
          await mobile.locator('a').nth(1).click();
          assert.equal(decodeURIComponent(new URL(page.url()).hash.slice(1)), article.toc[1].id);
          await page.evaluate(() => document.fonts.ready);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
          assert.deepEqual(errors, []);
        } finally {
          await page.close();
        }
      });
    } finally {
      await browser.close();
    }
  });
}
