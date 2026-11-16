---
name: supabase-changes
description: Change a Supabase database safely with migration files, row level security policies and regenerated types. Use when adding or altering a table, column, index, policy, function, trigger or storage bucket, and when a query fails because of permissions.
---

# Supabase changes

The database is the part of this app you cannot regenerate. Changes go through files, not the dashboard.

## Add or change a table

1. `npx supabase migration new <short_name>` creates a file in `supabase/migrations`.
2. Write the SQL there. In the same migration:
   - `alter table <t> enable row level security;`
   - one policy per operation the app needs (`select`, `insert`, `update`, `delete`), each naming its role (`authenticated`, `anon`) and its rule, for example `using (auth.uid() = user_id)`. Inserts and updates need `with check`.
   - indexes for the columns policies and queries filter on.
3. Apply it to the local database only: `npx supabase migration up` (local stack running).
4. Regenerate types: `npx supabase gen types typescript --local > <path the repo uses>`.
5. Test each policy three ways: signed out, signed in as the owner, signed in as someone else.

## Rules

- A new table with no policy is unreadable through the API. A table with RLS off is readable by anyone who has the anon key, which is everyone. Neither is acceptable to leave.
- Never use `service_role` to get around a policy from the app. Fix the policy.
- A migration that is already applied is never edited. Write a new one.
- Destructive steps (drop column, drop table, type change that loses data) need the user's explicit yes, and a note on how to get the data back.
- Functions marked `security definer` set `search_path` and check the caller themselves.
- Storage buckets are private unless the user says otherwise. Bucket policies are part of the migration.

## Applying to the hosted project

`supabase db push`, `supabase db reset --linked` and anything else that touches the remote database are the user's call. Give them the command and what it will change.
