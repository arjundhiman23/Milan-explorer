-- Milan Explorer · migration 002
-- Bases get updated_at / deleted_at so deletions sync instead of being
-- re-pulled from the server. Also retires the old Comasina default base.
alter table public.bases add column if not exists updated_at text;
alter table public.bases add column if not exists deleted_at text;

update public.bases
   set deleted_at = to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
       updated_at = to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
 where id = 'comasina' and deleted_at is null;
