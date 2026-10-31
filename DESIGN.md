# Design: Mixtape

Spark Love is a tape two people record together. You are **side A**, your partner is **side B**. The reveal (your partner's answer only plays once you've recorded yours) is the flip of the tape.

The world lends type, palette, density and one signature move. Controls stay standard.

## Palette (`src/ui/theme.ts`)

Two palettes with the same tokens. Light is the J-card on a table; dark is the same tape under a desk lamp at night: dark stock, cream print, inks lifted so they keep contrast.

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | `#F1EADB` | `#15120E` | J-card stock |
| `surface` | `#F9F5EC` | `#1F1B16` | Cards, inputs |
| `surfaceMuted` | `#E7DFCD` | `#2A251F` | Pressed state, art blocks, tracks |
| `border` | `#D3C8B2` | `#3B342B` | Hairlines, the only elevation |
| `text` / `primary` | `#1B1814` | `#EFE7D6` | Ink; primary buttons are ink |
| `sideA` | `#C2381F` | `#EE6446` | You (vermilion) |
| `sideB` | `#2340A0` | `#86A0EE` | Your partner (blue) |
| `onSide` | `#F9F5EC` | `#15120E` | Letters and icons on a side colour |
| `marigold` | `#E3A13A` | `#E3A13A` | Stripe only |

**Theming.** `ThemeProvider` follows the system appearance; Profile → Appearance can force Light or Dark (stored locally). Components read colours through `useTheme()` or `makeStyles((colors) => …)`, never a hard-coded hex.

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
- Text on a side colour uses `onSide`, not `onPrimary` (they differ in dark).
