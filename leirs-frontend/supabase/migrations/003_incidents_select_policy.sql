-- Add SELECT policy so anon and authenticated roles can read incidents.
-- This is required because:
--   1. RLS is enabled on public.incidents
--   2. The app uses mock/local auth (no supabase.auth.signIn), so all
--      requests reach Supabase under the anon role.
--   3. Without a SELECT policy, any .select() call — including ones
--      chained after INSERT — is blocked and surfaces as an RLS error.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'incidents'
      and policyname = 'incidents_select_anon'
  ) then
    create policy incidents_select_anon
      on public.incidents
      for select
      to anon, authenticated
      using (true);
  end if;
end
$$;

-- Also ensure the UPDATE and DELETE policies exist for later modules.
-- Only creates them if they don't already exist.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'incidents'
      and policyname = 'incidents_update_anon'
  ) then
    create policy incidents_update_anon
      on public.incidents
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'incidents'
      and policyname = 'incidents_delete_anon'
  ) then
    create policy incidents_delete_anon
      on public.incidents
      for delete
      to anon, authenticated
      using (true);
  end if;
end
$$;
