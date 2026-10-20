-- BriteList shared task ordering. Run once in Supabase SQL Editor.
alter table public.shared_items add column if not exists sort_order bigint;
update public.shared_items set sort_order = floor(extract(epoch from created_at)*1000000)::bigint where sort_order is null;
create index if not exists shared_items_order_idx on public.shared_items(list_id,sort_order,id);
create or replace function public.reorder_shared_items(p_list_id uuid,p_item_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if (select auth.uid()) is null or not public.is_member(p_list_id) then
    raise exception 'Not authorized to reorder this list';
  end if;
  select count(*) into n from public.shared_items where list_id=p_list_id;
  if coalesce(array_length(p_item_ids,1),0) <> n
     or (select count(distinct id) from unnest(p_item_ids) as ids(id)) <> n
     or exists (select 1 from unnest(p_item_ids) as ids(id) where not exists
         (select 1 from public.shared_items si where si.id=ids.id and si.list_id=p_list_id)) then
    raise exception 'The list changed. Refresh and try again';
  end if;
  update public.shared_items si
  set sort_order = x.ordinality::bigint
  from unnest(p_item_ids) with ordinality as x(id,ordinality)
  where si.list_id=p_list_id and si.id=x.id;
end;
$$;
revoke all on function public.reorder_shared_items(uuid,uuid[]) from public;
grant execute on function public.reorder_shared_items(uuid,uuid[]) to authenticated;
