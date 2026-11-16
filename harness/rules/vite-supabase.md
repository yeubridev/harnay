## Stack: Vite + React + Supabase (Lovable or Bolt export)

- This is a browser-only app. Everything under `src/` ships to the visitor, and so does every `VITE_` variable. There is no safe place for a secret in this codebase.
- Anything that needs a secret (a Stripe secret key, a model API key, `service_role`, sending email) lives in a Supabase Edge Function under `supabase/functions/<name>` and reads it with `Deno.env.get`. The browser calls the function.
- Row level security is the only wall between a visitor and the database, because the anon key is public. Every table: RLS on, policies written, tested as an anonymous visitor and as a different signed-in user.
- Filtering by user id in the client is not security. The policy has to enforce it.
- Edge functions verify the caller's JWT, validate their input and answer CORS for your domain only.
- Schema changes are migration files in `supabase/migrations`. If the project came from Lovable, that folder is the source of truth.
- Reuse the components in `src/components/ui` before adding new ones, and fetch data the way the existing code does (TanStack Query if it is there).
- Before real users arrive: check the auth redirect URLs, email confirmation, storage bucket policies, and remove test and seed data.
