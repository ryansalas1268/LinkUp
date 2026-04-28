## Reset Ryan25 password to `Demo123!`

Run a one-line SQL migration that updates the password for the Ryan25 demo account (`ryanjsalas@gwu.edu`, user id `a64682e2-f65f-4436-9007-1425ab98b4b2`) in `auth.users` using Supabase's bundled `crypt()` + `gen_salt('bf')`.

```sql
UPDATE auth.users
SET encrypted_password = crypt('Demo123!', gen_salt('bf')),
    updated_at = now()
WHERE id = 'a64682e2-f65f-4436-9007-1425ab98b4b2';
```

After this runs, you can log in as:
- **Username:** `Ryan25` (or email `ryanjsalas@gwu.edu`)
- **Password:** `Demo123!`

No code or UI changes needed — the existing auto-reseed logic on login still keeps the demo data permanent.
