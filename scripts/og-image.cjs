// Renders app/opengraph-image.png (1200x630) with the site's own tokens and typeface.
// One-off: needs Playwright with Chromium. Run `node scripts/og-image.cjs` after changing the headline.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

// Inlined: a page created with setContent cannot load file:// fonts.
const font = `data:font/woff2;base64,${fs.readFileSync(path.join(__dirname, '../app/fonts/archivo.woff2')).toString('base64')}`;
const html = `<!doctype html><html><head><style>
@font-face { font-family: Archivo; src: url("${font}") format("woff2"); font-weight: 100 900; font-stretch: 62% 125%; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #f1f2ee; color: #14171a; font-family: Archivo, sans-serif; display: flex; flex-direction: column; }
.strap { flex: none; height: 36px; background: repeating-linear-gradient(-45deg, #14171a 0 18px, #ffd60a 18px 36px); }
main { flex: 1; padding: 56px 72px 60px; display: flex; flex-direction: column; justify-content: space-between; }
.mark { display: flex; align-items: center; gap: 14px; font-stretch: 68%; font-weight: 800; font-size: 44px; letter-spacing: -0.015em; }
.mark i { width: 18px; height: 38px; border: 3px solid #14171a; border-radius: 3px; background: repeating-linear-gradient(-45deg, #14171a 0 6px, #ffd60a 6px 12px); }
h1 { font-stretch: 68%; font-weight: 800; font-size: 132px; line-height: 0.94; letter-spacing: -0.015em; max-width: 1000px; }
p { font-size: 34px; line-height: 1.3; max-width: 640px; }
code { white-space: nowrap; font: 600 30px ui-monospace, Menlo, monospace; background: #ffd60a; border: 3px solid #14171a; border-radius: 8px; padding: 8px 16px; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 32px; }
</style></head><body><div class="strap"></div><main>
<div class="mark"><i></i>harnay</div>
<h1>Put your coding agent in a harness.</h1>
<div class="row"><p>Rules, permissions and a guard hook for Claude Code.</p><code>npx harnay init</code></div>
</main></body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(__dirname, '../app/opengraph-image.png') });
  await browser.close();
  console.log('app/opengraph-image.png written');
})();
