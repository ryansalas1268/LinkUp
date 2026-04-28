UPDATE auth.users
SET encrypted_password = crypt('Demo123!', gen_salt('bf')),
    updated_at = now()
WHERE id = 'a64682e2-f65f-4436-9007-1425ab98b4b2';