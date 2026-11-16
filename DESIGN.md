# Design

The system follows two outside rule sets the founder chose, plus one reference:

- `landing-page-design` from elayadesign/ai-design-skills: page structure, the type scale and named text styles, the spacing scale, flat backgrounds, the floating nav, the motion curve, the tagline reveal.
- tasteskill (Leonxlnx/taste-skill): one section per screen, equal edges, the product's own interface as live text, a hero that enters once, one or two authored moments, plain copy.
- gigi.co as inspiration for pacing only: a dark page, one statement per screen, a pinned "how it works" with numbered steps beside a live frame, one trust panel, a centred close under the mark. No code, copy, pictures or signature effect were taken from it.

Where they disagree, this file says which one won and why.

## The idea

The page shows the product deciding. The hero is a real agent session in which each command is judged by the rules file the product installs, computed at build time. Every terminal on the page prints what the CLI really prints.

## The mark

A buckle: a closed rounded frame and a prong hinged on its left bar, the tip resting past the right bar. One shape, two strokes, drawn in the current text colour (`components/logo.tsx`).

- On the dark ground it is signal yellow. On yellow (favicon, app icon) it is ink.
- It sits left of the lowercase wordmark at the height of the letters' line box.
- It appears large once, above the closing line, where the prong slides home as it scrolls into view.
- Never outlined, tilted, given a gradient, or redrawn with a gap in the frame (a gap reads as a letter, not a buckle).

## Colour

| Token | Hex | Role | Contrast |
| --- | --- | --- | --- |
| `--ground` | `#131209` | page | |
| `--panel` | `#1f1f1f` | raised surface | |
| `--panel-2` | `#272727` | surface inside a surface, hover, selected | |
| `--well` | `#000000` | terminals and code | |
| `--line` | `#313131` | borders | |
| `--fg` | `#f5f5f0` | text | 17.2 on ground, 15.1 on panel |
| `--muted` | `#a3a39b` | secondary text | 7.4 on ground, 6.5 on panel, 5.9 on panel-2 |
| `--signal` | `#ffd60a` | the action, the mark, "asks you" | ground on signal 13.3 |
| `--stop` | `#ff6b5c` | blocked | 6.7 on ground, 5.9 on panel |
| `--go` | `#4ade80` | runs | 9.5 on panel |

Backgrounds are flat and come from the approved dark list. The only gradient on the site is on the hero heading's text, white to `#9b9b9b`, left to right. Borders go all the way round or not at all.

Yellow is for one thing per view: the action. The Pro plan's border and the active step number are the two other uses.

## Type

One typeface, Geist, at weights 400, 500 and 600. Geist Mono only for commands, file names, rule ids and terminal text. No italics, nothing above semibold.

Every piece of text uses a named style from `app/globals.css`. Sizes land on Tailwind's scale and are never set ad hoc.

| Style | Size / line | Weight | Used for |
| --- | --- | --- | --- |
| `heading-1` | 60 / 60 (48, 36 on smaller screens) | 600 | hero, closing line |
| `heading-2` | 48 / 48 (36, 30) | 600 | section headings, page titles, prices |
| `heading-3` to `heading-6` | 36 to 20 | 600 | sub-headings, step titles, form legends |
| `title-1` to `title-5` | 20 to 12 | 500 | card titles, nav, labels that lead a block |
| `body-1` to `body-6` | 16 and 14 | 600 to 400 | running text |
| `body-7`, `body-8` | 18 / 28, 20 / 28 | 400 | lead paragraph under a heading (added, on scale steps) |
| `button-lg` to `button-xsm` | 18 to 12 | 600 | text inside buttons |
| `caption-1` to `caption-5` | 14 and 12 | 500 to 400 | metadata, helper text, chips, fine print |

Hero heading and sub-heading are capped at 680px and broken where the thought breaks. Headings use `text-wrap: balance`, body copy `pretty`. Sentence case everywhere.

## Space, shape, layout

- Spacing uses only 0, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80 and 96 px.
- Radius uses Tailwind's steps. A shape inside another, less than 32px from its edge, takes the outer radius minus the gap: a 16px panel with 8px padding holds an 8px well.
- `.wrap` is 72rem wide with 16px side padding, 32px from 768px. Left and right content edges are equal on every section.
- `.screen`: each landing section is at least one viewport tall with its content centred. At 1440 by 900 every section is exactly one screen and the pinned steps hold four. On smaller screens a section grows with what it holds.

## Components

- **Button** (`.btn`): 8px by 12px padding, 12px radius, `button-md` text. Primary is yellow with ink text, secondary is `panel-2` with a border. It steps up 1px on hover and presses down on click. A transparent margin gives the finger 48px without changing the visual size. Header buttons use `btn-sm`.
- **Nav**: a compact bar floating 12px off the top edge, centred, sized to its content, translucent over a blur. On a phone it opens a full height panel whose links arrive one after another.
- **Terminal**: a panel, an 8px gap, a black well. The product's interface as live text, never a picture of it. No caption underneath.
- **Copy command**: prompt glyph, command, a Copy button that answers "Copied".
- **Chip**: Blocked (stop fill), Asks you (signal fill), Runs (go outline), plain (line outline).
- **Icons**: Phosphor, bold weight, in the trust panel and the copy button.

Every control has hover, active, focus and disabled states. The builder's preview has loading and error states.

## Motion

One curve, `cubic-bezier(0.22, 1, 0.36, 1)`. 500ms for position, 300ms for colour. Transform and opacity only.

- The hero enters once on load.
- Each section rises 32px and fades in once, as a whole. Cards inside it do not animate separately.
- **Moment one, the tagline:** the sentence starts at 30% and each word wakes in reading order as the block crosses the screen.
- **Moment two, the pinned steps:** on a desktop the section holds the screen for four screens while the steps advance and the terminal plays each one. Phones, reduced motion and pages without script get the four steps stacked.
- The closing buckle fastens as it enters (CSS view timeline; closed already where that is unsupported).
- Reduced motion: nothing moves and nothing stays hidden. Without JavaScript all content is visible.

## Voice

Plain and specific. The h1 names the category and who it is for. One hard fact on the first screen. Every heading names a thing. Buttons are a verb and what you get, and the main action reads "Get Harnay" in the nav, the hero and the close. No hyphens in running copy, no exclamation marks, no invented proof. One figure of speech on the page: "Clip in before the next prompt."

## Where the rule sets disagreed

- **Scroll reveals.** tasteskill forbids fading in every section; the landing skill prescribes it. The founder asked for a page that reveals on scroll, so sections reveal once as whole blocks, and cards never animate on their own.
- **Button height.** The landing skill's padding gives 40px buttons; tasteskill asks for 44px targets. The visual stays 40px and an invisible margin makes the target 48px.
- **Type size.** Gigi's display type is far larger than the landing skill's 60px ceiling. The skill's scale won.
- **Step numbers.** tasteskill's copy linter warns about eight step numbers. There are four; they appear twice in the markup because the stacked and pinned layouts both exist and CSS shows one.

## Checks before shipping UI

`node tests/e2e/flow.cjs` (sections are one screen tall, the moments work, the phone menu, no sideways scroll, no console errors). Screenshots at 1440, 1024, 768 and 390. tasteskill's `copy-lint.mjs` on the rendered HTML: 0 FAIL. Its browser checker has not been run on this page.
