alter table public.users
  add column if not exists cancellation_date timestamptz;

alter table public.users
  add column if not exists winback_email_sent boolean not null default false;

