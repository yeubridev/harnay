## Stack: Next.js (App Router) + Supabase

- Check the installed Next.js version before using an API from memory. Conventions change between majors, and recent versions ship their docs in `node_modules/next/dist/docs`.
- Components are Server Components unless they need state, effects or browser APIs. Put `'use client'` on the smallest leaf that needs it.
- Server Actions and Route Handlers are public endpoints. Each one checks the session and validates its input with zod before doing anything.
- The browser gets the anon (publishable) key and nothing else. The `service_role` key is used only in modules that import `server-only`, never in a file a client component imports, never behind `NEXT_PUBLIC_`.
- Every table has row level security switched on and explicit policies before any code uses it. A table without RLS is a bug. Test each policy as an anonymous visitor and as a different signed-in user.
- Identity on the server comes from `supabase.auth.getUser()` (or `getClaims()`), never from `getSession()` alone.
- Schema changes are files in `supabase/migrations` created with `supabase migration new <name>`. No dashboard edits, no ad-hoc SQL. Regenerate the TypeScript types after each migration.
- Webhooks (Stripe and others) verify the signature and are safe to receive twice.
- Every environment variable is listed in `.env.example` with a comment. Anything prefixed `NEXT_PUBLIC_` is public.
- Use `next/image`, `next/font` and the Metadata API instead of hand-rolled equivalents.
