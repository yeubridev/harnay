---
name: test-first
description: Write a failing test before the code that makes it pass. Use when adding behaviour, changing behaviour or fixing a bug in code that has tests or should have them. Skip for styling, copy changes, config and throwaway spikes.
---

# Test first

One small loop, repeated. Each pass takes a few minutes.

1. Write one test for the next piece of behaviour. Go through the public interface: call the function, hit the endpoint, render the component. Name it after what the user or caller gets, for example "rejects an expired token".
2. Run it and watch it fail. Read the failure. It must fail because the behaviour is missing, not because of a typo or a bad import. Quote the failure line.
3. Write the least code that makes it pass.
4. Run the tests for that file, then the wider suite if the change reaches further.
5. Tidy up with the tests green. Behaviour changes and refactors go in separate steps.
6. Next behaviour, next test.

## Rules

- No production code without a failing test that asks for it. If you wrote the code first, set it aside, write the test, watch it fail, bring the code back.
- One test, one step. Do not write the whole test file up front.
- Do not mock code this project owns. Mock at the edges: network, clock, payment provider, email.
- An assertion that repeats the implementation proves nothing. `expect(add(a, b)).toBe(a + b)` is not a test.
- A test that never failed has not been checked. If it passed on the first run, break the code on purpose and confirm the test notices.

## Bug fixes

Write the test that reproduces the bug first. Confirm it fails on the current code. Fix the bug. Confirm it passes. That test stays.

## When the code is hard to test

That is information about the design. Say so, propose the smallest seam that would make it testable (pass the dependency in, split the pure part from the I/O), and ask before a larger restructure.
