-- Replace hardcoded movies with live TMDB movies & TV series via lazy snapshot upsert.

alter type public.swipe_kind add value if not exists 'tv';

alter table public.swipe_items
  add column if not exists external_id text;

alter table public.swipe_items
  drop constraint if exists swipe_items_kind_title_key;

create unique index if not exists swipe_items_external_id_uidx
  on public.swipe_items (external_id)
  where external_id is not null;

create unique index if not exists swipe_items_kind_title_uidx
  on public.swipe_items (kind, title)
  where external_id is null;

-- Remove hardcoded legacy movie items (keep curated 'date' items intact).
delete from public.swipe_items
where kind = 'movie' and external_id is null;

-- Records a swipe on an external TMDB movie/TV item, lazily upserting its metadata
-- snapshot into swipe_items so swipe_matches() works without N+1 TMDB lookups.
create or replace function public.swipe_external(
  p_external_id text,
  p_kind public.swipe_kind,
  p_title text,
  p_description text,
  p_tags text[],
  p_icon text,
  p_image_url text,
  p_liked boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple uuid := private.my_couple_id();
  v_item_id uuid;
  v_title text := trim(coalesce(p_title, ''));
  v_description text := trim(coalesce(p_description, ''));
  v_icon text := trim(coalesce(p_icon, ''));
  v_tags text[] := coalesce(p_tags, '{}'::text[]);
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if v_couple is null then
    raise exception 'not_linked';
  end if;

  if p_kind is null or p_kind::text not in ('movie', 'tv') then
    raise exception 'invalid_kind';
  end if;

  if p_external_id is null or p_external_id !~ ('^tmdb:' || p_kind::text || ':[0-9]+$') then
    raise exception 'invalid_external_id';
  end if;

  if char_length(v_title) = 0 or char_length(v_title) > 300 then
    raise exception 'invalid_title';
  end if;

  if char_length(v_description) > 2000 then
    raise exception 'invalid_description';
  end if;

  if char_length(v_icon) = 0 or char_length(v_icon) > 64 then
    raise exception 'invalid_icon';
  end if;

  if coalesce(array_length(v_tags, 1), 0) > 10 then
    raise exception 'invalid_tags';
  end if;

  if p_image_url is not null and (
    char_length(p_image_url) > 500
    or p_image_url !~ '^https://image\.tmdb\.org/t/p/'
  ) then
    raise exception 'invalid_image_url';
  end if;

  if p_liked is null then
    raise exception 'invalid_liked';
  end if;

  insert into public.swipe_items (
    kind, external_id, title, description, tags, icon, image_url, sort_order
  )
  values (
    p_kind, p_external_id, v_title, v_description, v_tags, v_icon, p_image_url, 0
  )
  on conflict (external_id) where external_id is not null do update set
    title = excluded.title,
    description = excluded.description,
    tags = excluded.tags,
    icon = excluded.icon,
    image_url = excluded.image_url
  returning id into v_item_id;

  insert into public.swipes (couple_id, user_id, item_id, liked)
  values (v_couple, auth.uid(), v_item_id, p_liked)
  on conflict (couple_id, user_id, item_id) do update
    set liked = excluded.liked, created_at = now();

  return p_liked and exists (
    select 1 from public.swipes
    where couple_id = v_couple
      and item_id = v_item_id
      and user_id <> auth.uid()
      and liked
  );
end $$;

-- Deletes the caller's own swipes for a single swipe kind without URL-length limits.
create or replace function public.reset_swipes(p_kind public.swipe_kind)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple uuid := private.my_couple_id();
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if v_couple is null then
    return;
  end if;

  delete from public.swipes s
  using public.swipe_items i
  where s.item_id = i.id
    and s.couple_id = v_couple
    and s.user_id = auth.uid()
    and i.kind = p_kind;
end $$;

-- Order mutual matches by most recent match first.
create or replace function public.swipe_matches()
returns setof public.swipe_items
language sql
stable
security definer
set search_path = ''
as $$
  select i.*
  from public.swipe_items i
  join (
    select s.item_id, max(s.created_at) as matched_at
    from public.swipes s
    where s.couple_id = private.my_couple_id()
      and s.liked
    group by s.item_id
    having count(*) = 2
  ) m on m.item_id = i.id
  order by m.matched_at desc, i.sort_order, i.title
$$;

revoke execute on function public.swipe_external(
  text, public.swipe_kind, text, text, text[], text, text, boolean
) from anon, public;
grant execute on function public.swipe_external(
  text, public.swipe_kind, text, text, text[], text, text, boolean
) to authenticated;

revoke execute on function public.reset_swipes(public.swipe_kind) from anon, public;
grant execute on function public.reset_swipes(public.swipe_kind) to authenticated;

revoke execute on function public.swipe_matches() from anon, public;
grant execute on function public.swipe_matches() to authenticated;
