---
name: debug-root-cause
description: Find why a bug happens before changing code to fix it. Use for any failing test, error, crash, wrong output, flaky behaviour or "it used to work" report, and whenever a first fix did not hold.
---

# Debug to the root cause

Fixing the first suspicious line is how one bug becomes three.

## 1. Reproduce

Get a single command that shows the failure every time: a failing test is best, then a curl call, then a script. Until you can make it fail on demand you are not debugging, you are guessing. If it is flaky, find what varies (order, time, data, concurrency) and pin it.

## 2. Read the error

All of it. The first error in the log, the full stack, the exact values. Most bugs say where they are.

## 3. One hypothesis at a time

Write it down in a sentence: "The token is expired because the clock is read in local time." Next to it, write what you would see if it were true. Then check that one thing. Change nothing else.

## 4. Narrow it

- It worked before: `git bisect` between a good and a bad commit.
- Big input: halve it until the failure disappears.
- Long path: log the value at the midpoint and see which half is wrong.

## 5. Fix where it starts

Fix the cause, not the place the symptom showed up. Then search for other callers and copies of the same mistake.

## 6. Lock it in

Add a test that fails without the fix. Run the full suite.

## Do not

- Change several things at once. You will not know which one mattered.
- Wrap the failure in a try/catch, a retry or a default value to make it quiet.
- Mark a test flaky and move on.

## Three strikes

If three fixes have failed, stop editing. Your model of the problem is wrong. Tell the user what you tried, what each attempt ruled out, and what you would look at next.
