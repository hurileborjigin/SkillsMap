-- SkillGraph schema: roles → tracks → categories → skills, plus per-user progress.
-- All tables are owned per-user and protected by RLS keyed to auth.uid().

create extension if not exists "pgcrypto";

-- =====================================================================
-- Tables
-- =====================================================================

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  name text not null,
  short_description text not null default '',
  long_description text not null default '',
  difficulty text not null default 'Intermediate',
  icon_key text not null default 'custom',
  is_default boolean not null default false,
  position int not null default 0,
  active_track_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  name text not null,
  description text not null default '',
  is_default boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  name text not null,
  description text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  description text not null default '',
  why_it_matters text not null default '',
  importance text not null default 'important' check (importance in ('required', 'important', 'optional')),
  related jsonb not null default '[]'::jsonb,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- Add the cross-table FK from roles.active_track_id → tracks.id
-- (added after both tables exist to avoid the dependency cycle).
alter table public.roles
  drop constraint if exists roles_active_track_fk;
alter table public.roles
  add constraint roles_active_track_fk
  foreign key (active_track_id) references public.tracks(id) on delete set null;

create table if not exists public.skill_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  status text not null default 'not-started' check (status in ('not-started', 'learning', 'completed')),
  updated_at timestamptz not null default now(),
  primary key (user_id, track_id, skill_id)
);

-- =====================================================================
-- Indexes
-- =====================================================================

create index if not exists roles_user_idx on public.roles(user_id);
create index if not exists tracks_user_idx on public.tracks(user_id);
create index if not exists tracks_role_idx on public.tracks(role_id);
create index if not exists categories_track_idx on public.categories(track_id);
create index if not exists categories_user_idx on public.categories(user_id);
create index if not exists skills_category_idx on public.skills(category_id);
create index if not exists skills_user_idx on public.skills(user_id);
create index if not exists progress_user_idx on public.skill_progress(user_id);

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.roles enable row level security;
alter table public.tracks enable row level security;
alter table public.categories enable row level security;
alter table public.skills enable row level security;
alter table public.skill_progress enable row level security;

-- roles
drop policy if exists "roles_select_own" on public.roles;
drop policy if exists "roles_insert_own" on public.roles;
drop policy if exists "roles_update_own" on public.roles;
drop policy if exists "roles_delete_own" on public.roles;
create policy "roles_select_own" on public.roles for select using (auth.uid() = user_id);
create policy "roles_insert_own" on public.roles for insert with check (auth.uid() = user_id);
create policy "roles_update_own" on public.roles for update using (auth.uid() = user_id);
create policy "roles_delete_own" on public.roles for delete using (auth.uid() = user_id);

-- tracks
drop policy if exists "tracks_select_own" on public.tracks;
drop policy if exists "tracks_insert_own" on public.tracks;
drop policy if exists "tracks_update_own" on public.tracks;
drop policy if exists "tracks_delete_own" on public.tracks;
create policy "tracks_select_own" on public.tracks for select using (auth.uid() = user_id);
create policy "tracks_insert_own" on public.tracks for insert with check (auth.uid() = user_id);
create policy "tracks_update_own" on public.tracks for update using (auth.uid() = user_id);
create policy "tracks_delete_own" on public.tracks for delete using (auth.uid() = user_id);

-- categories
drop policy if exists "categories_select_own" on public.categories;
drop policy if exists "categories_insert_own" on public.categories;
drop policy if exists "categories_update_own" on public.categories;
drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_select_own" on public.categories for select using (auth.uid() = user_id);
create policy "categories_insert_own" on public.categories for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories for update using (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories for delete using (auth.uid() = user_id);

-- skills
drop policy if exists "skills_select_own" on public.skills;
drop policy if exists "skills_insert_own" on public.skills;
drop policy if exists "skills_update_own" on public.skills;
drop policy if exists "skills_delete_own" on public.skills;
create policy "skills_select_own" on public.skills for select using (auth.uid() = user_id);
create policy "skills_insert_own" on public.skills for insert with check (auth.uid() = user_id);
create policy "skills_update_own" on public.skills for update using (auth.uid() = user_id);
create policy "skills_delete_own" on public.skills for delete using (auth.uid() = user_id);

-- skill_progress
drop policy if exists "progress_select_own" on public.skill_progress;
drop policy if exists "progress_insert_own" on public.skill_progress;
drop policy if exists "progress_update_own" on public.skill_progress;
drop policy if exists "progress_delete_own" on public.skill_progress;
create policy "progress_select_own" on public.skill_progress for select using (auth.uid() = user_id);
create policy "progress_insert_own" on public.skill_progress for insert with check (auth.uid() = user_id);
create policy "progress_update_own" on public.skill_progress for update using (auth.uid() = user_id);
create policy "progress_delete_own" on public.skill_progress for delete using (auth.uid() = user_id);
