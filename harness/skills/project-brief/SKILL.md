---
name: project-brief
description: Interview the user and write PROJECT.md, the brief every agent reads before working. Use when PROJECT.md is missing or still has placeholders in angle brackets, when the user says "set up the project" or "project brief", or when the goal of the project changes.
---

# Project brief

PROJECT.md is the only file the user has to write. Your job is to make that take five minutes.

## Before you ask anything

Look things up yourself first:

1. Read PROJECT.md and note which sections still hold placeholders.
2. Read the repo: the manifest (package.json, pyproject.toml), README, folder layout, existing routes or screens, and the scripts that run, test and lint the project.
3. Write down what you already know. Do not ask the user for anything the repo answers.

## The interview

Ask one question at a time and wait for the answer. With each question, offer your best guess so the user can reply "yes" or correct you. Stop as soon as the sections are filled. Six questions is usually enough.

1. What are we building, in one sentence, and what problem does it remove?
2. Who is it for? Push for a person and a situation, not "everyone" or "small businesses".
3. What must work for this version to count as done? Ask for results a user can see.
4. What are we deliberately not building yet?
5. Constraints: deadline, hosting, budget, anything that must not change.
6. Any decision already made that you should not re-open (library, design, pricing)?

If an answer is vague, ask for an example once, then move on. Do not lecture and do not expand the scope.

## Write it

- Fill PROJECT.md in the user's own words. Keep it under one page.
- Put the real commands you found under Constraints (dev, test, lint, type-check).
- Delete placeholder text and the instruction comment at the top.
- Show the user the result and ask for corrections once.

Never put secrets, keys or customer data in PROJECT.md.
