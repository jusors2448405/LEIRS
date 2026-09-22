-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 005 — Create public.case_documentations
--
-- Relationship:
--   public.incidents (id)  1──────0..1  public.case_documentations (incident_id)
--
-- One incident may have at most one case documentation record (enforced by the
-- UNIQUE constraint on incident_id).  The foreign key uses ON DELETE CASCADE so
-- orphan case docs are never left behind if an incident is removed.
--
-- Safe to run multiple times (all statements use IF NOT EXISTS / DO $$ guards).
-- Does NOT touch existing incidents rows.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create the table ─────────────────────────────────────────────────────────
create table if not exists public.case_documentations (
  id               uuid        primary key default gen_random_uuid(),
  incident_id      uuid        not null
                               references public.incidents (id)
                               on delete cascade,
  case_number      text        not null unique,
  assigned_officer text,
  case_status      text        not null default 'Pending',
  case_notes       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- one incident → at most one case documentation record
  constraint case_documentations_incident_unique
    unique (incident_id),

  constraint case_documentations_status_check
    check (case_status in (
      'Pending',
      'Under Investigation',
      'For Mediation',
      'Resolved',
      'Closed'
    ))
);

-- 2. Indexes ──────────────────────────────────────────────────────────────────
create index if not exists case_docs_incident_id_idx
  on public.case_documentations (incident_id);

create index if not exists case_docs_status_idx
  on public.case_documentations (case_status);

create index if not exists case_docs_case_number_idx
  on public.case_documentations (case_number);

-- 3. Reuse existing set_updated_at() trigger function ─────────────────────────
drop trigger if exists set_case_docs_updated_at on public.case_documentations;
create trigger set_case_docs_updated_at
  before update on public.case_documentations
  for each row
  execute function public.set_updated_at();

-- 4. Enable RLS ───────────────────────────────────────────────────────────────
alter table public.case_documentations enable row level security;

-- 5. RLS policies (same pattern as incidents) ─────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'case_documentations'
      and policyname = 'case_docs_select_anon'
  ) then
    create policy case_docs_select_anon
      on public.case_documentations
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
      and tablename  = 'case_documentations'
      and policyname = 'case_docs_insert_anon'
  ) then
    create policy case_docs_insert_anon
      on public.case_documentations
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
      and tablename  = 'case_documentations'
      and policyname = 'case_docs_update_anon'
  ) then
    create policy case_docs_update_anon
      on public.case_documentations
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end $$;

-- 6. Reload schema cache so PostgREST picks up the new table immediately ──────
notify pgrst, 'reload schema';
