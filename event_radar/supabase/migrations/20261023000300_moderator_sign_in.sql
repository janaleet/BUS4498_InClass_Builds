-- Stage 8: moderator sign-in.
-- Anyone signed in (authenticated) is a moderator. This is safe only because new sign-ups are turned off:
-- moderator accounts are added by hand in Authentication → Users → Add user.

-- Moderators may read every post, including waiting and rejected ones.
create policy "Moderators can read every event"
  on public.events
  for select
  to authenticated
  using (true);

-- Moderators may change a post's status, but only to published, waiting, or rejected.
create policy "Moderators can review events"
  on public.events
  for update
  to authenticated
  using (true)
  with check (status in ('published', 'waiting', 'rejected'));

-- Moderators may read the whole table, but change only the review columns.
grant select on table public.events to authenticated;
grant update (status, status_reason, reviewed_at, reviewed_by) on table public.events to authenticated;
