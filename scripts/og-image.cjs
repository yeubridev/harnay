// Renders app/opengraph-image.png (1200x630) with the site's own tokens, typeface and mark.
// One-off: needs Playwright with Chromium. Run `node scripts/og-image.cjs` after changing the headline.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

// Inlined: a page created with setContent cannot load file:// fonts.
const font = `data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, '../app/fonts/geist.woff2')).toString('base64')}`;
const buckle = '<svg viewBox="0 0 64 64" fill="none"><rect x="7.5" y="11.5" width="41" height="41" rx="11" stroke="#ffd60a" stroke-width="9"/><path d="M8 32h49.5" stroke="#ffd60a" stroke-width="9" stroke-linecap="round"/></svg>';
const html = `<!doctype html><html><head><style>
@font-face { font-family: Geist; src: url("${font}") format("woff2"); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #131209; color: #f5f5f0; font-family: Geist, sans-serif; padding: 64px 80px; display: flex; flex-direction: column; justify-content: space-between; }
.mark { display: flex; align-items: center; gap: 16px; font-weight: 600; font-size: 40px; letter-spacing: -0.02em; }
.mark svg { width: 56px; height: 56px; }
h1 { font-weight: 600; font-size: 96px; line-height: 1; letter-spacing: -0.035em; background: linear-gradient(90deg, #ffffff, #9b9b9b); -webkit-background-clip: text; color: transparent; padding-bottom: 8px; }
p { font-size: 30px; line-height: 40px; color: #a3a39b; max-width: 640px; }
code { white-space: nowrap; font: 600 28px ui-monospace, Menlo, monospace; background: #ffd60a; color: #131209; border-radius: 12px; padding: 12px 20px; }
.row { display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; }
</style></head><body>
<div class="mark">${buckle}harnay</div>
<h1>The safety harness<br>for Claude Code.</h1>
<div class="row"><p>Rules, permission settings and a guard hook, installed in one command.</p><code>npx harnay init</code></div>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(__dirname, '../app/opengraph-image.png') });
  await browser.close();
  console.log('app/opengraph-image.png written');
})();
