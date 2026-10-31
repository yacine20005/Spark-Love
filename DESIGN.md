# Design: Mixtape

Spark Love is a tape two people record together. You are **side A**, your partner is **side B**. The reveal (your partner's answer only plays once you've recorded yours) is the flip of the tape.

The world lends type, palette, density and one signature move. Controls stay standard.

## Palette (`src/ui/theme.ts`)

| Token | Hex | Use |
|---|---|---|
| `background` | `#F1EADB` | J-card paper |
| `surface` | `#F9F5EC` | Cards, inputs |
| `surfaceMuted` | `#E7DFCD` | Pressed state, art blocks |
| `border` | `#D3C8B2` | Hairlines, the only elevation |
| `text` / `primary` | `#1B1814` | Ink; primary buttons are ink |
| `sideA` | `#C2381F` | You (vermilion) |
| `sideB` | `#2340A0` | Your partner (blue) |
| `marigold` | `#E3A13A` | Stripe only |

**Colour quarantine:** colour belongs to sides, the stripe and photos. Everything else is ink on paper. Never use `sideA`/`sideB` decoratively: red always means *you*, blue always means *them*.

## Type

- **Barlow Condensed** 600/700, uppercase: `display`, `title`, `tag`, `counter` (tabular).
- **Barlow** 400/500/600: `heading`, `body`, `label`, `caption`.

## Components (`src/ui/Mixtape.tsx`)

- `Stripe`: three bands (vermilion, marigold, blue) at the top of the panel that matters. One per screen at most.
- `Side`: A/B row with a square coloured letter. `locked` shows a dashed outlined mark. When a side goes from locked to unlocked, it flips (rotateX, 520 ms, exponential ease-out, skipped under Reduce Motion). This is the only signature animation.
- `Stamp`: rotated, bordered caps label for states ("Match", "Same", "Ready"). States get stamped onto items; nothing disappears.
- `TrackRow`: label, dotted leader, tabular value. Stats read like a tracklist.
- `SectionHead`: caps tag and a rule.
- `Avatar`: a square block in the side colour.

## Rules

- Elevation comes from a hairline border, never a shadow. Radius stays small (4–8).
- Don't nest cards: `Side` has no box of its own.
- Don't put an eyebrow or kicker above headings.
- Lists are ruled rows, not stacks of cards (Quizzes, Matches).
- Light appearance only, for now.
