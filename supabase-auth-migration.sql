-- REVIEW BEFORE EXECUTING in the Supabase SQL Editor.
--
-- This is additive. It does not alter or recreate Brightlist's existing
-- profiles/shared_* tables, policies, functions, or list data. The existing
-- supabase-setup.sql contains no profile-creation trigger, so this migration
-- adds one and a private, user-owned backup table for explicit local-data
-- migration. Do not run it until the existing production schema is confirmed.

create table if not exists public.private_list_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  source_version integer not null,
  migrated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.private_list_backups enable row level security;

drop policy if exists private_list_backups_self_select on public.private_list_backups;
create policy private_list_backups_self_select on public.private_list_backups
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists private_list_backups_self_insert on public.private_list_backups;
create policy private_list_backups_self_insert on public.private_list_backups
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists private_list_backups_self_update on public.private_list_backups;
create policy private_list_backups_self_update on public.private_list_backups
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  profile_name text;
begin
  profile_name := left(
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1), 'Member'),
    60
  );
  insert into public.profiles (id, display_name)
  values (new.id, profile_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();

-- Verify after running (as an authenticated user):
-- select * from public.profiles where id = auth.uid();
-- select * from public.private_list_backups where user_id = auth.uid();
