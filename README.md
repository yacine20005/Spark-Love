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

## Getting started

Requirements: [Bun](https://bun.sh), Docker (for local Supabase), and Xcode or Android Studio if you want native simulators.

```sh
bun install
bun run db:start          # local Supabase; applies the migration and seed
cp .env.example .env      # paste the "Publishable" key printed by db:start
bun run web               # or: bun run ios / bun run android / bun run start
```

Sign in with any email. In local dev, no real email is sent: open Mailpit at http://127.0.0.1:54324 to read the 6-digit code. To try the couple features alone, use two browser profiles (or one normal and one private window).

## Scripts

| Script | What it does |
| --- | --- |
| `bun run web` / `ios` / `android` | Start Expo |
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
src/
  api/             thin typed wrappers around supabase-js
  context/         session + household (me, couple, partner)
  lib/             supabase client, generated DB types, pure helpers (+ tests)
  navigation/      root stack + tabs, gated by session → name → app
  screens/         one file per screen
  ui/              theme tokens and a few primitives (Text, Button, Card, …)
```

Design rules worth keeping:

- **Privacy lives in Postgres.** Clients can only read their own `answers` and `swipes`. Partners see each other's data only through `security definer` RPCs (`compare_category`, `swipe`, `swipe_matches`) that decide what to reveal.
- **Couple membership only changes through RPCs** (`create_invite`, `join_couple`, `leave_couple`, `delete_account`). Column grants block clients from writing `profiles.couple_id`.
- **Content is data.** Questions, categories and swipe items live in the DB, so they can change without shipping a new app version. Icons are Ionicons glyph names.
- After changing the schema: add a new migration (`bunx supabase migration new <name>`), then run `db:reset`, `db:types` and `db:test`.

## Deploying

1. Create a Supabase project, then `bunx supabase link` and `bunx supabase db push`. Load the content with `psql "$DB_URL" -f supabase/seed.sql`.
2. In the dashboard (Auth → URL configuration), add `sparklove://**` to the redirect URLs. Use the OTP template from `supabase/templates/otp.html` so emails contain a code rather than a link.
3. Optional Google sign-in: enable the Google provider with your OAuth client. The app uses PKCE with the `sparklove://` scheme.
4. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in your EAS environment. Then run `eas build` for the stores, or `bunx expo export -p web` for a static web build.

## Roadmap

- Sign in with Apple. Required by the App Store when Google sign-in is offered.
- Push notifications ("Alice answered today's spark", new match).
- Realtime updates instead of reload-on-focus and invite polling.
- Remove storage objects when a couple or account is deleted (the DB rows already cascade).
- Premium: extra quiz packs and swipe decks. The data model already supports it through a flag on the category or item.
- Localisation (FR first).
