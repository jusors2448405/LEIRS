-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 006 — Create public.evidence
--
-- Relationship:
--   public.incidents (id)  1──────0..*  public.evidence (incident_id)
--
-- One incident may have many evidence records.
-- Foreign key uses ON DELETE CASCADE: removing an incident also removes its evidence.
-- Safe to run multiple times (IF NOT EXISTS / DO $$ guards throughout).
-- Does NOT modify existing tables or data.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create the table ─────────────────────────────────────────────────────────
create table if not exists public.evidence (
  id              uuid        primary key default gen_random_uuid(),
  incident_id     uuid        not null
                              references public.incidents (id)
                              on delete cascade,
  evidence_number text        not null unique,
  evidence_type   text        not null,
  evidence_name   text        not null,
  description     text,
  file_name       text,
  file_url        text,
  collected_by    text,
  collected_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint evidence_type_check
    check (evidence_type in (
      'Document',
      'Image',
      'Video',
      'Audio',
      'Physical',
      'Digital',
      'Testimony',
      'Other'
    ))
);

-- 2. Indexes ──────────────────────────────────────────────────────────────────
create index if not exists evidence_incident_id_idx
  on public.evidence (incident_id);

create index if not exists evidence_type_idx
  on public.evidence (evidence_type);

create index if not exists evidence_number_idx
  on public.evidence (evidence_number);

-- 3. Reuse existing set_updated_at() trigger ──────────────────────────────────
drop trigger if exists set_evidence_updated_at on public.evidence;
create trigger set_evidence_updated_at
  before update on public.evidence
  for each row
  execute function public.set_updated_at();

-- 4. Enable RLS ───────────────────────────────────────────────────────────────
alter table public.evidence enable row level security;

-- 5. RLS policies ─────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'evidence'
      and policyname = 'evidence_select_anon'
  ) then
    create policy evidence_select_anon
      on public.evidence
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
      and tablename  = 'evidence'
      and policyname = 'evidence_insert_anon'
  ) then
    create policy evidence_insert_anon
      on public.evidence
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
      and tablename  = 'evidence'
      and policyname = 'evidence_update_anon'
  ) then
    create policy evidence_update_anon
      on public.evidence
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
      and tablename  = 'evidence'
      and policyname = 'evidence_delete_anon'
  ) then
    create policy evidence_delete_anon
      on public.evidence
      for delete
      to anon, authenticated
      using (true);
  end if;
end $$;

-- 6. Reload PostgREST schema cache ────────────────────────────────────────────
notify pgrst, 'reload schema';
