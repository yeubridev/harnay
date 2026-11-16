---
name: ui-states
description: Give every interactive element all of its states and make it usable by keyboard and screen reader. Use when building or reviewing forms, buttons, lists, tables, dialogs, navigation and anything that loads data.
---

# UI states and access

Most broken interfaces are missing a state, not a feature.

## Every control

Check each one off: default, hover, keyboard focus (visible, never removed), pressed, disabled, loading, error, and empty or success.

## Every view that loads data

- Loading: a placeholder with the shape of the content, not a spinner in the middle of nothing.
- Empty: say what belongs here and offer the action that fills it.
- Error: say what happened and what to do next. Keep what the user typed.
- Partial: some rows failed, a slow connection, a very long name, zero and one and a thousand items.

## Forms

- A visible label on every field. A placeholder is not a label.
- Errors appear next to the field, in words, and are tied to it with `aria-describedby`.
- Validate when the user leaves a field or submits, not on every keystroke.
- The submit button says what it does: "Save changes", "Send invite". Disable it while the request is running and show that it is running.
- Never lose input on an error or a reload.

## Access

- Text contrast at least 4.5:1, large text and control outlines at least 3:1.
- Everything works with the keyboard alone, in reading order, including dialogs (focus goes in, stays in, comes back).
- Targets at least 44 by 44 pixels with space between them.
- Images that carry meaning have alt text. Icons used as buttons have a name.
- Motion respects `prefers-reduced-motion`.
- Do not use colour as the only signal.

## Words

Use the user's words for things. Sentence case. No apology in error messages, no exclamation marks, no "Oops".
