-- Spark Love schema.
-- Model: a user belongs to at most one couple (profiles.couple_id). A couple with a
-- single member is a pending invite; joining with its invite_code completes it.
-- Everything shared (answers, swipes, journal) hangs off couple_id and is deleted
-- with the couple.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique,
  together_since date,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 40),
  couple_id uuid references public.couples (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_couple_id_idx on public.profiles (couple_id);

create type public.question_type as enum ('multiple_choice', 'scale', 'text', 'yes_no');

create table public.quiz_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text not null, -- Ionicons glyph name
  color text not null,
  description text not null,
  sort_order int not null default 0
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.quiz_categories (id) on delete cascade,
  text text not null,
  type public.question_type not null,
  options jsonb check (options is null or jsonb_typeof(options) = 'array'),
  scale_min int,
  scale_max int,
  scale_labels jsonb check (scale_labels is null or jsonb_typeof(scale_labels) = 'object'),
  sort_order int not null default 0,
  is_active boolean not null default true,
  check ((type = 'multiple_choice') = (options is not null)),
  check ((type = 'scale') = (scale_min is not null and scale_max is not null and scale_min < scale_max))
);
create index questions_category_id_idx on public.questions (category_id);

create table public.answers (
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  answer text not null check (char_length(answer) between 1 and 2000),
  created_at timestamptz not null default now(),
  primary key (couple_id, user_id, question_id)
);
create index answers_question_id_idx on public.answers (question_id);
create index answers_user_id_idx on public.answers (user_id);

create type public.swipe_kind as enum ('movie', 'date');

create table public.swipe_items (
  id uuid primary key default gen_random_uuid(),
  kind public.swipe_kind not null,
  title text not null,
  description text not null,
  tags text[] not null default '{}',
  icon text not null, -- Ionicons glyph name
  image_url text,
  sort_order int not null default 0,
  unique (kind, title)
);

create table public.swipes (
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid not null references public.swipe_items (id) on delete cascade,
  liked boolean not null,
  created_at timestamptz not null default now(),
  primary key (couple_id, user_id, item_id)
);
create index swipes_item_id_idx on public.swipes (item_id);
create index swipes_user_id_idx on public.swipes (user_id);

create type public.journal_kind as enum ('note', 'memory', 'spark');

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.journal_kind not null,
  title text check (char_length(title) <= 200),
  body text not null check (char_length(body) between 1 and 5000),
  image_path text,
  created_at timestamptz not null default now()
);
create index journal_entries_couple_created_idx on public.journal_entries (couple_id, created_at desc);
create index journal_entries_user_id_idx on public.journal_entries (user_id);

-- ---------------------------------------------------------------------------
-- Helpers & triggers
-- ---------------------------------------------------------------------------

create function private.my_couple_id()
returns uuid
language sql stable security definer set search_path = ''
as $$ select couple_id from public.profiles where id = auth.uid() $$;

create function private.touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();

create function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(split_part(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), ' ', 1), 40), '')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

grant usage on schema private to authenticated;
grant execute on function private.my_couple_id() to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.couples enable row level security;
alter table public.profiles enable row level security;
alter table public.quiz_categories enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.swipe_items enable row level security;
alter table public.swipes enable row level security;
alter table public.journal_entries enable row level security;

create policy "members read their couple" on public.couples
  for select to authenticated using (id = (select private.my_couple_id()));
create policy "members update their couple" on public.couples
  for update to authenticated using (id = (select private.my_couple_id()));

create policy "read self and partner" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or couple_id = (select private.my_couple_id()));
create policy "update self" on public.profiles
  for update to authenticated using (id = (select auth.uid()));

create policy "content is readable" on public.quiz_categories for select to authenticated using (true);
create policy "content is readable" on public.questions for select to authenticated using (true);
create policy "content is readable" on public.swipe_items for select to authenticated using (true);

-- Answers and swipes stay private to their author; partners only see them
-- through the reveal RPCs below.
create policy "own answers" on public.answers
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and couple_id = (select private.my_couple_id()));

create policy "own swipes" on public.swipes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and couple_id = (select private.my_couple_id()));

create policy "couple reads journal" on public.journal_entries
  for select to authenticated using (couple_id = (select private.my_couple_id()));
create policy "members write journal" on public.journal_entries
  for insert to authenticated
  with check (user_id = (select auth.uid()) and couple_id = (select private.my_couple_id()));
create policy "authors delete their entries" on public.journal_entries
  for delete to authenticated using (user_id = (select auth.uid()));

-- Column-level guards: couple membership only changes through the RPCs.
revoke update on public.profiles from authenticated, anon;
grant update (display_name) on public.profiles to authenticated;
revoke update on public.couples from authenticated, anon;
grant update (together_since) on public.couples to authenticated;

-- ---------------------------------------------------------------------------
-- Couple RPCs
-- ---------------------------------------------------------------------------

create function public.create_invite()
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  current_couple uuid := private.my_couple_id();
  code text;
begin
  if me is null then raise exception 'not_authenticated'; end if;

  if current_couple is not null then
    if (select count(*) from public.profiles where couple_id = current_couple) > 1 then
      raise exception 'already_linked';
    end if;
    select invite_code into code from public.couples where id = current_couple;
    return code;
  end if;

  loop
    -- No 0/O/1/I so codes survive being read aloud.
    code := (
      select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
      from generate_series(1, 6)
    );
    exit when not exists (select 1 from public.couples where invite_code = code);
  end loop;

  insert into public.couples (invite_code) values (code) returning id into current_couple;
  update public.profiles set couple_id = current_couple where id = me;
  return code;
end $$;

create function public.join_couple(code text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  target uuid;
  current_couple uuid := private.my_couple_id();
begin
  if me is null then raise exception 'not_authenticated'; end if;

  select id into target from public.couples where invite_code = upper(trim(code)) for update;
  if target is null then raise exception 'invalid_code'; end if;
  if target = current_couple then raise exception 'own_code'; end if;
  if (select count(*) from public.profiles where couple_id = target) <> 1 then
    raise exception 'invalid_code';
  end if;

  if current_couple is not null then
    if (select count(*) from public.profiles where couple_id = current_couple) > 1 then
      raise exception 'already_linked';
    end if;
    delete from public.couples where id = current_couple; -- drop my own pending invite
  end if;

  update public.profiles set couple_id = target where id = me;
  update public.couples set invite_code = null, together_since = coalesce(together_since, current_date)
    where id = target;
  return target;
end $$;

-- Unlinking deletes the couple and everything the two of you shared.
create function public.leave_couple()
returns void
language sql security definer set search_path = ''
as $$ delete from public.couples where id = private.my_couple_id() $$;

create function public.delete_account()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.couples where id = private.my_couple_id();
  delete from auth.users where id = auth.uid();
end $$;

-- ---------------------------------------------------------------------------
-- Quiz RPCs
-- ---------------------------------------------------------------------------

create function public.quiz_progress()
returns table (category_id uuid, total int, mine int, partner int)
language sql stable security definer set search_path = ''
as $$
  select
    q.category_id,
    count(distinct q.id)::int,
    (count(distinct a.question_id) filter (where a.user_id = auth.uid()))::int,
    (count(distinct a.question_id) filter (where a.user_id <> auth.uid()))::int
  from public.questions q
  left join public.answers a on a.question_id = q.id and a.couple_id = private.my_couple_id()
  where q.is_active
  group by q.category_id
$$;

-- Returns both partners' answers only once both have answered every active
-- question in the category; otherwise returns nothing.
create function public.compare_category(p_category_id uuid)
returns table (question_id uuid, mine text, partner text)
language sql stable security definer set search_path = ''
as $$
  with qs as (
    select id from public.questions where category_id = p_category_id and is_active
  ),
  pairs as (
    select
      qs.id,
      max(a.answer) filter (where a.user_id = auth.uid()) as mine,
      max(a.answer) filter (where a.user_id <> auth.uid()) as partner
    from qs
    left join public.answers a on a.question_id = qs.id and a.couple_id = private.my_couple_id()
    group by qs.id
  )
  select id, mine, partner from pairs
  where not exists (select 1 from pairs p where p.mine is null or p.partner is null)
$$;

-- ---------------------------------------------------------------------------
-- Swipe RPCs
-- ---------------------------------------------------------------------------

-- Records a swipe and reports whether the partner had already liked it.
create function public.swipe(p_item_id uuid, p_liked boolean)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  couple uuid := private.my_couple_id();
begin
  if couple is null then raise exception 'not_linked'; end if;
  insert into public.swipes (couple_id, user_id, item_id, liked)
  values (couple, auth.uid(), p_item_id, p_liked)
  on conflict (couple_id, user_id, item_id) do update set liked = excluded.liked, created_at = now();

  return p_liked and exists (
    select 1 from public.swipes
    where couple_id = couple and item_id = p_item_id and user_id <> auth.uid() and liked
  );
end $$;

create function public.swipe_matches()
returns setof public.swipe_items
language sql stable security definer set search_path = ''
as $$
  select i.* from public.swipe_items i
  where (
    select count(*) from public.swipes s
    where s.item_id = i.id and s.couple_id = private.my_couple_id() and s.liked
  ) = 2
  order by i.sort_order, i.title
$$;

revoke execute on all functions in schema public from anon, public;
grant execute on all functions in schema public to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: journal photos live under "<couple_id>/<file>" in a private bucket.
-- shortcut: photos are not removed from storage when a couple is deleted
-- (SQL can't delete storage objects); a scheduled cleanup would fix that.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('journal', 'journal', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "couple reads photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'journal' and (storage.foldername(name))[1] = (select private.my_couple_id())::text);
create policy "couple uploads photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'journal' and (storage.foldername(name))[1] = (select private.my_couple_id())::text);
create policy "authors delete photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'journal' and owner_id = (select auth.uid())::text);
