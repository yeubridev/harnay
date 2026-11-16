# Agent rules

This project runs inside a Harnay harness. These rules apply to every coding agent that works here.
What we are building, for whom and under which constraints is in PROJECT.md. Read it before any task.

## How to work

1. Understand first. Read the files you will touch and the code that calls them before you edit. If the request is ambiguous and a wrong guess costs more than a question, ask one question.
2. Make the smallest change that fully solves the problem. No drive-by refactors, no options "for later", no new dependency for something the platform or an installed package already does.
3. Prove it. Before you say "done", "fixed" or "passing", run the command that proves it and quote the result. If you could not run it, say so.
4. Fix causes. Reproduce a bug before you fix it, fix it where it starts, and leave a test that fails without the fix.
5. Keep the bar. Never delete or skip a test, add a lint or type suppression, or lower a threshold to get green. If a check is wrong, explain why and ask.
6. Report plainly: what changed, what you verified and how, what is not finished.

## Boundaries

- Secrets: never read, print or write real credentials. Variable names go in `.env.example`. Values are the user's job.
- Deleting data, force-pushing, deploying, publishing and running migrations against a remote database are the user's call. Propose the command and stop.
- Stay inside this repository. Leave global config, shell startup files and other projects alone.
- Add a dependency only when you need it, through the package manager. Never hand-edit a lockfile.
- A guard checks every tool call before it runs. When it blocks one, read the reason, then take the safer route it names or tell the user. Do not reword the command to get past it.

{{sections}}

## Commands

{{commands}}

---
Managed by Harnay (https://harnay.dev). `npx harnay sync` updates this file, so put your own rules in PROJECT.md.
