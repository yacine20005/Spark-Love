# Spark Love

A small, private app for two. Answer quizzes on your own and compare once you've both finished, swipe movies and date ideas until you match, keep a shared journal of notes and photos, and answer one "spark" question a day.

Built with Expo (React Native, iOS, Android and web) and Supabase (Postgres, Auth, Storage).

## Features

- **Pairing**: one person creates a 6-character code, the other enters it. One couple per account. Unlinking deletes everything the two of you shared.
- **Quizzes**: 10 categories × 10 questions (multiple choice, yes/no, 0-10 scale, free text). Answers stay private until **both** partners finish a category. This is enforced in the database, not the UI. The results then show the answers side by side with an agreement score.
- **Match**: swipe through 30 movies and 30 date ideas. When you both like the same one, it's a match.
- **Journal**: shared notes and photos (private bucket, signed URLs).
- **Daily spark**: one question a day, the same for both of you. You see your partner's answer after you've answered.
- **Profile**: name, anniversary (drives the "day N" counter), unlink, sign out, delete account.

## Scripts

| Script | What it does |
| --- | --- |
| `bun run web` / `ios` / `android` | Start Expo |
| `bun run build:web` | Export static web PWA to `dist/` (`EXPO_PUBLIC_BASE_URL` sets a subpath) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test` | Unit tests (pure logic in `src/lib`) |
| `bun run db:test` | pgTAP tests for RLS and RPCs (`supabase/tests`) |
| `bun run db:reset` | Recreate the local DB from migrations + seed |
| `bun run db:types` | Regenerate `src/lib/database.types.ts` from the local DB |
| `bun run doctor` | `expo-doctor` |

## Architecture

```
supabase/
  migrations/      schema, RLS, RPCs, storage policies (the whole backend)
  seed.sql         quiz categories, 100 questions, 60 swipe items
  tests/           pgTAP
  templates/       OTP email
public/            PWA shell: index.html, manifest, service worker, icons
src/
  api/             thin typed wrappers around supabase-js
  context/         session + household (me, couple, partner)
  lib/             supabase client, generated DB types, pure helpers (+ tests)
  navigation/      root stack + tabs, gated by session → name → app
  screens/         one file per screen
  ui/              Mixtape design system: light/dark tokens, ThemeProvider, primitives (see DESIGN.md)
```


## Roadmap

- Sign in with Apple. Required by the App Store when Google sign-in is offered.
- Push notifications ("Alice answered today's spark", new match).
- Realtime updates instead of reload-on-focus and invite polling.
- Remove storage objects when a couple or account is deleted (the DB rows already cascade).
- Localisation (FR first).
