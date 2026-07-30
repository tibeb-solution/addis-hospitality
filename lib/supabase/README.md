Supabase integration (local fallback)
===================================

What this provides
- A local-storage based Supabase client is already implemented at `lib/supabase/client.ts` and is used by the app today.
- This folder contains a SQL file `supabase-init.sql` you can paste into the Supabase SQL editor to create matching tables.

Quick local behavior
- The app currently calls `createClient()` from `lib/supabase/client.ts`, which operates on `localStorage` keys. This lets you run and develop the app without a remote Supabase instance.

Switching to a real Supabase project (later)
1. Install the client library:

```bash
pnpm add @supabase/supabase-js
```

2. Set environment variables (for local dev, put these into `.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your public anon key

3. Two options to switch:
- A) Replace calls to the local `createClient()` by creating a real client in `lib/supabase/client.ts` using the `createClient` exported by `@supabase/supabase-js`.
- B) Use an adapter: import `lib/supabase/adapter.ts` (created here) and modify it to return the real client when env vars are present.

Example adapter snippet (dynamic import) — uncomment and adapt in `lib/supabase/adapter.ts`:

```ts
// const { createClient: supabaseCreate } = await import('@supabase/supabase-js')
// const supabase = supabaseCreate(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
```

4. Run the SQL: open your Supabase project, go to SQL editor, paste the contents of `supabase-init.sql` and run it.

Security notes
- Never store service-role keys in the browser. Use server-side routes with a server key for privileged operations.
- Add RLS policies and proper password hashing before going to production.
