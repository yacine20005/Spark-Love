begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.local');

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

select public.leave_couple();
reset role;
select is((select count(*) from public.answers where user_id::text like '00000000-%')::int, 0, 'unlinking deletes shared data');

select * from finish();
rollback;
