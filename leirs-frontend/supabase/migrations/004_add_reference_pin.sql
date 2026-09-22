-- Add reference_pin column to public.incidents.
-- Used by the public Track Incident feature so reporters can look up
-- their own incident using incident_number + reference_pin without
-- exposing any other record or PII.
--
-- Design decisions:
--   - text type  : PINs are stored as zero-padded 6-digit strings ("004821")
--   - nullable   : existing rows before this migration have no PIN; they
--                  simply cannot be tracked via the public form (safe fallback)
--   - no UNIQUE  : uniqueness is not required — the combination of
--                  incident_number + reference_pin is what must match
--   - index      : speeds up the WHERE incident_number = ? AND reference_pin = ?
--                  lookup on the Track Incident page

alter table public.incidents
  add column if not exists reference_pin text;

create index if not exists incidents_reference_pin_idx
  on public.incidents (reference_pin);

-- Composite index for the exact query used by Track Incident
create index if not exists incidents_number_pin_idx
  on public.incidents (incident_number, reference_pin);
