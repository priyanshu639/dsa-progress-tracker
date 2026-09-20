create extension if not exists pgcrypto;

create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform text not null check (platform in ('LeetCode','GFG','Other')),
  difficulty text not null check (difficulty in ('Easy','Medium','Hard')),
  topic text not null,
  pattern text,
  problem_url text not null,
  editorial_url text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique(platform, problem_url)
);

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  status text not null default 'solved' check(status in ('solved','unsolved','review')),
  solved_at timestamptz,
  time_spent_minutes integer,
  attempts integer not null default 1,
  notes text,
  updated_at timestamptz not null default now(),
  unique(user_id, problem_id)
);

alter table public.problems enable row level security;
alter table public.progress enable row level security;

drop policy if exists "Problems readable by everyone" on public.problems;
create policy "Problems readable by everyone" on public.problems for select using (true);

drop policy if exists "Authenticated users can insert problems" on public.problems;
create policy "Authenticated users can insert problems" on public.problems for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update problems" on public.problems;
create policy "Authenticated users can update problems" on public.problems for update to authenticated using (true) with check (true);

drop policy if exists "Users read own progress" on public.progress;
create policy "Users read own progress" on public.progress for select to authenticated using (auth.uid()=user_id);

drop policy if exists "Users insert own progress" on public.progress;
create policy "Users insert own progress" on public.progress for insert to authenticated with check (auth.uid()=user_id);

drop policy if exists "Users update own progress" on public.progress;
create policy "Users update own progress" on public.progress for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);

drop policy if exists "Users delete own progress" on public.progress;
create policy "Users delete own progress" on public.progress for delete to authenticated using (auth.uid()=user_id);
