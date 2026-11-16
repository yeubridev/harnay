---
name: verify-before-done
description: Run the checks that prove the work and quote their output before claiming anything is done, fixed or passing. Use at the end of every task, before a commit, before opening a pull request, and whenever you are about to write "done", "fixed", "works" or "should".
---

# Verify before done

A claim without a fresh command behind it is a guess. The user cannot tell your guesses from your facts unless you show the evidence.

## The gate

Before you say the work is finished:

1. Name the commands that would prove it. Use the ones in PROJECT.md and AGENTS.md: tests, type-check, lint, build. For a UI change, load the page and look at it. For an API change, call the endpoint.
2. Run them now, in full. A run from before your last edit does not count. A run of one test file does not count for "all tests pass".
3. Read the exit code and the output, including warnings. Zero tests run is a failure.
4. Quote the last lines of each command in your reply.

## If something fails

Fix it or report it. Never weaken the check: no skipped tests, no suppression comments, no lowered thresholds, no deleting the assertion.

## If you could not verify

Say exactly that: what was not run, why, and the command the user can run. "I could not start the dev server here, so the page is untested" is a good sentence. "Should work now" is not.

## Words that need evidence

should, probably, seems, I believe, likely fixed, looks good. When one of them shows up in your draft, either run the command that turns it into a fact or state it as unverified.

## Report

```
Changed:    <files, one line each>
Verified:   <command> -> <result line>
Not done:   <anything left, or "nothing">
```
