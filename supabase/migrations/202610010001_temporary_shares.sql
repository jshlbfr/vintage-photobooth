-- Apply once to your Supabase project's SQL editor / migration runner.
create table public.photobooth_shares (
  id text primary key check (id ~ '^[a-f0-9]{48}$'),
  storage_path text not null unique,
  owner_hash text not null check (owner_hash ~ '^[a-f0-9]{64}$'),
  mime_type text not null default 'image/png' check (mime_type = 'image/png'),
  ready boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  check (expires_at = created_at + interval '10 minutes')
);
create index photobooth_shares_expiry on public.photobooth_shares(expires_at);
create index photobooth_shares_owner on public.photobooth_shares(owner_hash, created_at);
alter table public.photobooth_shares enable row level security;
revoke all on public.photobooth_shares from public, anon, authenticated;
grant all on public.photobooth_shares to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('photobooth-shares','photobooth-shares',false,12582912,array['image/png'])
on conflict(id) do update set public=false,file_size_limit=12582912,allowed_mime_types=array['image/png'];
-- Restrictive policy also prevents unrelated broad permissive policies granting access.
create policy photobooth_private_objects on storage.objects as restrictive
for all to anon, authenticated
using (bucket_id <> 'photobooth-shares') with check (bucket_id <> 'photobooth-shares');

create function public.reserve_photobooth_share(p_id text,p_owner text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result public.photobooth_shares;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_owner,0));
  if (select count(*) from public.photobooth_shares where owner_hash=p_owner and created_at>clock_timestamp()-interval '10 minutes') >= 3 then
    raise sqlstate 'PT429' using message='Share limit reached';
  end if;
  insert into public.photobooth_shares(id,storage_path,owner_hash) values(p_id,p_id||'.png',p_owner) returning * into result;
  return to_jsonb(result);
end $$;
create function public.publish_photobooth_share(p_id text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result public.photobooth_shares; created timestamptz:=clock_timestamp();
begin
  update public.photobooth_shares set ready=true,created_at=created,expires_at=created+interval '10 minutes'
  where id=p_id and not ready returning * into result;
  if result.id is null then raise exception 'Unavailable share'; end if;
  return to_jsonb(result);
end $$;
create function public.active_photobooth_share(p_id text) returns jsonb
language sql security invoker set search_path='' as $$
  select to_jsonb(s) from public.photobooth_shares s where id=p_id and ready and expires_at>clock_timestamp();
$$;
create function public.expired_photobooth_shares() returns jsonb
language sql security invoker set search_path='' as $$
  select coalesce(jsonb_agg(s),'[]'::jsonb) from (select * from public.photobooth_shares where expires_at<=clock_timestamp() order by expires_at limit 200) s;
$$;
revoke all on function public.reserve_photobooth_share(text,text),public.publish_photobooth_share(text),public.active_photobooth_share(text),public.expired_photobooth_shares() from public,anon,authenticated;
grant execute on function public.reserve_photobooth_share(text,text),public.publish_photobooth_share(text),public.active_photobooth_share(text),public.expired_photobooth_shares() to service_role;
