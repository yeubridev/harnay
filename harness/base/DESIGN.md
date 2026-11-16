# Design

<!--
The agent reads this before it touches UI. Fill it in once, or type /design-taste in your agent
and let it propose values from your product, then correct them. Harnay never overwrites this file.
-->

## The idea

<One sentence: on this product, [something only this product has] becomes [the visual device].>

## Colour

| Token | Hex | Used for |
| --- | --- | --- |
| ground | <#> | page background |
| ink | <#> | text |
| accent | <#> | the primary action, nothing else |

## Type

- Family: <one family; a second only for code>
- Sizes: <display / heading / body / small>
- Body: 16 to 18px, line height 1.5, at most 70 characters per line

## Space and shape

- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96
- Radius: <one value per nesting level>
- Elevation: only things that float get a shadow

## Motion

- Easing: <one curve>, durations under 300ms, exits faster than entrances
- Always behind `prefers-reduced-motion`

## Never

- <The looks this product refuses. Start with: gradient text, glass cards, emoji as icons, identical three-card grids.>
