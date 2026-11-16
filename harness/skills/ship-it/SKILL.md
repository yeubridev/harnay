---
name: ship-it
description: Prepare finished work as a pull request someone can review quickly and roll back safely. Use when the user says "ship it", "open a PR", "commit this" or "ready to merge", and at the end of any task that changed code.
---

# Ship it

## 1. Shape the change

- One purpose per pull request. A refactor and a feature are two pull requests.
- Around 300 changed lines is comfortable to review. Much more: split it by step or by slice.
- Remove what does not belong: debug output, commented-out code, stray TODOs, unrelated formatting.

## 2. Prove it

Bring the branch up to date with the default branch first, then run the full `verify-before-done` gate. Evidence from before the merge does not count.

## 3. Read your own diff

`git diff <default-branch>...HEAD`, top to bottom, as if someone else wrote it. Look for leftovers, secrets, files that should not be there, and anything the description would not explain.

## 4. Commit

- Small commits that each build and pass.
- Message: what changed and why, in the imperative, under 72 characters for the first line.
- Never `--no-verify`. If a hook fails, fix what it reports.

## 5. Describe

```
## What and why
<Two or three sentences. Link the issue.>

## How it was tested
<Commands and their result lines. Screenshots for UI.>

## Risk
<What could break, who would notice.>

## Rollback
<Revert this PR / turn off flag X / run migration Y down.>
```

## 6. Stop at the door

Open the pull request as a draft and tell the user. Merging, deploying, publishing and running migrations on a remote database are theirs to do.
