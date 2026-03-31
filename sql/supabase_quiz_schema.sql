create extension if not exists pgcrypto;

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

create index if not exists idx_quiz_questions_key_created
  on public.quiz_questions (quiz_key, created_at);

alter table public.quiz_questions enable row level security;

drop policy if exists quiz_questions_select_all on public.quiz_questions;
create policy quiz_questions_select_all
  on public.quiz_questions
  for select
  to anon, authenticated
  using (true);

drop policy if exists quiz_questions_write_auth on public.quiz_questions;
create policy quiz_questions_write_auth
  on public.quiz_questions
  for all
  to authenticated
  using (true)
  with check (true);


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

create index if not exists idx_quiz_results_key_score_time
  on public.quiz_results (quiz_key, score desc, elapsed_ms asc, created_at desc);

create index if not exists idx_quiz_results_user_created
  on public.quiz_results (user_id, created_at desc);

alter table public.quiz_results enable row level security;

drop policy if exists quiz_results_insert_own on public.quiz_results;
create policy quiz_results_insert_own
  on public.quiz_results
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists quiz_results_select_public on public.quiz_results;
create policy quiz_results_select_public
  on public.quiz_results
  for select
  to anon, authenticated
  using (true);

drop policy if exists quiz_results_update_own on public.quiz_results;
create policy quiz_results_update_own
  on public.quiz_results
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists quiz_results_delete_own on public.quiz_results;
create policy quiz_results_delete_own
  on public.quiz_results
  for delete
  to authenticated
  using (auth.uid() = user_id);
