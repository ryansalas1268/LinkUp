-- =====================================================================
-- LINKUP DEMO SEED — re-tied to the currently signed-in user
-- =====================================================================
DO $$
DECLARE
  me_id uuid := 'a64682e2-f65f-4436-9007-1425ab98b4b2';
  -- Friends
  lydia uuid := 'a1111111-1111-1111-1111-111111111111';
  nabil uuid := 'a2222222-2222-2222-2222-222222222222';
  lauren uuid := 'a3333333-3333-3333-3333-333333333333';
  sara uuid := 'a4444444-4444-4444-4444-444444444444';
  alex uuid := 'b1111111-1111-1111-1111-111111111111';
  maya uuid := 'b2222222-2222-2222-2222-222222222222';
  jordan uuid := 'b3333333-3333-3333-3333-333333333333';
  sofia uuid := 'b4444444-4444-4444-4444-444444444444';
  -- Events
  ev_dinner uuid := '11111111-1111-1111-1111-111111111111';
  ev_volley uuid := '22222222-2222-2222-2222-222222222222';
  ev_potluck uuid := '33333333-3333-3333-3333-333333333333';
  -- Conversations
  conv_dinner uuid;
  conv_volley uuid;
  conv_potluck uuid;
  conv_dm uuid;
  friend record;
  demo_users jsonb := '[
    {"id":"a1111111-1111-1111-1111-111111111111","username":"lydialiu","name":"Lydia Liu","email":"lydia.demo@linkup.local"},
    {"id":"a2222222-2222-2222-2222-222222222222","username":"nabilali","name":"Nabil Ali","email":"nabil.demo@linkup.local"},
    {"id":"a3333333-3333-3333-3333-333333333333","username":"laurenyeo","name":"Lauren Yeo","email":"lauren.demo@linkup.local"},
    {"id":"a4444444-4444-4444-4444-444444444444","username":"sarahu","name":"Sara Hu","email":"sara.demo@linkup.local"},
    {"id":"b1111111-1111-1111-1111-111111111111","username":"alexkim","name":"Alex Kim","email":"alex.demo@linkup.test"},
    {"id":"b2222222-2222-2222-2222-222222222222","username":"mayapatel","name":"Maya Patel","email":"maya.demo@linkup.test"},
    {"id":"b3333333-3333-3333-3333-333333333333","username":"jordanlee","name":"Jordan Lee","email":"jordan.demo@linkup.test"},
    {"id":"b4444444-4444-4444-4444-444444444444","username":"sofiagarcia","name":"Sofia Garcia","email":"sofia.demo@linkup.test"}
  ]'::jsonb;
  rec jsonb;
BEGIN
  -- 1) Demo auth users + profiles + friendship to me
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

    INSERT INTO public.profiles (id, username, display_name)
    VALUES ((rec->>'id')::uuid, rec->>'username', rec->>'name')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.friendships (requester_id, addressee_id, status)
    VALUES (me_id, (rec->>'id')::uuid, 'accepted')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- 2) Events hosted by me
  INSERT INTO public.events (id, host_id, title, description, location, scheduled_at)
  VALUES
    (ev_dinner, me_id, 'Sunset Rooftop Dinner', 'Casual dinner with great views and good people 🌅', 'The Rooftop, 14th St NW, Washington DC', now() + interval '5 days' + interval '19 hours'),
    (ev_volley, me_id, 'Beach Volleyball Saturday', 'Pickup games + snacks. Bring sunscreen!', 'East Potomac Park', now() + interval '12 days' + interval '11 hours'),
    (ev_potluck, me_id, 'Friendsgiving Potluck', 'Bring one dish to share. We have turkey covered 🦃', 'My place — 2200 G St NW', now() + interval '20 days' + interval '18 hours')
  ON CONFLICT (id) DO UPDATE
    SET title = EXCLUDED.title,
        description = EXCLUDED.description,
        location = EXCLUDED.location,
        scheduled_at = EXCLUDED.scheduled_at,
        host_id = EXCLUDED.host_id;

  -- 3) RSVPs for friends → going
  INSERT INTO public.rsvps (event_id, user_id, status)
  SELECT e_id, f_id, 'going'::rsvp_status FROM (
    VALUES
      (ev_dinner, lydia), (ev_dinner, nabil), (ev_dinner, lauren), (ev_dinner, sara),
      (ev_dinner, alex), (ev_dinner, maya),
      (ev_volley, nabil), (ev_volley, jordan), (ev_volley, sofia), (ev_volley, alex), (ev_volley, sara),
      (ev_potluck, lydia), (ev_potluck, lauren), (ev_potluck, maya), (ev_potluck, sofia), (ev_potluck, jordan), (ev_potluck, alex)
  ) AS t(e_id, f_id)
  ON CONFLICT DO NOTHING;

  -- 4) Tasks
  INSERT INTO public.tasks (event_id, created_by, assigned_to, task_name, priority, completed) VALUES
    (ev_dinner, me_id, me_id, 'Reserve rooftop table for 8', 'high', true),
    (ev_dinner, me_id, lydia, 'Bring wine 🍷', 'med', false),
    (ev_dinner, me_id, nabil, 'Make reservation playlist', 'low', false),
    (ev_volley, me_id, me_id, 'Reserve volleyball court', 'high', false),
    (ev_volley, me_id, jordan, 'Bring volleyball + net', 'high', false),
    (ev_volley, me_id, sofia, 'Pack snacks & water', 'med', false),
    (ev_potluck, me_id, me_id, 'Buy turkey', 'high', false),
    (ev_potluck, me_id, lauren, 'Bring dessert', 'med', false),
    (ev_potluck, me_id, alex, 'Bring drinks', 'med', false),
    (ev_potluck, me_id, maya, 'Decorations', 'low', false);

  -- 5) Expenses
  INSERT INTO public.expenses (event_id, paid_by, title, amount, notes) VALUES
    (ev_dinner, me_id, 'Rooftop deposit', 80.00, 'Refundable hold'),
    (ev_dinner, lydia, 'Wine for the table', 45.00, '3 bottles'),
    (ev_volley, jordan, 'Snacks + Gatorade', 32.50, 'Costco run'),
    (ev_potluck, me_id, 'Turkey + sides', 95.00, 'Whole Foods');

  -- 6) Time proposals (calendar voting)
  INSERT INTO public.time_proposals (event_id, proposed_by, proposed_time, label) VALUES
    (ev_volley, me_id, now() + interval '12 days' + interval '10 hours', 'Saturday 10 AM'),
    (ev_volley, jordan, now() + interval '12 days' + interval '14 hours', 'Saturday 2 PM'),
    (ev_volley, sofia, now() + interval '13 days' + interval '11 hours', 'Sunday 11 AM');

  -- 7) Event group chats with sample messages
  INSERT INTO public.conversations (id, is_direct, title, event_id) VALUES
    (gen_random_uuid(), false, 'Sunset Rooftop Dinner', ev_dinner)
  RETURNING id INTO conv_dinner;

  INSERT INTO public.conversations (id, is_direct, title, event_id) VALUES
    (gen_random_uuid(), false, 'Beach Volleyball Saturday', ev_volley)
  RETURNING id INTO conv_volley;

  INSERT INTO public.conversations (id, is_direct, title, event_id) VALUES
    (gen_random_uuid(), false, 'Friendsgiving Potluck', ev_potluck)
  RETURNING id INTO conv_potluck;

  INSERT INTO public.conversation_members (conversation_id, user_id) VALUES
    (conv_dinner, me_id), (conv_dinner, lydia), (conv_dinner, nabil), (conv_dinner, lauren), (conv_dinner, sara), (conv_dinner, alex), (conv_dinner, maya),
    (conv_volley, me_id), (conv_volley, nabil), (conv_volley, jordan), (conv_volley, sofia), (conv_volley, alex), (conv_volley, sara),
    (conv_potluck, me_id), (conv_potluck, lydia), (conv_potluck, lauren), (conv_potluck, maya), (conv_potluck, sofia), (conv_potluck, jordan), (conv_potluck, alex)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.messages (conversation_id, sender_id, body, created_at) VALUES
    (conv_dinner, me_id, 'Hey everyone! Booked the rooftop for 8 — see you Friday at 7!', now() - interval '2 days'),
    (conv_dinner, lydia, 'Yesss can''t wait 🥂 I''ll bring wine', now() - interval '2 days' + interval '5 minutes'),
    (conv_dinner, nabil, 'I got the playlist 🎶', now() - interval '1 day'),
    (conv_dinner, sara, 'Should we do dress code or no?', now() - interval '6 hours'),
    (conv_volley, me_id, 'Court is reserved! Saturday 11 AM ☀️', now() - interval '3 days'),
    (conv_volley, jordan, 'Bringing the ball + net', now() - interval '3 days' + interval '10 minutes'),
    (conv_volley, sofia, 'I''ll grab waters and orange slices 🍊', now() - interval '2 days'),
    (conv_potluck, me_id, 'Sign-up for dishes — drop yours below 👇', now() - interval '4 days'),
    (conv_potluck, lauren, 'Pumpkin pie 🥧', now() - interval '4 days' + interval '3 minutes'),
    (conv_potluck, alex, 'Drinks (wine + cider)', now() - interval '4 days' + interval '7 minutes'),
    (conv_potluck, maya, 'Decorations + flowers 🌻', now() - interval '3 days');

  -- 8) Direct messages with each friend
  FOR friend IN
    SELECT * FROM (VALUES
      (lydia, 'Lydia', 'Hey! Excited for Friday 🥳'),
      (nabil, 'Nabil', 'Send me the rooftop address again?'),
      (lauren, 'Lauren', 'Pumpkin pie or pecan? 👀'),
      (sara, 'Sara', 'Want to carpool to the rooftop?'),
      (alex, 'Alex', 'I''ll swing by with drinks 🍻'),
      (maya, 'Maya', 'Bringing fresh flowers — what colors?'),
      (jordan, 'Jordan', 'Court reserved — confirmed!'),
      (sofia, 'Sofia', 'Sunday volleyball still on?')
    ) AS f(fid, fname, msg)
  LOOP
    INSERT INTO public.conversations (is_direct, title) VALUES (true, NULL)
    RETURNING id INTO conv_dm;
    INSERT INTO public.conversation_members (conversation_id, user_id) VALUES
      (conv_dm, me_id), (conv_dm, friend.fid);
    INSERT INTO public.messages (conversation_id, sender_id, body, created_at) VALUES
      (conv_dm, friend.fid, friend.msg, now() - interval '1 day'),
      (conv_dm, me_id, 'Sounds good! 🙌', now() - interval '20 hours');
  END LOOP;
END $$;