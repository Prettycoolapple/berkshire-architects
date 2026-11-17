begin;

create extension if not exists supabase_vault with schema vault;

create table public.berkshire_enquiries (
  id uuid primary key,
  created_at timestamptz not null default now(),
  first_name text not null check (char_length(first_name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  phone text not null check (char_length(phone) between 7 and 32),
  message text not null check (char_length(message) between 1 and 2000),
  source_fingerprint text not null check (char_length(source_fingerprint) = 64),
  notification_attempts integer not null default 0,
  notification_due_at timestamptz not null default now(),
  notification_sent_at timestamptz
);

alter table public.berkshire_enquiries enable row level security;
revoke all on table public.berkshire_enquiries from public, anon, authenticated;
grant select, insert, update on table public.berkshire_enquiries to service_role;

create index berkshire_enquiries_created_at on public.berkshire_enquiries (created_at);
create index berkshire_enquiries_notification_due on public.berkshire_enquiries (notification_due_at)
  where notification_sent_at is null and notification_attempts < 6;

create function public.record_berkshire_enquiry(
  enquiry_id uuid, given_name text, contact_email text, contact_phone text,
  project_message text, fingerprint text
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  existing public.berkshire_enquiries%rowtype;
begin
  -- Serialize the small number of writes so concurrent posts respect the same limits.
  perform pg_advisory_xact_lock(145401162, 1);
  select * into existing from public.berkshire_enquiries where id = enquiry_id;
  if found then
    if (existing.first_name, existing.email, existing.phone, existing.message)
       = (given_name, contact_email, contact_phone, project_message) then
      return 'received';
    end if;
    return 'conflict';
  end if;

  if exists (
    select 1
    from public.berkshire_enquiries
    where created_at > now() - interval '30 minutes'
    having count(*) >= 40 or count(*) filter (where source_fingerprint = fingerprint) >= 6
  ) then
    return 'limited';
  end if;

  insert into public.berkshire_enquiries (id, first_name, email, phone, message, source_fingerprint)
  values (enquiry_id, given_name, contact_email, contact_phone, project_message, fingerprint);
  return 'received';
end;
$$;

revoke all on function public.record_berkshire_enquiry(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_berkshire_enquiry(uuid, text, text, text, text, text) to service_role;

create function public.claim_berkshire_enquiry_notifications(enquiry_id uuid, retry_token text)
returns table (id uuid, first_name text, email text, phone text, message text, notification_attempts integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if enquiry_id is null and not exists (
    select 1 from vault.decrypted_secrets
    where name = 'berkshire_enquiry_retry_token' and decrypted_secret = retry_token
  ) then
    raise insufficient_privilege;
  end if;

  return query
    with due as (
      select enquiry.id
      from public.berkshire_enquiries as enquiry
      where (enquiry_id is null or enquiry.id = enquiry_id)
        and enquiry.notification_sent_at is null
        and enquiry.notification_attempts < 6
        and enquiry.notification_due_at <= now()
      order by enquiry.notification_due_at
      limit 4
      for update skip locked
    )
    update public.berkshire_enquiries as enquiry
    set notification_attempts = enquiry.notification_attempts + 1,
        notification_due_at = now() + interval '10 minutes'
    from due
    where enquiry.id = due.id
    returning enquiry.id, enquiry.first_name, enquiry.email, enquiry.phone,
              enquiry.message, enquiry.notification_attempts;
end;
$$;

revoke all on function public.claim_berkshire_enquiry_notifications(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_berkshire_enquiry_notifications(uuid, text) to service_role;

commit;
