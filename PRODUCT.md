# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Two people in a relationship, each on their own phone. Inferred (owner unavailable during init): mostly couples in their 20s–30s, often busy or long-distance, opening the app for a short evening ritual rather than long sessions.

## Product Purpose

Give couples small, regular reasons to learn something new about each other: a daily question, themed quizzes, shared swipe decks (movies, dates) and a private shared journal. Success is both partners coming back most days and having a conversation because of something the app revealed.

## Positioning

The reveal. Each partner answers alone first; the other's answer only unlocks once both have played (quiz comparisons, daily spark, swipe matches). Every feature is built around that moment of suspense and discovery, not around tracking or therapy. (Inferred; confirm with owner.)

## Operating Context

- Used one-handed, at night, often in bed or on the commute; sessions of 1–5 minutes.
- Two linked accounts per couple; one couple per user; pairing by a 6-character invite code.
- Partners are asynchronous: one often waits for the other.

## Capabilities and Constraints

- Expo SDK 58 / React Native, iOS + Android + web; Supabase backend with row-level security.
- Features: email OTP / Google sign-in, onboarding, pairing, daily spark, 10 quiz categories, movie and date swipe decks, matches list, shared journal with photos, profile with anniversary counter.
- Copy and seeded content are in English (owner did not choose; French is an open decision).
- No monetization, no push notifications yet.

## Brand Commitments

- Name: Spark Love. Tone (inferred): complice — playful and warm, like a friend who knows you both; never saccharine, never clinical.

## Evidence on Hand

Seeded content only (`supabase/seed.sql`): 100 quiz questions, 30 movies, 30 date ideas. No users, testimonials, ratings or press — never fabricate them.

## Product Principles

1. Answer first, discover second: hide the partner until you have played.
2. Small and daily beats big and rare.
3. Two people, one space: everything shown is shared, nothing is public.
4. Playful, not therapeutic: no scores that judge the relationship.
