
DO $$
DECLARE
  ryan_id uuid := '7fc8b61a-eae2-4516-b9c7-0e11ea78147a';
  rf_id uuid := 'a5555555-5555-5555-5555-555555555555';
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    rf_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'removefriend.demo@linkup.local',
    crypt('demo-password-removefriend', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"removefriend","display_name":"Demo Friend"}'::jsonb,
    now(), now(), '', '', '', ''
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (rf_id, 'removefriend', 'Demo Friend')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.friendships (requester_id, addressee_id, status)
  VALUES (ryan_id, rf_id, 'accepted')
  ON CONFLICT DO NOTHING;
END $$;
