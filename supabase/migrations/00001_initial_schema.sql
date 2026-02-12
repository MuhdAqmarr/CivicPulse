-- ============================================================================
-- Local Community Problem Reporter -- Initial Schema Migration
-- ============================================================================
-- This migration sets up the complete database schema including tables, enums,
-- indexes, functions, triggers, and row-level security policies.
-- ============================================================================


-- ============================================================================
-- Section 1: Extensions
-- ============================================================================

create extension if not exists pg_trgm with schema public;


-- ============================================================================
-- Section 2: Custom Enum Types
-- ============================================================================

create type public.report_status as enum (
  'OPEN',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'CLOSED'
);

create type public.update_type as enum (
  'COMMENT',
  'UPDATE',
  'STATUS_CHANGE',
  'CLOSURE_REQUEST'
);


-- ============================================================================
-- Section 3: Tables
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 3a. profiles -- one row per registered user, created automatically via trigger
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                 uuid        primary key references auth.users (id) on delete cascade,
  display_name       text,
  avatar_url         text,
  points             int         not null default 0,
  badge_first_report boolean     not null default false,
  badge_helper       boolean     not null default false,
  badge_resolver     boolean     not null default false,
  helper_actions     int         not null default 0,
  resolver_confirmed int         not null default 0,
  role               text        not null default 'user'
                                 check (role in ('user', 'admin')),
  is_banned          boolean     not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.profiles is 'Extended user profile, auto-created on sign-up.';

-- ---------------------------------------------------------------------------
-- 3b. reports -- community problem reports
-- ---------------------------------------------------------------------------
create table public.reports (
  id                   uuid            primary key default gen_random_uuid(),
  creator_id           uuid            references public.profiles (id),
  title                text            not null
                                       check (char_length(title) >= 3 and char_length(title) <= 200),
  description          text            not null,
  category             text            not null,
  status               public.report_status not null default 'OPEN',
  created_at           timestamptz     not null default now(),
  updated_at           timestamptz     not null default now(),
  location_lat         double precision,
  location_lng         double precision,
  location_is_exact    boolean         not null default false,
  location_label       text,
  photo_path           text,
  is_hidden            boolean         not null default false,
  comments_locked      boolean         not null default false,
  duplicate_of         uuid            references public.reports (id),
  closed_by            uuid            references public.profiles (id),
  closure_note         text,
  closure_photo_path   text,
  closure_confirmed    boolean         not null default false,
  closure_confirmed_at timestamptz
);

comment on table public.reports is 'Community problem reports submitted by users.';

-- ---------------------------------------------------------------------------
-- 3c. report_updates -- comments, status changes, closure requests
-- ---------------------------------------------------------------------------
create table public.report_updates (
  id         uuid               primary key default gen_random_uuid(),
  report_id  uuid               not null references public.reports (id) on delete cascade,
  author_id  uuid               references public.profiles (id),
  type       public.update_type not null,
  content    text               not null,
  new_status public.report_status,
  created_at timestamptz        not null default now()
);

comment on table public.report_updates is 'Timeline entries on a report (comments, updates, status changes).';

-- ---------------------------------------------------------------------------
-- 3d. report_follows -- users following a report for notifications
-- ---------------------------------------------------------------------------
create table public.report_follows (
  report_id  uuid        not null references public.reports (id) on delete cascade,
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

comment on table public.report_follows is 'Many-to-many: users following reports.';

-- ---------------------------------------------------------------------------
-- 3e. closure_votes -- community votes on whether a closure is valid
-- ---------------------------------------------------------------------------
create table public.closure_votes (
  report_id  uuid        not null references public.reports (id) on delete cascade,
  voter_id   uuid        not null references public.profiles (id) on delete cascade,
  vote       boolean     not null,
  created_at timestamptz not null default now(),
  primary key (report_id, voter_id)
);

comment on table public.closure_votes is 'Community votes confirming or rejecting a report closure.';

-- ---------------------------------------------------------------------------
-- 3f. flags -- content moderation flags
-- ---------------------------------------------------------------------------
create table public.flags (
  id          uuid        primary key default gen_random_uuid(),
  target_type text        not null
                          check (target_type in ('report', 'update', 'profile')),
  target_id   uuid        not null,
  reporter_id uuid        references public.profiles (id),
  reason      text,
  created_at  timestamptz not null default now(),
  unique (target_type, target_id, reporter_id)
);

comment on table public.flags is 'User-submitted content flags for moderation.';

-- ---------------------------------------------------------------------------
-- 3g. notifications -- in-app notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  report_id  uuid        references public.reports (id) on delete set null,
  type       text        not null,
  title      text        not null,
  body       text,
  created_at timestamptz not null default now(),
  read_at    timestamptz
);

comment on table public.notifications is 'In-app notifications delivered to users.';


-- ============================================================================
-- Section 4: Indexes
-- ============================================================================

-- Full-text / trigram search on report titles
create index idx_reports_title_trgm
  on public.reports
  using gin (title public.gin_trgm_ops);

-- Filtering & sorting indexes on reports
create index idx_reports_status     on public.reports (status);
create index idx_reports_category   on public.reports (category);
create index idx_reports_created_at on public.reports (created_at desc);
create index idx_reports_updated_at on public.reports (updated_at desc);

-- Timeline queries on report_updates
create index idx_report_updates_report_created
  on public.report_updates (report_id, created_at desc);

-- User follow listing
create index idx_report_follows_user_created
  on public.report_follows (user_id, created_at desc);

-- Unread notification queries
create index idx_notifications_user_read
  on public.notifications (user_id, read_at);

-- Flag counting per target
create index idx_flags_target
  on public.flags (target_type, target_id);


-- ============================================================================
-- Section 5: Functions & Triggers
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 5a. handle_new_user()
--     Automatically creates a profiles row when a new auth.users row appears.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 5b. auto_follow_creator()
--     The report creator automatically follows their own report.
-- ---------------------------------------------------------------------------
create or replace function public.auto_follow_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.report_follows (report_id, user_id)
  values (new.id, new.creator_id)
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_report_created_follow
  after insert on public.reports
  for each row
  execute function public.auto_follow_creator();

-- ---------------------------------------------------------------------------
-- 5c. award_points_and_badges()
--     Awards points and unlocks badges based on user actions.
--
--     Listens on: reports (INSERT), report_updates (INSERT),
--                 closure_votes (INSERT)
-- ---------------------------------------------------------------------------

-- i) Points for creating a new report (+10, badge_first_report)
create or replace function public.award_points_on_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set points             = points + 10,
      badge_first_report = true
  where id = new.creator_id;
  return new;
end;
$$;

create trigger on_report_created_points
  after insert on public.reports
  for each row
  execute function public.award_points_on_report();

-- ii) Points for commenting / updating (+2, capped at 30 comment-points/day)
create or replace function public.award_points_on_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  today_points int;
begin
  -- Only award for COMMENT or UPDATE types
  if new.type not in ('COMMENT', 'UPDATE') then
    return new;
  end if;

  -- Count how many comment/update entries this user already made today
  select count(*) into today_points
  from public.report_updates
  where author_id = new.author_id
    and type in ('COMMENT', 'UPDATE')
    and created_at >= date_trunc('day', now())
    and id <> new.id;

  -- Each entry awards 2 points; cap at 30 points/day = 15 entries
  if (today_points * 2) < 30 then
    update public.profiles
    set points         = points + 2,
        helper_actions = helper_actions + 1,
        badge_helper   = case when helper_actions + 1 >= 5 then true else badge_helper end
    where id = new.author_id;
  else
    -- Still count the helper action even if points are capped
    update public.profiles
    set helper_actions = helper_actions + 1,
        badge_helper   = case when helper_actions + 1 >= 5 then true else badge_helper end
    where id = new.author_id;
  end if;

  return new;
end;
$$;

create trigger on_update_created_points
  after insert on public.report_updates
  for each row
  execute function public.award_points_on_update();

-- iii) Points for casting a closure vote (+3)
create or replace function public.award_points_on_vote()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set points = points + 3
  where id = new.voter_id;
  return new;
end;
$$;

create trigger on_closure_vote_points
  after insert on public.closure_votes
  for each row
  execute function public.award_points_on_vote();

-- ---------------------------------------------------------------------------
-- 5d. handle_closure_vote()
--     Evaluates community closure votes and confirms or rejects the closure.
-- ---------------------------------------------------------------------------
create or replace function public.handle_closure_vote()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_closed_by   uuid;
  v_true_votes  int;
  v_false_votes int;
begin
  -- Retrieve the user who requested closure
  select closed_by into v_closed_by
  from public.reports
  where id = new.report_id;

  -- Count votes, excluding the person who closed the report
  select
    count(*) filter (where vote = true  and voter_id is distinct from v_closed_by),
    count(*) filter (where vote = false and voter_id is distinct from v_closed_by)
  into v_true_votes, v_false_votes
  from public.closure_votes
  where report_id = new.report_id;

  -- Confirm closure: at least 2 confirming votes and more confirms than rejects
  if v_true_votes >= 2 and v_true_votes > v_false_votes then
    update public.reports
    set closure_confirmed    = true,
        closure_confirmed_at = now()
    where id = new.report_id;

    -- Award +20 points and resolver badge progress to the closer
    if v_closed_by is not null then
      update public.profiles
      set points             = points + 20,
          resolver_confirmed = resolver_confirmed + 1,
          badge_resolver     = case when resolver_confirmed + 1 >= 2 then true else badge_resolver end
      where id = v_closed_by;
    end if;

  -- Reject closure: at least 2 rejecting votes
  elsif v_false_votes >= 2 then
    update public.reports
    set status             = 'IN_PROGRESS',
        closure_confirmed  = false
    where id = new.report_id;
  end if;

  return new;
end;
$$;

create trigger on_closure_vote_evaluate
  after insert on public.closure_votes
  for each row
  execute function public.handle_closure_vote();

-- ---------------------------------------------------------------------------
-- 5e. auto_hide_on_flags()
--     Automatically hides a report when it accumulates >= 3 flags.
-- ---------------------------------------------------------------------------
create or replace function public.auto_hide_on_flags()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  flag_count int;
begin
  select count(*) into flag_count
  from public.flags
  where target_type = new.target_type
    and target_id   = new.target_id;

  if flag_count >= 3 and new.target_type = 'report' then
    update public.reports
    set is_hidden = true
    where id = new.target_id;
  end if;

  return new;
end;
$$;

create trigger on_flag_created_auto_hide
  after insert on public.flags
  for each row
  execute function public.auto_hide_on_flags();

-- ---------------------------------------------------------------------------
-- 5f. update_updated_at()
--     Keeps the updated_at column current on every row modification.
-- ---------------------------------------------------------------------------
create or replace function public.update_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row
  execute function public.update_updated_at();

create trigger set_updated_at_reports
  before update on public.reports
  for each row
  execute function public.update_updated_at();

-- ---------------------------------------------------------------------------
-- 5g. notify_followers()
--     Sends an in-app notification to every follower of a report when a new
--     update is posted (excluding the author of the update).
-- ---------------------------------------------------------------------------
create or replace function public.notify_followers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report_title text;
begin
  -- Fetch the report title for the notification
  select title into v_report_title
  from public.reports
  where id = new.report_id;

  insert into public.notifications (user_id, report_id, type, title, body)
  select
    rf.user_id,
    new.report_id,
    new.type::text,
    'Update on: ' || coalesce(v_report_title, 'a report'),
    left(new.content, 200)
  from public.report_follows rf
  where rf.report_id = new.report_id
    and rf.user_id <> new.author_id;

  return new;
end;
$$;

create trigger on_update_notify_followers
  after insert on public.report_updates
  for each row
  execute function public.notify_followers();


-- ============================================================================
-- Section 6: Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on every table
alter table public.profiles       enable row level security;
alter table public.reports        enable row level security;
alter table public.report_updates enable row level security;
alter table public.report_follows enable row level security;
alter table public.closure_votes  enable row level security;
alter table public.flags          enable row level security;
alter table public.notifications  enable row level security;

-- ---------------------------------------------------------------------------
-- Helper: is_admin()  -- reusable check across policies
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Helper: is_banned()  -- reusable ban check
-- ---------------------------------------------------------------------------
create or replace function public.is_banned()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_banned = true
  );
$$;

-- ---------------------------------------------------------------------------
-- 6a. profiles
-- ---------------------------------------------------------------------------

-- Anyone can read profiles
create policy "profiles_select"
  on public.profiles for select
  using (true);

-- Users can insert their own profile
create policy "profiles_insert"
  on public.profiles for insert
  with check (id = auth.uid());

-- Users can update only display_name and avatar_url on their own row
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- Ensure protected fields remain unchanged
    and points             = (select points             from public.profiles where id = auth.uid())
    and badge_first_report = (select badge_first_report from public.profiles where id = auth.uid())
    and badge_helper       = (select badge_helper       from public.profiles where id = auth.uid())
    and badge_resolver     = (select badge_resolver     from public.profiles where id = auth.uid())
    and helper_actions     = (select helper_actions     from public.profiles where id = auth.uid())
    and resolver_confirmed = (select resolver_confirmed from public.profiles where id = auth.uid())
    and role               = (select role               from public.profiles where id = auth.uid())
    and is_banned          = (select is_banned          from public.profiles where id = auth.uid())
  );

-- Admin can update any profile (unrestricted)
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6b. reports
-- ---------------------------------------------------------------------------

-- Anyone can read non-hidden reports
create policy "reports_select_public"
  on public.reports for select
  using (is_hidden = false);

-- Admins can read all reports (including hidden)
create policy "reports_select_admin"
  on public.reports for select
  using (public.is_admin());

-- Authenticated non-banned users can create reports
create policy "reports_insert"
  on public.reports for insert
  with check (
    auth.uid() is not null
    and not public.is_banned()
    and creator_id = auth.uid()
  );

-- Creator can update their own report
create policy "reports_update_creator"
  on public.reports for update
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

-- Admin can update any report
create policy "reports_update_admin"
  on public.reports for update
  using (public.is_admin())
  with check (public.is_admin());

-- Admin-only delete
create policy "reports_delete_admin"
  on public.reports for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6c. report_updates
-- ---------------------------------------------------------------------------

-- Anyone can read updates on visible reports
create policy "report_updates_select"
  on public.report_updates for select
  using (
    exists (
      select 1 from public.reports r
      where r.id = report_id
        and (r.is_hidden = false or public.is_admin())
    )
  );

-- Authenticated non-banned users can insert updates if comments are not locked
-- (admins bypass the lock)
create policy "report_updates_insert"
  on public.report_updates for insert
  with check (
    auth.uid() is not null
    and not public.is_banned()
    and author_id = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from public.reports r
        where r.id = report_id
          and r.comments_locked = false
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 6d. report_follows
-- ---------------------------------------------------------------------------

-- Users can see their own follows
create policy "report_follows_select"
  on public.report_follows for select
  using (user_id = auth.uid());

-- Authenticated non-banned users can follow reports
create policy "report_follows_insert"
  on public.report_follows for insert
  with check (
    auth.uid() is not null
    and not public.is_banned()
    and user_id = auth.uid()
  );

-- Users can unfollow (delete their own follows)
create policy "report_follows_delete"
  on public.report_follows for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6e. closure_votes
-- ---------------------------------------------------------------------------

-- Anyone can read closure votes
create policy "closure_votes_select"
  on public.closure_votes for select
  using (true);

-- Authenticated non-banned users can cast votes
create policy "closure_votes_insert"
  on public.closure_votes for insert
  with check (
    auth.uid() is not null
    and not public.is_banned()
    and voter_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- 6f. flags
-- ---------------------------------------------------------------------------

-- Only admins can view flags
create policy "flags_select_admin"
  on public.flags for select
  using (public.is_admin());

-- Authenticated non-banned users can create flags
create policy "flags_insert"
  on public.flags for insert
  with check (
    auth.uid() is not null
    and not public.is_banned()
    and reporter_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- 6g. notifications
-- ---------------------------------------------------------------------------

-- Users can see their own notifications
create policy "notifications_select"
  on public.notifications for select
  using (user_id = auth.uid());

-- Users can mark their own notifications as read
create policy "notifications_update"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Users can delete their own notifications
create policy "notifications_delete"
  on public.notifications for delete
  using (user_id = auth.uid());


-- ============================================================================
-- Section 7: RPC Functions for Client Queries
-- ============================================================================

-- Similarity search for duplicate detection
create or replace function public.search_similar_reports(
  search_title text,
  search_lat double precision default null,
  search_lng double precision default null,
  radius_km double precision default 2,
  result_limit int default 5
)
returns table (
  id uuid,
  title text,
  status public.report_status,
  category text,
  location_label text,
  closure_confirmed boolean,
  similarity real
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return query
    select
      r.id,
      r.title,
      r.status,
      r.category,
      r.location_label,
      r.closure_confirmed,
      public.similarity(r.title, search_title) as similarity
    from public.reports r
    where r.is_hidden = false
      and public.similarity(r.title, search_title) > 0.15
      and (
        search_lat is null
        or search_lng is null
        or (
          r.location_lat is not null
          and r.location_lng is not null
          and abs(r.location_lat - search_lat) < (radius_km / 111.0)
          and abs(r.location_lng - search_lng) < (radius_km / (111.0 * cos(radians(search_lat))))
        )
      )
    order by similarity desc
    limit result_limit;
end;
$$;

-- ============================================================================
-- Section 8: Supabase Realtime Publication
-- ============================================================================

-- Enable realtime for tables that need live updates
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.report_updates;
alter publication supabase_realtime add table public.reports;

-- ============================================================================
-- Section 9: Storage Bucket
-- ============================================================================

-- Note: Storage buckets are typically created via the Supabase dashboard or API.
-- If using the Supabase CLI, you can create them with:
-- insert into storage.buckets (id, name, public) values ('report-photos', 'report-photos', true);

-- ============================================================================
-- End of migration
-- ============================================================================
