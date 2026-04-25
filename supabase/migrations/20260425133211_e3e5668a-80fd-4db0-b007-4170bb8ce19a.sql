-- Insert demo auth users; the handle_new_user trigger will create profiles
DO $$
DECLARE
  demo_users jsonb := '[
    {"id":"b1111111-1111-1111-1111-111111111111","email":"alex.demo@linkup.test","username":"alexkim","name":"Alex Kim"},
    {"id":"b2222222-2222-2222-2222-222222222222","email":"maya.demo@linkup.test","username":"mayapatel","name":"Maya Patel"},
    {"id":"b3333333-3333-3333-3333-333333333333","email":"jordan.demo@linkup.test","username":"jordanlee","name":"Jordan Lee"},
    {"id":"b4444444-4444-4444-4444-444444444444","email":"sofia.demo@linkup.test","username":"sofiagarcia","name":"Sofia Garcia"},
    {"id":"b5555555-5555-5555-5555-555555555555","email":"ethan.demo@linkup.test","username":"ethanwong","name":"Ethan Wong"},
    {"id":"b6666666-6666-6666-6666-666666666666","email":"chloe.demo@linkup.test","username":"chloebrown","name":"Chloe Brown"},
    {"id":"b7777777-7777-7777-7777-777777777777","email":"marcus.demo@linkup.test","username":"marcusj","name":"Marcus Johnson"},
    {"id":"b8888888-8888-8888-8888-888888888888","email":"priya.demo@linkup.test","username":"priyas","name":"Priya Shah"}
  ]'::jsonb;
  rec jsonb;
BEGIN
  FOR rec IN SELECT * FROM jsonb_array_elements(demo_users) LOOP
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      (rec->>'id')::uuid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated','authenticated',
      rec->>'email',
      crypt('demo-password-not-real', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('username', rec->>'username', 'display_name', rec->>'name'),
      '', '', '', ''
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- RSVP all demo guests as "going" to all 3 demo events
INSERT INTO public.rsvps (event_id, user_id, status)
SELECT e.id, p.id, 'going'::rsvp_status
FROM public.profiles p
CROSS JOIN public.events e
WHERE p.id IN (
  'b1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'b3333333-3333-3333-3333-333333333333',
  'b4444444-4444-4444-4444-444444444444',
  'b5555555-5555-5555-5555-555555555555',
  'b6666666-6666-6666-6666-666666666666',
  'b7777777-7777-7777-7777-777777777777',
  'b8888888-8888-8888-8888-888888888888'
)
AND e.id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
)
ON CONFLICT DO NOTHING;