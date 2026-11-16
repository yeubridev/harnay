# Harnay

Put your coding agent in a harness. One command installs working rules, permission rules and a guard hook for Claude Code that checks every command and file access before it runs.

This repository holds everything: the site (harnay.dev), the harness templates, and the `harnay` CLI.

## Map

| Path | What it is |
| --- | --- |
| `harness/` | The product. Templates the generator assembles into a harness. |
| `harness/guard/` | The guard hook: `guard.mjs` (entry), `guard-rules.mjs` (33 rules and their 726 examples), `guard-shell.mjs` (command reader). No dependencies. |
| `harness/catalog.json` | Stacks, packs and agents, and which are free. Also the harness version. |
| `harness/rules/`, `skills/`, `agents/`, `base/` | Rule sections per stack and pack, skills, reviewers, and the base files. |
| `lib/harness/` | Catalog parsing, the generator, the pre-purchase preview. |
| `lib/license.ts`, `lib/stripe.ts` | Stateless license keys checked against Stripe. No database. |
| `app/` | Landing (`/`), builder (`/new`), docs, welcome, account, and the API. |
| `cli/` | The `harnay` npm package: init, audit, doctor, sync, login. |
| `scripts/guard-data.mjs` | Runs the guard and writes `lib/guard-data.json`, the only source of guard facts on the site. |
| `PRODUCT.md`, `DESIGN.md` | Who it is for and how it looks: tokens, named text styles, the buckle mark, motion. Read before changing copy or UI. |
| `docs/gtm.md` | Verdict, positioning, pricing and the 30-day plan (in French). |

## Run it

```bash
npm install
```

```bash
npm run dev
```

Install a harness from your local server into a scratch folder:

```bash
mkdir /tmp/try && cd /tmp/try && git init && HARNAY_API=http://localhost:3000 node /path/to/harnay/cli/bin/harnay.mjs init
```

To try Pro content locally, set `HARNAY_LICENSE_SECRET` in `.env.local` (see `.env.example`). Without Stripe keys a correctly signed key is accepted, which is what the tests use.

## Check it

```bash
npm test
```

```bash
npm run lint && npm run typecheck && npm run build
```

`npm test` runs the web tests (vitest) and the CLI tests (node:test). The browser flow needs Playwright and a running build:

```bash
node tests/e2e/flow.cjs
```

## How a harness is put together

`generate(config)` in `lib/harness/generate.ts` reads `harness/` and returns a list of `{ path, content, owner, pro }`. `owner: "you"` files (PROJECT.md, DESIGN.md) are written once and never synced. The API (`/api/harness`) serves that list, the builder previews it, and the CLI writes it after checking every path.

To add a guard rule, add an object to `guard-rules.mjs` with `deny`, `ask` and `allow` examples. The self-test fails if an example is caught by a different rule or not at all, and the `everyday` list fails if ordinary commands get stopped. Then:

```bash
npm run guard:data
```

To add a stack, add an entry to `harness/catalog.json` and a `harness/rules/<id>.md`. Bump `version` in the catalog when shipped content changes, so `harnay sync` users see it.

## Go live

1. **npm.** The name `harnay` was free on 2026-11-16. Publish before announcing anything:

   ```bash
   cd cli && npm publish --access public
   ```

2. **Stripe.** Create two recurring prices, Pro at $19 a month and Team at $79 a month. Switch on the customer portal (Settings, Billing, Customer portal) with cancellation allowed.
3. **Deploy.** Import the repo in Vercel and set the variables from `.env.example`: `NEXT_PUBLIC_SITE_URL`, `HARNAY_LICENSE_SECRET` (`openssl rand -base64 48`), `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_TEAM`. Point harnay.dev at it.
4. **Buy it yourself.** Go through checkout with a real card, confirm the key on `/welcome`, run `npx harnay login <key>` and a Pro `init`, open `/account`, cancel, refund.
5. **Rate limit.** Add a Vercel firewall rule on `/api/*`. The app has none.
6. **Numbers.** Turn on Vercel Web Analytics. `GET /api/harness` answering 200 is an install. Answering 402 is someone who wanted Pro and had no key: your best intent signal.

## What has been verified, and what has not

Verified here, on the production build:

- 59 web tests and 23 CLI tests pass. Lint, type-check and build are clean.
- The guard's 726 examples behave as written.
- A free and a Pro install through the real CLI against the real server, then `doctor`, both green.
- In real Claude Code 2.1.325, the installed harness blocked `cat .env` (guard hook), a Read of `.env` (permission rule) and `git push --force origin main` (guard hook), and the `project-brief` skill was discovered.
- In a browser (`tests/e2e/flow.cjs`): the builder, shared links, error and retry, copy, the checkout redirect, one section per screen at 1440 by 900, the pinned steps, the word by word tagline, the phone menu, and the legal pages.

Not verified:

- Checkout, the welcome page with a real session, and the portal against live Stripe. The code type-checks against the Stripe SDK and degrades cleanly without keys, but no real payment has gone through it. Step 4 above closes this.
- The Cursor adapter inside Cursor. It follows Cursor's documented hook contract and is labelled beta everywhere.
- Windows. The guard has PowerShell rules and the CLI uses no shell, but nothing was run on Windows.
- tasteskill's browser checker on the landing page. Its text linter passes with no FAIL; the browser part needs a Chrome that this build machine would only start without its sandbox.
- `/terms` and `/privacy` are plain drafts written from what the product does. Have them read by someone qualified, and add your legal entity and a contact address, before taking payments.

## Known gaps

- No email capture, so free users cannot be told about updates. The cheapest fix is a newsletter form on `/welcome` and `/docs`.
- No rate limiting in the app (see step 5).
- License keys can be shared. Accepted for now.
- Guard copy is duplicated in `.claude/hooks` and `.cursor/hooks` when both agents are selected.
