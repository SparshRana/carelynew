# Optional isolated PostgreSQL verifier

This test-only subproject is not an application runtime dependency. It uses PostgreSQL/WASM through PGlite with test auth functions and identities, never live Supabase credentials. From this folder run:

```sh
corepack pnpm install --frozen-lockfile
node verify.mjs
```

It checks the actual included SQL migration, row permissions, family revocation, optimistic revisions and AI quotas. It does not validate your hosted Supabase configuration or email service.

PGlite documentation: https://pglite.dev/docs/
