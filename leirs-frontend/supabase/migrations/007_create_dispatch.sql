-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 007 — Create public.dispatch
--
-- Relationship:
--   public.incidents (id)  1──────0..*  public.dispatch (incident_id)
--
-- One incident can have multiple dispatch records (officer replaced, second
-- dispatch sent, etc.).  incidents.assigned_officer is kept in sync with the
-- officer_name of the most recently created dispatch for that incident —
-- that sync is done in the application layer (useDispatch hook).
--
-- Safe to run multiple times (IF NOT EXISTS / DO $$ guards throughout).
-- Does NOT modify any existing table or data.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create the table ─────────────────────────────────────────────────────────
create table if not exists public.dispatch (
  id               uuid        primary key default gen_random_uuid(),
  incident_id      uuid        not null
                               references public.incidents (id)
                               on delete cascade,
  dispatch_number  text        not null unique,
  officer_name     text        not null,
  dispatch_status  text        not null default 'Dispatched',
  notes            text,
  created_by       text,
  dispatched_at    timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint dispatch_status_check
    check (dispatch_status in (
      'Dispatched',
      'Responding',
      'On Scene',
      'Completed'
    ))
);

-- 2. Indexes ──────────────────────────────────────────────────────────────────
create index if not exists dispatch_incident_id_idx
  on public.dispatch (incident_id);

create index if not exists dispatch_officer_name_idx
  on public.dispatch (officer_name);

create index if not exists dispatch_status_idx
  on public.dispatch (dispatch_status);

create index if not exists dispatch_number_idx
  on public.dispatch (dispatch_number);

-- 3. updated_at trigger — reuses the existing set_updated_at() function ───────
drop trigger if exists set_dispatch_updated_at on public.dispatch;
create trigger set_dispatch_updated_at
  before update on public.dispatch
  for each row
  execute function public.set_updated_at();

-- 4. Enable RLS ───────────────────────────────────────────────────────────────
alter table public.dispatch enable row level security;

-- 5. RLS policies (same pattern as incidents, case_documentations, evidence) ──

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'dispatch'
      and policyname = 'dispatch_select_anon'
  ) then
    create policy dispatch_select_anon
      on public.dispatch
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'dispatch'
      and policyname = 'dispatch_insert_anon'
  ) then
    create policy dispatch_insert_anon
      on public.dispatch
      for insert
      to anon, authenticated
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'dispatch'
      and policyname = 'dispatch_update_anon'
  ) then
    create policy dispatch_update_anon
      on public.dispatch
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'dispatch'
      and policyname = 'dispatch_delete_anon'
  ) then
    create policy dispatch_delete_anon
      on public.dispatch
      for delete
      to anon, authenticated
      using (true);
  end if;
end $$;

-- 6. Reload PostgREST schema cache ────────────────────────────────────────────
notify pgrst, 'reload schema';
