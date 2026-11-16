---
name: design-taste
description: Make interface decisions on purpose instead of shipping the default AI look. Use before building or restyling any page, screen or component, when filling in DESIGN.md, and when the user says the UI looks generic, bland, "AI-generated" or like a template.
---

# Design taste

A model left alone produces the same page every time. This skill replaces defaults with decisions.

## The default look, which you refuse

Unless DESIGN.md asks for one of these by name, do not ship it:

- purple-to-blue or indigo gradients, gradient text, glowing blobs
- glass cards, blur for decoration, shadows on everything
- a row of three identical cards, each with an icon on top
- emoji used as icons
- a small pill or all-caps label above every heading
- a hero with a centred headline, a centred paragraph and two centred buttons, then centred everything else
- big made-up numbers ("10x faster", "99.9%"), invented testimonials, a wall of logos nobody approved
- a drawn browser window or a fake dashboard instead of the real product
- the component library exactly as it comes out of the box

## Decide before you build

1. Read DESIGN.md. If it has placeholders, propose values and get the user's yes.
2. The idea comes from this product. List things only this product has (its data, its vocabulary, its real screens). Pick one and make it the visual device. If a competitor could use the same idea, pick another.
3. Tokens first: one background, one text colour, one accent that lives on the main action. One type family. One spacing scale. Write them down as variables and use nothing else.
4. Real words before layout. Write the actual headline, the actual labels, the actual numbers. If you do not have real content, ask for it or leave a clearly marked gap. Never invent proof.
5. One memorable thing per page. Everything else stays quiet so that it can be seen.

## Craft floor

- Two or three text sizes on a screen. Headline large enough to be the first thing read.
- Body text 16 to 18px, line height about 1.5, lines no longer than 70 characters, in the full text colour, not grey.
- More space between sections than inside them. Align to one grid.
- Left-align by default. Centre at most one moment.
- Neighbouring sections do not share a layout.
- Dark mode is designed, not inverted.

## Look at it

Code that reads well can still look wrong. Take screenshots at 1440, 768 and 390 pixels wide. Write down the three worst things you see. Fix them. Do this at most three times, then show the user.
