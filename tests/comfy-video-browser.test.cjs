/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const test = require('node:test');
const { chromium, webkit } = require('playwright');
const baseURL = process.env.COMFY_VIDEO_BASE_URL;
const src = '/assets/videos/comfy-video-1.mp4';
const videoSelector = `video[src="${src}"]`;

async function openPage(browser, pathname, width) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  page.setDefaultTimeout(15_000);
  await page.addInitScript(() => sessionStorage.setItem('utekos:klarna-arrival-dismissed:v1', '1'));
  const requests = [];
  page.on('request', request => { if (new URL(request.url()).pathname === src) requests.push(request.url()); });
  const response = await page.goto(new URL(pathname, baseURL).href, { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('load');
  return { page, requests };
}

async function play(page, container, requests) {
  const video = container.locator(videoSelector);
  const cover = container.locator('img').first();
  await cover.scrollIntoViewIfNeeded();
  await cover.evaluate(image => image.decode());
  assert.equal(await cover.isVisible(), true);
  assert.equal(await video.isVisible(), false);
  assert.equal(requests.length, 0, 'the video must wait for a click before downloading');
  const coverSrc = await cover.getAttribute('src');
  await container.getByRole('button', { name: /^Spill av video av/ }).click();
  await page.waitForFunction(selector => {
    const video = document.querySelector(selector);
    return video && !video.paused && video.currentTime > 0.2;
  }, videoSelector);
  assert.ok(requests.length > 0);
  assert.equal(await cover.isVisible(), false);
  assert.equal(await video.isVisible(), true);
  const dimensions = await video.evaluate(element => ({
    width: element.videoWidth, height: element.videoHeight,
    ratio: element.getBoundingClientRect().width / element.getBoundingClientRect().height,
  }));
  assert.deepEqual([dimensions.width, dimensions.height], [1080, 1440]);
  assert.ok(Math.abs(dimensions.ratio - 3 / 4) < 0.005, 'retain the original video ratio');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  return { video, cover, coverSrc };
}

for (const [name, engine] of Object.entries({ chromium, webkit })) {
  test(`Comfyrobe XL cards play the supplied film and restore their covers (${name})`, {
    skip: !baseURL, timeout: 150_000,
  }, async () => {
    const browser = await engine.launch();
    try {
      for (const pathname of ['/', '/produkter']) {
        for (const width of [390, 1440]) {
          const { page, requests } = await openPage(browser, pathname, width);
          const attribute = pathname === '/' ? 'data-product-card' : 'data-variant-card';
          if (pathname === '/') {
            const section = page.locator('section[data-tracking-list]:has([data-product-card])').first();
            await section.scrollIntoViewIfNeeded();
            await section.locator('[data-slot="carousel"]').waitFor({ state: 'visible' });
          }
          const carouselSelector = pathname === '/'
            ? 'section[data-tracking-list]:has([data-product-card]) [data-slot="carousel-content"]'
            : '[data-product-row="comfyrobe"] [data-slot="carousel-content"]';
          await page.waitForFunction(selector => document.querySelector(selector)?.firstElementChild?.style.transform.includes('translate3d'), carouselSelector);
          const card = page.locator(`[${attribute}]:has(${videoSelector})`);
          assert.equal(await card.count(), 1);
          const productLink = card.locator('a[href*="/produkter/comfyrobe?"]').first();
          assert.equal(new URL(await productLink.getAttribute('href'), baseURL).searchParams.get('storrelse'), 'xl');
          const { video, cover, coverSrc } = await play(page, card, requests);
          await card.screenshot({ path: `/tmp/utekos-comfy-card-${name}-${pathname === '/' ? 'home' : 'catalog'}-${width}.png` });
          await video.press('Escape');
          await cover.waitFor({ state: 'visible' });
          assert.equal(await video.evaluate(element => element.paused), true);
          assert.equal(await cover.getAttribute('src'), coverSrc);
          await page.waitForFunction(selector => {
            const card = document.querySelector(selector);
            return card.querySelector('button[aria-label^="Spill av video av"]') === document.activeElement;
          }, `[${attribute}]:has(${videoSelector})`);
          await page.close();
        }
      }
    } finally {
      await browser.close();
    }
  });

  test(`Comfyrobe XL mobile gallery keeps its current cover and desktop images (${name})`, {
    skip: !baseURL, timeout: 90_000,
  }, async () => {
    const browser = await engine.launch();
    try {
      const { page, requests } = await openPage(browser, '/produkter/comfyrobe?storrelse=xl', 390);
      const gallery = page.locator('[data-gallery-product="comfyrobe"]');
      const slide = gallery.locator('figure').first();
      const { video, cover, coverSrc } = await play(page, slide, requests);
      assert.ok(coverSrc.includes(encodeURIComponent('/images/products/comfyrobe/comfyrobe_mobile_2.webp')) ||
        (await cover.evaluate(element => element.currentSrc)).includes(encodeURIComponent('/images/products/comfyrobe/comfyrobe_mobile_2.webp')));
      assert.equal(await video.getAttribute('poster'), '/images/products/comfyrobe/comfyrobe_mobile_2.webp');
      await slide.screenshot({ path: `/tmp/utekos-comfy-gallery-${name}-390.png` });
      await video.evaluate(element => { element.currentTime = element.duration - 0.05; });
      await cover.waitFor({ state: 'visible' });
      await slide.getByRole('button', { name: /^Spill av video av/ }).click();
      await page.waitForFunction(selector => !document.querySelector(selector).paused, videoSelector);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await cover.waitFor({ state: 'visible' });
      await page.waitForFunction(selector => document.querySelector(selector).paused, videoSelector);
      assert.equal(await video.isVisible(), false);
      assert.equal(await slide.getByRole('button', { name: /^Spill av video av/ }).isVisible(), false);
      await cover.evaluate(image => image.decode());
      assert.ok((await cover.evaluate(element => element.currentSrc)).includes('comfy-1440x1800.webp'));
      await slide.screenshot({ path: `/tmp/utekos-comfy-gallery-${name}-1440.png` });
      for (const size of ['xs', 'm']) {
        await page.goto(new URL(`/produkter/comfyrobe?storrelse=${size}`, baseURL).href, { waitUntil: 'domcontentloaded' });
        await page.locator('[data-gallery-product="comfyrobe"]').waitFor();
        assert.equal(await page.locator(videoSelector).count(), 0);
      }
    } finally {
      await browser.close();
    }
  });
}
