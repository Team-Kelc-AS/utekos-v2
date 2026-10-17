/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const { loadTypeScript } = require('./load-typescript.cjs');
const { isWebCrawler, isPassiveWebCrawler } = loadTypeScript('lib/tracking/webCrawler.ts');
const tokens = ['Googlebot/2.1','Googlebot-Image/1.0','Googlebot-Video/1.0','Storebot-Google/1.0','Google-InspectionTool/1.0','GoogleOther','GoogleOther-Image/1.0','GoogleOther-Video/1.0','Google-CloudVertexBot','AdsBot-Google','AdsBot-Google-Mobile','Google-Safety','Mediapartners-Google','Mediapartners-Google/2.1','Google-CWS','FeedFetcher-Google','Google-GeminiNotebook','Google-Agent','GoogleMessages','Google-Pinpoint','GoogleProducer','Google-Read-Aloud','Google-Site-Verification/1.0'];
test('documented Google HTTP tokens opt out before standalone Pixel initialization', () => {
 const pixel = readFileSync('public/analytics/meta-pixel-canonical-v1.js','utf8');
 for(const token of tokens) for(const ua of [token, `Mozilla/5.0 (compatible; ${token}; +https://www.google.com/bot.html)`]) {
  assert.equal(isWebCrawler(ua), true, ua);
  const window={navigator:{userAgent:ua}};
  vm.runInNewContext(pixel,{window,document:{}});
  assert.equal(window.fbq,undefined,ua);
  assert.equal(window.dataLayer,undefined,ua);
 }
});
test('ordinary browsers, notification sender and robots-only tokens are not browser crawlers', () => {
 for(const ua of ['Mozilla/5.0 Chrome/140.0 Safari/537.36','Mozilla/5.0 GSA/350.0','APIs-Google (+https://developers.google.com/webmasters/APIs-Google.html)','Google-Extended','Googlebot-News','not-Googlebot/2.1','Googlebot/2.1evil','GoogleOtherFake','AdsBot-Google-Mobile-Apps']) assert.equal(isWebCrawler(ua),false,ua);
});
test('Storebot and user-delegated Google-Agent keep operational cart behavior', () => {
 for(const ua of ['Storebot-Google/1.0','Mozilla/5.0 (compatible; Google-Agent)']) assert.equal(isPassiveWebCrawler(ua),false);
 for(const ua of ['Googlebot/2.1','GoogleMessages','AdsBot-Google']) assert.equal(isPassiveWebCrawler(ua),true);
});
