create extension if not exists pgcrypto;

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  incident_number text not null unique,
  incident_type text not null,
  incident_date date not null,
  incident_time time without time zone,
  location text not null,
  complainant_name text not null,
  complainant_contact text,
  description text,
  priority text not null default 'Low',
  status text not null default 'Pending',
  assigned_officer text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint incidents_priority_check check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  constraint incidents_status_check check (status in ('Pending', 'Under Investigation', 'For Mediation', 'Resolved', 'Closed'))
);

create index if not exists incidents_status_idx on public.incidents (status);
create index if not exists incidents_priority_idx on public.incidents (priority);
create index if not exists incidents_incident_date_idx on public.incidents (incident_date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_incidents_updated_at on public.incidents;
create trigger set_incidents_updated_at
before update on public.incidents
for each row
execute function public.set_updated_at();
