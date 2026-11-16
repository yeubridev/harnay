# Product

## What Harnay is

Harnay installs a harness around a coding agent: working rules, permission rules, a guard hook that checks every tool call, and (in Pro) skills and reviewers. One command writes plain text files into the user's repo. Nothing runs in our cloud.

## Who it is for

A solo builder with a live product (typically Next.js, Supabase, Stripe) who runs Claude Code for hours a day, often on auto-accept. They have had one scare: the agent reset a database, printed a key or force-pushed. Many are not career engineers and do not know what a hook is.

Second audience: teams of 2 to 10 and agencies who want the same setup in every repo and a CI check that fails when someone disables it.

## Positioning

Harnay helps people who ship real products with Claude Code keep the agent off their secrets, their database and their main branch, by installing a tested guard hook, permission rules and working rules in one command.

- The alternative is nothing (a CLAUDE.md and hope), a free mega-repo of hundreds of files, or a weekend writing hooks.
- What only we do: enforcement first. A guard that parses the command line, with every rule carrying examples that replay on the user's machine.
- Small on purpose: a 66-line rules file and 9 skills, not 300.
- Honest about limits. The landing page has a "What it does not do" section, and it stays.

## Surfaces and modes

| Surface | Mode | What it must do |
| --- | --- | --- |
| `/` landing | Persuade | Say what it is in five seconds, show the guard working, get the command copied. |
| `/new` builder | Operate | Choose stack, agents, packs. Show every file. Hand over one command. |
| `/docs` | Read | The map: commands, files, every rule, limits. |
| `/welcome`, `/account` | Operate | Deliver the license key. Open Stripe's portal. |
| `/terms`, `/privacy` | Read | Say plainly what is promised and what is collected. |
| `npx harnay` CLI | Operate | init, audit, doctor, sync, login. Show the plan, wait for yes, never write outside the harness. |
| The installed harness | Operate | Read by agents. Short, specific, no filler. |

## What is free, what is paid

- Free for good: the guard, permission rules, AGENTS.md and CLAUDE.md, the project brief skill, `audit`, `doctor`, `sync`.
- Pro, $19 a month: stack templates, the Quality, Design and Ship packs (8 skills, 3 reviewers), updates.
- Team, $79 a month: Pro for up to 10 developers on one key.

The reason to keep paying is that the harness stays current: formats change, new failure patterns appear, `npx harnay sync` brings the fix.

## Not doing

- Accounts, dashboards, a database on our side. Stripe is the only record of who pays.
- An LLM in the loop. Generation is deterministic and costs nothing to serve.
- Enforcement on Codex. It has no hook.
- Pretending the guard is a sandbox.

## Rules for anything we publish

- Every number on the site is computed from the product (`lib/guard-data.json`, the generator). No hand-typed stats.
- No invented testimonials, logos or usage counts. Incidents are cited with a link.
- A claim about Claude Code behaviour links to, or quotes, Claude Code's documentation.
