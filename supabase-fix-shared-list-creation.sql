-- BriteList: safe shared-list creation repair (run once in Supabase SQL Editor)
-- Authenticated users can create lists they own; the existing owner trigger adds membership.
create or replace function public.create_shared_list(p_title text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Sign in to create a shared list';
  end if;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 100 then
    raise exception 'List name must be 1 to 100 characters';
  end if;
  insert into public.shared_lists(title,owner_id)
    values (btrim(p_title),v_user)
    returning id into v_id;
  insert into public.shared_members(list_id,user_id)
    values(v_id,v_user) on conflict do nothing;
  return v_id;
end;
$$;
revoke all on function public.create_shared_list(text) from public;
grant execute on function public.create_shared_list(text) to authenticated;
