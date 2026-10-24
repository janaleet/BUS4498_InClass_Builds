-- Optional stage: the nightly clean-up.
-- Every night at 10:00 UTC (about 3 a.m. Pacific), events whose date has passed are archived,
-- so they leave the website and the moderator's waiting list. Archived posts stay in the table.

create extension if not exists pg_cron;

-- Scheduling a job with a name that already exists replaces it, so this file is safe to run again.
select cron.schedule(
  'archive-past-events',
  '0 10 * * *',
  $$
    update public.events
       set status = 'archived'
     where status in ('published', 'waiting')
       and event_date < (now() at time zone 'America/Los_Angeles')::date
  $$
);
