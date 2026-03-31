create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

alter table public.users enable row level security;
drop policy if exists users_select_own on public.users;
drop policy if exists users_select_anon on public.users;
create policy users_select_own on public.users for select to authenticated using (auth.uid() = id);
create policy users_select_anon on public.users for select to anon using (false);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  username text,
  bio text,
  rank text,
  main_heroes text[],
  profile_image_url text,
  win_rate text,
  main_role text,
  total_matches text,
  server_region text,
  social_media text,
  updated_at timestamptz default now(),
  constraint user_profiles_unique_user_id unique (user_id)
);

alter table public.user_profiles enable row level security;
drop policy if exists user_profiles_insert_own on public.user_profiles;
drop policy if exists user_profiles_select_own on public.user_profiles;
drop policy if exists user_profiles_update_own on public.user_profiles;
drop policy if exists user_profiles_delete_own on public.user_profiles;
create policy user_profiles_insert_own on public.user_profiles for insert to authenticated with check (auth.uid() = user_id);
create policy user_profiles_select_own on public.user_profiles for select to authenticated using (true);
create policy user_profiles_update_own on public.user_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_profiles_delete_own on public.user_profiles for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.chapter_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  chapter text not null,
  created_at timestamptz default now(),
  constraint chapter_progress_unique unique (user_id, chapter)
);

alter table public.chapter_progress enable row level security;
drop policy if exists chapter_progress_insert_own on public.chapter_progress;
drop policy if exists chapter_progress_select_own on public.chapter_progress;
drop policy if exists chapter_progress_update_own on public.chapter_progress;
drop policy if exists chapter_progress_delete_own on public.chapter_progress;
create policy chapter_progress_insert_own on public.chapter_progress for insert to authenticated with check (auth.uid() = user_id);
create policy chapter_progress_select_own on public.chapter_progress for select to authenticated using (auth.uid() = user_id);
create policy chapter_progress_update_own on public.chapter_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy chapter_progress_delete_own on public.chapter_progress for delete to authenticated using (auth.uid() = user_id);

create index if not exists idx_user_profiles_user_id on public.user_profiles(user_id);
create index if not exists idx_chapter_progress_user_id on public.chapter_progress(user_id);
create index if not exists idx_chapter_progress_unique on public.chapter_progress(user_id, chapter);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_key text not null,
  question text not null,
  options jsonb not null,
  correct_index integer not null default 0,
  explanation text not null default '',
  difficulty text not null default 'normal',
  created_at timestamptz not null default now(),
  constraint quiz_questions_options_array check (jsonb_typeof(options) = 'array'),
  constraint quiz_questions_correct_index_non_negative check (correct_index >= 0)
);

create index if not exists idx_quiz_questions_key_created on public.quiz_questions (quiz_key, created_at);

alter table public.quiz_questions enable row level security;
drop policy if exists quiz_questions_select_all on public.quiz_questions;
drop policy if exists quiz_questions_write_auth on public.quiz_questions;
create policy quiz_questions_select_all on public.quiz_questions for select to anon, authenticated using (true);
create policy quiz_questions_write_auth on public.quiz_questions for all to authenticated using (true) with check (true);

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  quiz_key text not null,
  score integer not null default 0,
  total_questions integer not null default 0,
  elapsed_ms integer not null default 0,
  created_at timestamptz not null default now(),
  constraint quiz_results_score_non_negative check (score >= 0),
  constraint quiz_results_total_non_negative check (total_questions >= 0),
  constraint quiz_results_elapsed_non_negative check (elapsed_ms >= 0)
);

create index if not exists idx_quiz_results_key_score_time on public.quiz_results (quiz_key, score desc, elapsed_ms asc, created_at desc);
create index if not exists idx_quiz_results_user_created on public.quiz_results (user_id, created_at desc);

alter table public.quiz_results enable row level security;
drop policy if exists quiz_results_insert_own on public.quiz_results;
drop policy if exists quiz_results_select_public on public.quiz_results;
drop policy if exists quiz_results_update_own on public.quiz_results;
drop policy if exists quiz_results_delete_own on public.quiz_results;
create policy quiz_results_insert_own on public.quiz_results for insert to authenticated with check (auth.uid() = user_id);
create policy quiz_results_select_public on public.quiz_results for select to anon, authenticated using (true);
create policy quiz_results_update_own on public.quiz_results for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy quiz_results_delete_own on public.quiz_results for delete to authenticated using (auth.uid() = user_id);
