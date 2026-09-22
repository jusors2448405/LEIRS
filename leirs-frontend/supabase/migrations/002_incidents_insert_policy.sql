alter table public.incidents enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'incidents'
      and policyname = 'incidents_insert_anon'
  ) then
    create policy incidents_insert_anon
    on public.incidents
    for insert
    to anon, authenticated
    with check (true);
  end if;
end
$$;

