# harnay

Put your coding agent in a harness. One command installs working rules, permission rules and a guard hook for Claude Code (Cursor in beta) that checks every command and file access before it runs.

```bash
npx harnay@latest init
```

It lists every file it will write and waits for your yes. Everything it installs is plain text in your repo. Pick a stack and packs, and read every file first, at https://harnay.dev/new.

## What the guard stops

Database resets (`prisma migrate reset`, `supabase db reset --linked`, `DROP TABLE` through psql), reading or uploading `.env` files and keys, force-pushes to main, `curl | sh`, deleting outside the project, live API keys written into source, a server secret behind `NEXT_PUBLIC_`, and attempts to edit the guard itself. Deploys, publishes and `git reset --hard` come back to you as a prompt.

33 rules, 726 examples. Each rule carries the commands it must block, ask about and leave alone, and they replay on your machine:

```bash
npx harnay doctor
```

## Commands

| Command | What it does |
| --- | --- |
| `npx harnay init [stack]` | Install. `--agents claude,cursor,codex`, `--packs quality,design,ship`, `--dry-run`, `--yes` |
| `npx harnay audit` | In any folder: what could an agent do here right now? Read-only. |
| `npx harnay doctor` | Is the harness intact, and does the guard still block? Exit 1 on failure, for CI. |
| `npx harnay sync` | Update to the current rules. Files you changed are left alone unless `--force`. |
| `npx harnay login <key>` | Remember a Pro license key on this machine. |

## What it is not

A sandbox. The guard reads the command the agent is about to run. It cannot see inside a program it did not see being written. Turn on Claude Code's sandbox as well if you want operating-system isolation. Full list of limits: https://harnay.dev/docs#limits

## Safety of this CLI

No dependencies. It writes only to `AGENTS.md`, `CLAUDE.md`, `PROJECT.md`, `DESIGN.md`, `.claude/`, `.cursor/hooks*`, `.agents/skills/`, `harnay.json` and `.gitignore`, refuses paths that leave the project or pass through a symlink, and backs up anything it replaces to `.harnay/backup/`. It uploads nothing.

MIT license.
