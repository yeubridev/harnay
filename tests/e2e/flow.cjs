// Browser flow for the builder, the landing CTA and checkout.
// Needs Playwright with Chromium and a running production build:
//   npm run build && npm start        (in one terminal)
//   node tests/e2e/flow.cjs           (in another; BASE_URL overrides http://localhost:3000)
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  const command = () => page.locator('#command-heading + div code').innerText();
  const step = (name) => console.log('ok ', name);

  // 1. Default builder: free command, 8 files, nothing locked
  await page.goto(BASE + '/new', { waitUntil: 'networkidle' });
  assert.match(await command(), /npx harnay@latest init$/);
  assert.equal(await page.locator('#files-heading').locator('xpath=../..').locator('ul li').count(), 8);
  await page.getByText('Free. No account, no key.').waitFor();
  step('default is the free harness with 8 files');

  // 2. Choose a paid stack and a pack: command, URL, file list and upsell follow
  await page.getByLabel(/Next\.js \+ Supabase/).check();
  await page.getByLabel(/^Quality/).check();
  await page.getByText('This selection includes Pro content.').waitFor();
  await page.waitForFunction(() => document.querySelectorAll('section[aria-labelledby="files-heading"] ul li').length === 13);
  assert.match(await command(), /init next-supabase --packs quality$/);
  assert.match(page.url(), /stack=next-supabase&agents=claude&packs=guard%2Cquality/);
  step('choosing Next.js + Supabase and Quality updates command, URL and 13 files');

  // 3. A locked file shows an excerpt and how many lines are held back
  await page.getByRole('button', { name: /test-first/ }).click();
  await page.getByText(/more lines with Pro/).waitFor();
  assert.match(await page.locator('pre').innerText(), /name: test-first/);
  step('a Pro file shows its excerpt and the locked notice');

  // 4. A free file inside a paid selection is fully readable
  await page.getByRole('button', { name: /guard-rules\.mjs/ }).first().click();
  assert.match(await page.locator('pre').innerText(), /export function selfTest/);
  assert.equal(await page.getByText(/more lines with Pro/).count(), 0);
  step('the guard source is fully readable before install');

  // 5. Copy puts the exact command on the clipboard and says so
  await page.locator('#command-heading + div button').click();
  await page.locator('#command-heading + div button', { hasText: 'Copied' }).waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'npx harnay@latest init next-supabase --packs quality');
  step('copy button copies the command');

  // 6. The last agent cannot be unticked; adding Codex changes the command
  assert.equal(await page.getByLabel(/^Claude Code/).isDisabled(), true);
  await page.getByLabel(/^Codex/).check();
  await page.waitForFunction(() => document.querySelector('#command-heading + div code').innerText.includes('--agents claude,codex'));
  step('agents: at least one stays selected, Codex adds --agents');

  // 7. A shared link opens with its choices, rendered by the server
  const shared = await context.newPage();
  await shared.goto(BASE + '/new?stack=expo&agents=cursor&packs=design', { waitUntil: 'networkidle' });
  assert.match(await shared.locator('#command-heading + div code').innerText(), /init expo --agents cursor --packs design$/);
  assert.equal(await shared.getByLabel(/^Expo/).isChecked(), true);
  assert.equal(await shared.getByRole('button', { name: /\.cursor\/hooks\.json/ }).count(), 1);
  step('shared link /new?stack=expo&agents=cursor&packs=design opens with those choices');

  // 8. A bad link falls back to the default instead of breaking
  await shared.goto(BASE + '/new?stack=../../etc', { waitUntil: 'networkidle' });
  assert.match(await shared.locator('#command-heading + div code').innerText(), /npx harnay@latest init$/);
  step('a bad link falls back to the default');

  // 9. When the API fails, the builder says so, keeps the selection and can retry
  await page.route('**/api/harness**', (route) => route.abort());
  await page.getByLabel(/^Ship/).check();
  await page.getByText('The preview did not load.').waitFor();
  assert.match(await command(), /--packs quality,ship$/);
  await page.unroute('**/api/harness**');
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByRole('button', { name: /security-check/ }).first().waitFor();
  step('network failure shows an error, keeps the command, and Try again recovers');

  // 10. Home: hero CTA goes to the builder; pricing form posts to checkout (redirects when billing is off)
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.locator('main').getByRole('link', { name: 'Get Harnay' }).first().click();
  await page.waitForURL('**/new');
  await page.goto(BASE + '/#pricing', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Subscribe to Pro' }).click();
  await page.waitForURL('**/welcome?error=billing_off');
  await page.getByText('Payments are not switched on for this site yet. Nothing was charged.').waitFor();
  step('hero CTA opens the builder; Subscribe to Pro reaches checkout and reports billing is off (no Stripe keys here)');

  // 11. Keyboard: first Tab lands on the skip link
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Skip to content');
  step('first Tab reaches the skip link');

  // 12. One section per screen at 1440x900, and the pinned steps hold four screens
  const heights = await page.evaluate(() => [...document.querySelectorAll('main > section')].map((s) => [s.id || 'hero', Math.round(s.getBoundingClientRect().height)]));
  for (const [id, height] of heights) assert.equal(height, id === 'how' ? 3600 : 900, `section ${id} is ${height}px tall`);
  step('every section is exactly one screen tall, the pinned steps four');

  // 13. The pinned steps advance with the scroll and can be reached by clicking
  const how = page.locator('#how');
  await how.scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: /Replay the proof/ }).click();
  await page.waitForFunction(() => document.querySelector('#how button[aria-current="step"]')?.textContent?.includes('Replay the proof'));
  await page.locator('#how').getByText('Harness is intact.').first().waitFor();
  step('clicking step 04 scrolls the pinned section to it and shows the doctor output');

  // 14. The tagline wakes up word by word as it is scrolled through
  const lit = () => page.locator('#shift .word[data-on]').count();
  const shiftTop = await page.evaluate(() => document.querySelector('#shift').getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => window.scrollTo(0, y), shiftTop - 700); // the section is only just entering the screen
  await page.waitForTimeout(600);
  const entering = await lit();
  await page.evaluate((y) => window.scrollTo(0, y), shiftTop); // the section fills the screen
  await page.waitForFunction((n) => document.querySelectorAll('#shift .word[data-on]').length > n, entering);
  const filling = await lit();
  await page.evaluate((y) => window.scrollTo(0, y), shiftTop + 500); // it is leaving through the top
  await page.waitForFunction((n) => document.querySelectorAll('#shift .word[data-on]').length > n, filling);
  const total = await page.locator('#shift .word').count();
  assert.equal(await lit(), total);
  assert.ok(entering < filling && filling < total, `expected words to light up in order, got ${entering}, ${filling}, ${total}`);
  step(`tagline lights up word by word: ${entering}, then ${filling}, then all ${total}`);

  // 15. Phone: the menu opens as a panel, closes on Escape, and the primary action is on the first screen
  const phone = await context.newPage();
  await phone.setViewportSize({ width: 390, height: 844 });
  await phone.goto(BASE + '/', { waitUntil: 'networkidle' });
  const cta = await phone.locator('main').getByRole('link', { name: 'Get Harnay' }).first().boundingBox();
  assert.ok(cta && cta.y + cta.height < 844, 'primary action is below the first phone screen');
  await phone.getByRole('button', { name: 'Open menu' }).click();
  await phone.locator('#mobile-menu').getByRole('link', { name: 'Pricing' }).waitFor();
  await phone.keyboard.press('Escape');
  await phone.locator('#mobile-menu').waitFor({ state: 'detached' });
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), 0);
  step('phone: primary action on the first screen, menu opens and closes, no sideways scroll');

  // 16. Legal pages exist and are linked from the footer
  for (const name of ['Terms', 'Privacy']) {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.locator('footer').getByRole('link', { name }).click();
    await page.getByRole('heading', { level: 1, name }).waitFor();
  }
  step('Terms and Privacy open from the footer');

  assert.deepEqual(errors.filter((e) => !e.includes('net::ERR_FAILED')), []);
  step('no console errors');
  await browser.close();
})().catch((e) => { console.error('FAILED', e.message); process.exit(1); });
