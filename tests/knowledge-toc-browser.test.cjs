/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { chromium, webkit } = require('playwright');

const baseURL = process.env.KNOWLEDGE_TOC_BASE_URL;
const articlePath = '/uteguiden/julegaven-til-den-som-har-alt';

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  test(`article TOC: accordion, anchors, sticky rail and active section (${name})`, {
    skip: !baseURL,
    timeout: 120_000,
  }, async () => {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await page.addInitScript(() => {
        // Keep the unrelated arrival promotion from covering the navigation test.
        sessionStorage.setItem('utekos:klarna-arrival-dismissed:v1', '1');
      });
      const errors = [];
      const summaryRequests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        if (new URL(request.url()).pathname === '/api/ai-summary') summaryRequests.push(request.url());
      });
      await page.goto(new URL(articlePath, baseURL).href, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => {
        const trigger = document.querySelector('[data-article-toc="accordion"] button');
        return trigger && Object.keys(trigger).some(key => key.startsWith('__reactProps'));
      });
      await page.evaluate(() => document.fonts.ready);

      const mobile = page.locator('[data-article-toc="accordion"]');
      const desktop = page.locator('[data-article-toc="list"]');
      const trigger = mobile.getByRole('button', { name: 'I denne artikkelen', exact: true });
      assert.equal(await desktop.locator('a').first().getAttribute('aria-current'), 'location');
      const summary = page.locator('[data-ai-summary="julegaven-til-den-som-har-alt"]');
      await summary.waitFor({ state: 'visible' });
      await summary.locator('summary').click();
      await page.waitForFunction(() =>
        document.querySelector('[data-ai-summary]')?.getAttribute('data-presentation-phase') === 'complete',
      null, { timeout: 8_000 });
      assert.equal(await summary.evaluate(element => element.open), true);
      assert.ok((await summary.innerText()).length > 800);
      await summary.locator('summary').click();
      await summary.locator('summary').click();
      assert.equal(await summary.getAttribute('data-presentation-phase'), 'complete');
      assert.deepEqual(summaryRequests, []);
      await page.locator('[data-reading-progress][data-active]').waitFor({ state: 'attached' });
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      assert.equal(await mobile.locator('a').count(), 6);
      assert.equal(await mobile.locator('a').first().isVisible(), false);

      for (const width of [390, 768, 1279]) {
        await page.setViewportSize({ width, height: 844 });
        assert.equal(await mobile.isVisible(), true);
        assert.equal(await desktop.isVisible(), false);
        await trigger.focus();
        await page.keyboard.press('Enter');
        await mobile.locator('a').first().waitFor({ state: 'visible' });
        assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
        const sizes = await page.evaluate(() => [
          document.querySelector('section[aria-labelledby$="-hva-du-vil-laere"] h2'),
          document.querySelector('[data-article-toc="accordion"] button'),
        ].map(element => getComputedStyle(element).fontSize));
        assert.equal(sizes[0], sizes[1]);
        await mobile.locator('a').nth(2).click();
        const hash = await mobile.locator('a').nth(2).getAttribute('href');
        assert.equal(decodeURIComponent(new URL(page.url()).hash), hash);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await trigger.click();
        await mobile.locator('a').first().waitFor({ state: 'hidden' });
      }

      for (const width of [1280, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await mobile.isVisible(), false);
        assert.equal(await desktop.isVisible(), true);
        const ids = await desktop.locator('a').evaluateAll(links => links.map(link => link.hash.slice(1)));
        for (const index of [0, 3, 1, 5]) {
          const id = decodeURIComponent(ids[index]);
          await page.evaluate(id => {
            const target = document.getElementById(id);
            window.scrollTo(0, target.getBoundingClientRect().top + scrollY - innerHeight / 3 + 20);
          }, id);
          await page.waitForFunction(id =>
            document.querySelector('[data-article-toc="list"] [aria-current="location"]')?.getAttribute('href') === `#${id}`,
          id, { timeout: 1_000 });
          const geometry = await desktop.evaluate(nav => {
            const sticky = nav.parentElement;
            const rail = sticky.parentElement;
            return {
              stickyTop: sticky.getBoundingClientRect().top,
              railLeft: rail.getBoundingClientRect().left,
              articleRight: document.querySelector('article').getBoundingClientRect().right,
              position: getComputedStyle(sticky).position,
              height: sticky.getBoundingClientRect().height,
              viewport: innerHeight,
              overflow: document.documentElement.scrollWidth > innerWidth,
            };
          });
          assert.equal(geometry.position, 'sticky');
          assert.ok(Math.abs(geometry.stickyTop - 32) < 2);
          assert.ok(geometry.railLeft >= geometry.articleRight);
          assert.ok(geometry.height <= geometry.viewport - 64);
          assert.equal(geometry.overflow, false);
        }
        assert.ok((await desktop.locator('a').evaluateAll(links => links.map(link => getComputedStyle(link).fontWeight))).every(weight => weight === '500'));
      }

      for (const fraction of [0, 0.5, 1]) {
        await page.evaluate(fraction => {
          const article = document.querySelector('article');
          const top = article.getBoundingClientRect().top + scrollY;
          window.scrollTo(0, top + fraction * (article.offsetHeight - innerHeight));
        }, fraction);
        await page.waitForFunction(fraction => {
          const bar = document.querySelector('[data-reading-progress]');
          const scale = new DOMMatrixReadOnly(getComputedStyle(bar).transform).a;
          return Math.abs(scale - fraction) < 0.025;
        }, fraction, { timeout: 2_000 });
      }

      await page.setViewportSize({ width: 1280, height: 500 });
      assert.equal(await desktop.evaluate(nav => {
        const scroller = nav.parentElement;
        scroller.scrollTop = scroller.scrollHeight;
        return scroller.scrollTop > 0;
      }), true);

      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.locator('[data-reading-progress]').isVisible(), false);
      await page.setViewportSize({ width: 390, height: 844 });
      await trigger.click();
      await mobile.locator('a').first().waitFor({ state: 'visible' });
      assert.equal(await mobile.locator('[role="region"]').evaluate(panel => getComputedStyle(panel).transitionDuration), '0s');
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  });
}
