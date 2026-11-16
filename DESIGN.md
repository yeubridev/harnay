# Design

## The idea

On this site, the guard's verdicts are the page. The hero is a real agent session in which each command is judged by the rules file the product installs, computed at build time. A competitor cannot show it without having the product.

The brand object is the strap: hazard-striped webbing, yellow and ink. It appears in three places only: the mark, the top edge of the session replay, and the scroll strap beside "What one command puts in your repo".

## Principles

1. Show the product deciding, not a picture of it.
2. Daylight. One light theme, and terminals are light too.
3. Boldness goes into type and one yellow. Everything else stays quiet.

## Colour

| Token | Hex | Role | Contrast |
| --- | --- | --- | --- |
| `--chalk` | `#f1f2ee` | ground | |
| `--chalk-2` | `#e5e7e0` | raised surface, one tone step, no shadow | |
| `--chalk-3` | `#d5d8cf` | pressed surface, rules inside a surface | |
| `--ink` | `#14171a` | text, borders | 16.0 on chalk, 14.4 on chalk-2 |
| `--ink-2` | `#474c54` | captions and prompts only, never body text | 7.7 on chalk |
| `--signal` | `#ffd60a` | the action, and "asks you" | ink on signal 12.7 |
| `--stop` | `#b42318` | blocked | 5.9 on chalk, 5.3 on chalk-2 |
| `--go` | `#17663a` | runs | 6.2 on chalk, 5.6 on chalk-2 |

Signal on chalk is 1.3:1. Yellow is never text and never a thin line on the ground: it is a fill with an ink border or ink text on top.

Surfaces are separated by a tone step. No shadows, no hairlines between sections.

## Type

- One family: Archivo variable (weight and width axes), self-hosted. JetBrains Mono for code, file names and rule ids only.
- Display (`.display`): width 68%, weight 800, tracking -0.015em, leading 0.94, sentence case.
- Sizes: hero `clamp(3.25rem, 8.2vw, 6rem)`, section `clamp(2.5rem, 5.4vw, 4.25rem)`, sub-heading 1.75 to 2rem, body 1.125rem / 1.5, small 0.9375rem.
- Left-aligned everywhere. Headings use `text-wrap: balance`.

## Space and shape

- Container 76rem, side padding 1.25rem (2rem from 48rem).
- Sections: 6rem top and bottom on phones, 9rem from 48rem.
- Radius: 10px on panels, 6px on controls, 4px on chips.
- Borders are 2px ink and mean "you can act on this" (buttons, inputs, the Pro plan).

## Components

- Button: yellow fill, 2px ink border, ink text, 48px tall. Hover inverts to ink with yellow text. `button-quiet` is the same without the fill. One primary action per view.
- Copy command: the product's main control. Prompt glyph, the command, a yellow Copy button that answers "Copied".
- Verdict chip: Blocked (stop fill), Asks you (signal fill, ink border), Runs (go outline).
- Choice row (builder): native radio or checkbox, 56px row, chalk-3 when selected.

Every control has default, hover, focus, active and disabled states. Views that load data have loading, error and empty states (see the builder's file preview).

## Motion

- Easing `cubic-bezier(0.23, 1, 0.32, 1)`. Nothing over 600ms. Transform and opacity only.
- Session replay: lines arrive 1.15s apart, verdicts land 420ms after their command. Plays when it enters the viewport. Replay button.
- Scroll reveal: 24px rise and fade, 600ms, 70ms stagger, once per element.
- The strap fills as you read down the five layers, and the file tree highlights the files of the current layer. This is the one authored scroll moment.
- Presses scale to 0.97. Hover effects only for fine pointers.
- `prefers-reduced-motion`: no reveals, no replay animation, strap shown full. All content is visible without JavaScript.

## Voice

Plain and specific. Name the command, the file, the number. Say what it does not do. No exclamation marks, no "unlock", no "seamless". Climbing words are used once ("Clip in before the next prompt"), not as a theme.

## Never

Gradients, glass, shadows on resting elements, emoji as icons, a label above every heading, a row of identical icon cards, centred hero, dark "terminal" blocks, invented numbers, testimonials or logos.

## Checks before shipping UI

Screenshots at 1440, 768 and 390. No horizontal scroll. Hero fits 1280x800. Keyboard reaches everything in order, first Tab is "Skip to content". `node tests/e2e/flow.cjs` passes.
