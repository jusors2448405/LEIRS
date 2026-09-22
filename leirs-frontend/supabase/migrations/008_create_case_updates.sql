-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 008 — Create public.case_updates
--
-- Purpose:
--   Officer progress tracking for assigned cases. Each update is an immutable
--   log entry documenting officer activities and investigation progress.
--
-- Relationship:
--   public.incidents (id)  1──────0..*  public.case_updates (incident_id)
--
-- One incident may have many case updates (chronological activity log).
-- Each update is attributed to an officer with timestamp.
-- Foreign key uses ON DELETE CASCADE: removing an incident also removes its updates.
--
-- Security Model:
--   LEIRS uses localStorage-based auth (not Supabase Auth), so all requests
--   use the 'anon' role. Database-level RLS provides basic field validation.
--   True officer-level security is enforced at the application layer:
--   - Officers only query updates for their assigned incidents
--   - Application validates assignment before allowing insert
--   - officer_name is set from authenticated session, not user input
--
-- Immutability:
--   Updates are immutable once created (no UPDATE or DELETE policies).
--   This ensures historical integrity of the activity log.
--
-- Safe to run multiple times (IF NOT EXISTS / DO $$ guards throughout).
-- Does NOT modify existing tables or data.
-- Does NOT affect incident status workflow.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create the table ─────────────────────────────────────────────────────────
create table if not exists public.case_updates (
  id              uuid        primary key default gen_random_uuid(),
  incident_id     uuid        not null
                              references public.incidents (id)
                              on delete cascade,
  officer_name    text        not null,
  update_text     text        not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 2. Indexes ──────────────────────────────────────────────────────────────────
create index if not exists case_updates_incident_id_idx
  on public.case_updates (incident_id);

create index if not exists case_updates_officer_name_idx
  on public.case_updates (officer_name);

create index if not exists case_updates_created_at_idx
  on public.case_updates (created_at desc);

-- 3. Reuse existing set_updated_at() trigger ──────────────────────────────────
drop trigger if exists set_case_updates_updated_at on public.case_updates;
create trigger set_case_updates_updated_at
  before update on public.case_updates
  for each row
  execute function public.set_updated_at();

-- 4. Enable RLS ───────────────────────────────────────────────────────────────
alter table public.case_updates enable row level security;

-- 5. RLS policies ─────────────────────────────────────────────────────────────
-- NOTE: LEIRS uses localStorage-based auth (not Supabase Auth).
-- All requests use the 'anon' role. True officer-level RLS is not possible
-- without migrating to Supabase Auth. Security is enforced at application layer:
-- - Officers only query case_updates for their assigned incidents
-- - Application validates incident assignment before insert
-- - officer_name set from session, not user input
--
-- Database-level validation ensures required fields are present and non-empty.
-- No UPDATE or DELETE policies: updates are immutable once created.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'case_updates'
      and policyname = 'case_updates_select_anon'
  ) then
    create policy case_updates_select_anon
      on public.case_updates
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
      and tablename  = 'case_updates'
      and policyname = 'case_updates_insert_anon'
  ) then
    create policy case_updates_insert_anon
      on public.case_updates
      for insert
      to anon, authenticated
      with check (
        incident_id IS NOT NULL
        AND officer_name IS NOT NULL 
        AND officer_name != ''
        AND update_text IS NOT NULL
        AND update_text != ''
      );
  end if;
end $$;

-- No UPDATE or DELETE policies: case updates are immutable for audit integrity

-- 6. Reload PostgREST schema cache ────────────────────────────────────────────
notify pgrst, 'reload schema';
