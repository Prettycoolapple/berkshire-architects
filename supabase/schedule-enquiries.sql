begin;

create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret(
  replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  'berkshire_enquiry_retry_token'
)
where not exists (
  select 1 from vault.secrets where name = 'berkshire_enquiry_retry_token'
);

-- Substitute the Berkshire project URL here before running in its SQL Editor.
select cron.schedule(
  'berkshire-enquiry-notifications',
  '*/5 * * * *',
  format($job$
    select net.http_post(
      url := %L,
      headers := jsonb_build_object('x-enquiry-retry-token', (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'berkshire_enquiry_retry_token'
      )),
      timeout_milliseconds := 65000
    )
    where exists (
      select 1 from public.berkshire_enquiries
      where notification_sent_at is null and notification_attempts < 6
        and notification_due_at <= now()
    );
  $job$, 'https://PROJECT_REF.supabase.co/functions/v1/berkshire-enquiry')
);

commit;
