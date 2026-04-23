
-- Create 4 demo auth users with profiles + friendships to Ryan
DO $$
DECLARE
  ryan_id uuid := '7fc8b61a-eae2-4516-b9c7-0e11ea78147a';
  demo_users jsonb := '[
    {"id":"a1111111-1111-1111-1111-111111111111","username":"lydialiu","display_name":"Lydia Liu","email":"lydia.demo@linkup.local"},
    {"id":"a2222222-2222-2222-2222-222222222222","username":"nabilali","display_name":"Nabil Ali","email":"nabil.demo@linkup.local"},
    {"id":"a3333333-3333-3333-3333-333333333333","username":"laurenyeo","display_name":"Lauren Yeo","email":"lauren.demo@linkup.local"},
    {"id":"a4444444-4444-4444-4444-444444444444","username":"sarahu","display_name":"Sara Hu","email":"sara.demo@linkup.local"}
  ]'::jsonb;
  u jsonb;
BEGIN
  FOR u IN SELECT * FROM jsonb_array_elements(demo_users) LOOP
    -- insert auth user
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      (u->>'id')::uuid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      u->>'email',
      crypt('demo-password-' || (u->>'username'), gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('username', u->>'username', 'display_name', u->>'display_name'),
      now(), now(), '', '', '', ''
    )
    ON CONFLICT (id) DO NOTHING;

    -- insert profile
    INSERT INTO public.profiles (id, username, display_name)
    VALUES ((u->>'id')::uuid, u->>'username', u->>'display_name')
    ON CONFLICT (id) DO NOTHING;

    -- friendship with Ryan
    INSERT INTO public.friendships (requester_id, addressee_id, status)
    VALUES (ryan_id, (u->>'id')::uuid, 'accepted')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
