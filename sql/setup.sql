-- Sweatpants vs Dory · the match page's data: kick-off, venue, result and predictions.
-- Lives in the mamar-booking Supabase project but touches none of the booking tables. Safe to re-run.

create table if not exists public.bet_matches (
  slug       text primary key,
  kickoff    timestamptz,                                   -- null = date not decided yet (the page shows "TBA")
  venue_ar   text,
  venue_en   text,
  status     text not null default 'upcoming' check (status in ('upcoming', 'live', 'full_time')),
  score_a    int check (score_a between 0 and 99),           -- a = Sweatpants
  score_b    int check (score_b between 0 and 99),           -- b = Dory
  updated_at timestamptz not null default now()
);

create table if not exists public.bet_votes (
  slug   text not null references public.bet_matches on delete cascade,
  device text not null,                                     -- random id kept in the voter's browser: one changeable vote each
  pick   text not null check (pick in ('a', 'b')),
  who    text,                                              -- hashed IP, only for the abuse cap
  at     timestamptz not null default now(),
  primary key (slug, device)
);
create index if not exists bet_votes_who on public.bet_votes (slug, who);

alter table public.bet_matches enable row level security;
alter table public.bet_votes   enable row level security;
revoke all on public.bet_matches, public.bet_votes from anon, authenticated;

insert into public.bet_matches (slug) values ('sweatpants-vs-dory') on conflict do nothing;

-- Everything the page shows, in one object (null when the match doesn't exist).
create or replace function public._bet_state(s text, dev text) returns jsonb
language sql stable security definer set search_path = public, extensions as $$
  select jsonb_build_object(
    'kickoff', m.kickoff, 'venue_ar', m.venue_ar, 'venue_en', m.venue_en,
    'status', m.status, 'score_a', m.score_a, 'score_b', m.score_b,
    'open', m.status = 'upcoming' and (m.kickoff is null or now() < m.kickoff),
    'votes', jsonb_build_object(
      'a', (select count(*) from public.bet_votes v where v.slug = m.slug and v.pick = 'a'),
      'b', (select count(*) from public.bet_votes v where v.slug = m.slug and v.pick = 'b')),
    'mine', (select v.pick from public.bet_votes v where v.slug = m.slug and v.device = dev),
    'now', now())
  from public.bet_matches m where m.slug = s
$$;

create or replace function public.pub_bet_match(p jsonb default '{}') returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  r jsonb := public._bet_state(p ->> 'slug', p ->> 'device');
begin
  if r is null then raise exception 'NOT_FOUND'; end if;
  return r;
end $$;

-- One vote per device, changeable until kick-off.
create or replace function public.pub_bet_vote(p jsonb default '{}') returns jsonb
language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  s     text := p ->> 'slug';
  dev   text := p ->> 'device';
  pk    text := coalesce(p ->> 'pick', '');
  h     jsonb := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}');
  ip    text := coalesce(nullif(h ->> 'cf-connecting-ip', ''), nullif(h ->> 'x-real-ip', ''),
                         nullif(trim(split_part(coalesce(h ->> 'x-forwarded-for', ''), ',', 1)), ''));
  v_who text := case when ip is not null then md5('bet:' || ip) end;
  m     public.bet_matches;
begin
  if dev is null or dev !~ '^[A-Za-z0-9-]{16,64}$' or pk not in ('a', 'b') then raise exception 'BAD_INPUT'; end if;
  select * into m from public.bet_matches where slug = s;
  if not found then raise exception 'NOT_FOUND'; end if;
  if m.status <> 'upcoming' or (m.kickoff is not null and now() >= m.kickoff) then raise exception 'CLOSED'; end if;
  -- a whole school on one wifi still gets plenty of room; a script inventing device ids does not
  if v_who is not null
     and not exists (select 1 from public.bet_votes where slug = s and device = dev)
     and (select count(*) from public.bet_votes where slug = s and who = v_who) >= 40 then
    raise exception 'LIMIT';
  end if;
  insert into public.bet_votes (slug, device, pick, who) values (s, dev, pk, v_who)
  on conflict (slug, device) do update set pick = excluded.pick, at = now();
  return public._bet_state(s, dev);
end $$;

-- Same rules as 999_grants.sql, applied to just these functions.
revoke all on function public._bet_state(text, text) from public, anon, authenticated, service_role;
revoke all on function public.pub_bet_match(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.pub_bet_vote(jsonb)  from public, anon, authenticated, service_role;
grant execute on function public.pub_bet_match(jsonb) to anon, authenticated, service_role;
grant execute on function public.pub_bet_vote(jsonb)  to anon, authenticated, service_role;

-- ── Updating the match (SQL editor, or Table Editor → bet_matches) ──
-- Set the date (Jeddah time):
--   update public.bet_matches set kickoff = '2026-11-05 20:00+03', venue_ar = 'ملعب …', venue_en = '… pitch', updated_at = now()
--   where slug = 'sweatpants-vs-dory';
-- During the match:   update public.bet_matches set status = 'live', score_a = 0, score_b = 0 where slug = 'sweatpants-vs-dory';
-- Full time:          update public.bet_matches set status = 'full_time', score_a = 3, score_b = 1 where slug = 'sweatpants-vs-dory';
