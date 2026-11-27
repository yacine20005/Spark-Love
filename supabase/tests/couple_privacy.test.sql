begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'c@test.local'),
  ('00000000-0000-0000-0000-00000000000d', 'd@test.local');

create function pg_temp.as_user(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true)
$$;

set local role authenticated;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
create temp table invite as select public.create_invite() as code;
select is(length((select code from invite)), 6, 'invite code has 6 characters');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select isnt(public.join_couple(lower((select code from invite))), null, 'partner joins with a lower-case code');
select throws_ok($$ select public.join_couple((select code from invite)) $$, 'invalid_code', 'an invite code works only once');

-- Link a second couple (c & d) to verify cross-couple privacy isolation.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
create temp table invite2 as select public.create_invite() as code;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select public.join_couple((select code from invite2));

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select throws_ok($$ update public.profiles set couple_id = null where id = auth.uid() $$, '42501', null, 'couple_id is not client-writable');

insert into public.answers (couple_id, user_id, question_id, answer)
  select private.my_couple_id(), auth.uid(), q.id, 'a'
  from public.questions q join public.quiz_categories c on c.id = q.category_id
  where c.name = 'Communication' and q.is_active;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select is((select count(*) from public.answers)::int, 0, 'partner cannot read my raw answers');
select is((select count(*) from public.compare_category((select id from public.quiz_categories where name = 'Communication')))::int,
  0, 'comparison stays hidden until both have finished');

insert into public.answers (couple_id, user_id, question_id, answer)
  select private.my_couple_id(), auth.uid(), q.id, 'b'
  from public.questions q join public.quiz_categories c on c.id = q.category_id
  where c.name = 'Communication' and q.is_active;
select is((select count(*) from public.compare_category((select id from public.quiz_categories where name = 'Communication')) where mine = 'b' and partner = 'a')::int,
  10, 'comparison reveals both answers once both have finished');

select is(public.swipe((select id from public.swipe_items order by sort_order limit 1), true), false, 'first like is not a match');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select is(public.swipe((select id from public.swipe_items order by sort_order limit 1), true), true, 'second like is a match');

-- External TMDB swipe validation
select throws_ok(
  $$ select public.swipe_external('tmdb:date:123', 'date', 'Bad', 'Desc', '{}', 'film-outline', null, true) $$,
  'invalid_kind',
  'swipe_external rejects date kind'
);
select throws_ok(
  $$ select public.swipe_external('tmdb:tv:123', 'movie', 'Bad', 'Desc', '{}', 'film-outline', null, true) $$,
  'invalid_external_id',
  'swipe_external rejects mismatched external_id'
);
select throws_ok(
  $$ select public.swipe_external('tmdb:movie:550', 'movie', 'Fight Club', 'Desc', '{}', 'film-outline', 'https://evil.example/poster.jpg', true) $$,
  'invalid_image_url',
  'swipe_external rejects non-TMDB image_url'
);

-- External TMDB movie swipes & cross-couple privacy isolation
select is(
  public.swipe_external('tmdb:movie:550', 'movie', 'Fight Club', 'An insomniac office worker...', array['Drama', '1999'], 'film-outline', 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', true),
  false,
  'first external movie like is not a match'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select is(
  public.swipe_external('tmdb:movie:550', 'movie', 'Fight Club', 'An insomniac office worker...', array['Drama', '1999'], 'film-outline', 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', true),
  false,
  'another couple liking the same external movie does not match across couples'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select is(
  public.swipe_external('tmdb:movie:550', 'movie', 'Fight Club', 'An insomniac office worker...', array['Drama', '1999'], 'film-outline', 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', true),
  true,
  'partner liking same external movie creates a match'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select is(
  (select count(*) from public.swipe_matches())::int,
  0,
  'other couple cannot see Couple 1 external matches'
);

-- External TMDB TV series swipes & swipe_matches
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select is(
  public.swipe_external('tmdb:tv:1396', 'tv', 'Breaking Bad', 'A chemistry teacher...', array['Drama', '2008'], 'tv-outline', null, true),
  false,
  'first external tv like is not a match'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select is(
  public.swipe_external('tmdb:tv:1396', 'tv', 'Breaking Bad', 'A chemistry teacher...', array['Drama', '2008'], 'tv-outline', null, true),
  true,
  'second external tv like is a match'
);

select is(
  (select count(*) from public.swipe_matches())::int,
  3,
  'swipe_matches returns date, movie, and tv matches for couple'
);

-- reset_swipes scopes strictly to caller and kind
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select public.reset_swipes('movie');
select is(
  (select count(*) from public.swipes)::int,
  2,
  'reset_swipes deletes only the requested kind for the caller'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select is(
  (select count(*) from public.swipes)::int,
  3,
  'reset_swipes does not delete partner swipes'
);
select is(
  (select count(*) from public.swipe_matches())::int,
  2,
  'reset_swipes removes match for reset kind while keeping other kinds'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select is(
  (select count(*) from public.swipes)::int,
  1,
  'reset_swipes does not affect other couples'
);

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select public.leave_couple();
reset role;
select is((select count(*) from public.answers where user_id::text like '00000000-%')::int, 0, 'unlinking deletes shared data');

select * from finish();
rollback;
