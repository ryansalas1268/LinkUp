CREATE OR REPLACE FUNCTION public.seed_demo_for_user(me_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  lydia uuid := 'a1111111-1111-1111-1111-111111111111';
  nabil uuid := 'a2222222-2222-2222-2222-222222222222';
  lauren uuid := 'a3333333-3333-3333-3333-333333333333';
  sara uuid := 'a4444444-4444-4444-4444-444444444444';
  alex uuid := 'b1111111-1111-1111-1111-111111111111';
  maya uuid := 'b2222222-2222-2222-2222-222222222222';
  jordan uuid := 'b3333333-3333-3333-3333-333333333333';
  sofia uuid := 'b4444444-4444-4444-4444-444444444444';
  ev_dinner uuid := gen_random_uuid();
  ev_volley uuid := gen_random_uuid();
  ev_potluck uuid := gen_random_uuid();
  ev_picnic uuid := gen_random_uuid();
  ev_brunch uuid := gen_random_uuid();
  ev_japan uuid := gen_random_uuid();
  conv_dinner uuid;
  conv_volley uuid;
  conv_potluck uuid;
  conv_picnic uuid;
  conv_brunch uuid;
  conv_japan uuid;
  conv_dm uuid;
  yr int := extract(year from now())::int;
  picnic_at timestamptz;
  brunch_at timestamptz;
  japan_at timestamptz;
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
  picnic_at := make_timestamptz(CASE WHEN now() >= make_timestamptz(yr, 4, 6, 0, 0, 0) THEN yr ELSE yr - 1 END, 4, 5, 13, 0, 0);
  brunch_at := make_timestamptz(CASE WHEN now() >= make_timestamptz(yr, 4, 13, 0, 0, 0) THEN yr ELSE yr - 1 END, 4, 12, 11, 0, 0);
  japan_at := now() + interval '60 days' + interval '14 hours';

  -- 1) Demo friends + profiles + friendships
  FOR rec IN SELECT * FROM jsonb_array_elements(demo_users) LOOP
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      (rec->>'id')::uuid, '00000000-0000-0000-0000-000000000000',
      'authenticated','authenticated', rec->>'email',
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

  -- 2) Events (3 upcoming + 2 past April + 1 Japan trip)
  INSERT INTO public.events (id, host_id, title, description, location, scheduled_at, ended_at) VALUES
    (ev_dinner, me_id, 'Sunset Rooftop Dinner', 'Casual dinner with great views and good people 🌅', 'The Rooftop, 14th St NW, Washington DC', now() + interval '5 days' + interval '19 hours', NULL),
    (ev_volley, me_id, 'Beach Volleyball Saturday', 'Pickup games + snacks. Bring sunscreen!', 'East Potomac Park', now() + interval '12 days' + interval '11 hours', NULL),
    (ev_potluck, me_id, 'Friendsgiving Potluck', 'Bring one dish to share. We have turkey covered 🦃', 'My place — 2200 G St NW', now() + interval '20 days' + interval '18 hours', NULL),
    (ev_picnic, me_id, 'Cherry Blossom Picnic', 'Spring picnic under the cherry blossoms 🌸 — bring a blanket!', 'Tidal Basin, Washington DC', picnic_at, picnic_at + interval '3 hours'),
    (ev_brunch, me_id, 'Spring Brunch', 'Mimosas + pancakes ☀️ Catch up after midterms.', 'Founding Farmers, Foggy Bottom', brunch_at, brunch_at + interval '2 hours'),
    (ev_japan, me_id, 'Tokyo Trip 🇯🇵', E'10-day group trip to Japan! Tokyo → Kyoto → Osaka. Cherry blossoms, ramen, karaoke, day trip to Mt. Fuji. Splitting Airbnbs and JR passes.\n\n📅 Itinerary draft\n• Days 1-4: Tokyo (Shibuya, Shinjuku, Akihabara, teamLab)\n• Days 5-7: Kyoto (Fushimi Inari, Arashiyama bamboo, tea ceremony)\n• Days 8-10: Osaka (Dotonbori food tour, Universal Studios)', 'Tokyo, Japan', japan_at, NULL);

  -- 3) RSVPs
  INSERT INTO public.rsvps (event_id, user_id, status) VALUES
    (ev_dinner, lydia, 'going'), (ev_dinner, nabil, 'going'), (ev_dinner, lauren, 'going'), (ev_dinner, sara, 'going'), (ev_dinner, alex, 'going'), (ev_dinner, maya, 'going'),
    (ev_volley, nabil, 'going'), (ev_volley, jordan, 'going'), (ev_volley, sofia, 'going'), (ev_volley, alex, 'going'), (ev_volley, sara, 'going'),
    (ev_potluck, lydia, 'going'), (ev_potluck, lauren, 'going'), (ev_potluck, maya, 'going'), (ev_potluck, sofia, 'going'), (ev_potluck, jordan, 'going'), (ev_potluck, alex, 'going'),
    (ev_picnic, lydia, 'going'), (ev_picnic, lauren, 'going'), (ev_picnic, sara, 'going'), (ev_picnic, maya, 'going'), (ev_picnic, sofia, 'going'),
    (ev_brunch, nabil, 'going'), (ev_brunch, alex, 'going'), (ev_brunch, jordan, 'going'), (ev_brunch, lydia, 'going'),
    (ev_japan, lydia, 'going'), (ev_japan, nabil, 'going'), (ev_japan, lauren, 'going'), (ev_japan, sara, 'going'), (ev_japan, maya, 'maybe'), (ev_japan, alex, 'maybe')
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
    (ev_potluck, me_id, maya, 'Decorations', 'low', false),
    (ev_picnic, me_id, me_id, 'Pack blanket + speaker', 'med', true),
    (ev_picnic, me_id, lauren, 'Bring sandwiches', 'med', true),
    (ev_brunch, me_id, me_id, 'Make reservation', 'high', true),
    (ev_japan, me_id, me_id, 'Book group flights ✈️', 'high', true),
    (ev_japan, me_id, me_id, 'Reserve Airbnb in Shinjuku', 'high', true),
    (ev_japan, me_id, lydia, 'Buy JR Rail passes (7-day)', 'high', false),
    (ev_japan, me_id, nabil, 'Reserve teamLab Planets tickets', 'med', false),
    (ev_japan, me_id, lauren, 'Book Mt. Fuji day tour', 'med', false),
    (ev_japan, me_id, sara, 'Make Kyoto ryokan reservation', 'med', false),
    (ev_japan, me_id, me_id, 'Get pocket wifi for the group', 'low', false);

  -- 5) Expenses
  INSERT INTO public.expenses (event_id, paid_by, title, amount, notes) VALUES
    (ev_dinner, me_id, 'Rooftop deposit', 80.00, 'Refundable hold'),
    (ev_dinner, lydia, 'Wine for the table', 45.00, '3 bottles'),
    (ev_volley, jordan, 'Snacks + Gatorade', 32.50, 'Costco run'),
    (ev_potluck, me_id, 'Turkey + sides', 95.00, 'Whole Foods'),
    (ev_picnic, me_id, 'Picnic spread', 48.00, 'Trader Joe''s'),
    (ev_brunch, me_id, 'Brunch tab (split)', 142.00, 'Founding Farmers'),
    (ev_japan, me_id, 'Airbnb deposit (Tokyo)', 600.00, '4 nights, 6 people'),
    (ev_japan, me_id, 'Group flight booking fee', 80.00, 'Travel agent service'),
    (ev_japan, lydia, 'JR Rail passes', 1680.00, '6 × 7-day passes');

  -- 6) Time proposals
  INSERT INTO public.time_proposals (event_id, proposed_by, proposed_time, label) VALUES
    (ev_volley, me_id, now() + interval '12 days' + interval '10 hours', 'Saturday 10 AM'),
    (ev_volley, jordan, now() + interval '12 days' + interval '14 hours', 'Saturday 2 PM'),
    (ev_volley, sofia, now() + interval '13 days' + interval '11 hours', 'Sunday 11 AM'),
    (ev_japan, me_id, now() + interval '60 days', 'Depart in 2 months'),
    (ev_japan, lydia, now() + interval '90 days', 'Depart in 3 months (cheaper flights)');

  -- 7) Group chats per event
  INSERT INTO public.conversations (is_direct, title, event_id) VALUES (false, 'Sunset Rooftop Dinner', ev_dinner) RETURNING id INTO conv_dinner;
  INSERT INTO public.conversations (is_direct, title, event_id) VALUES (false, 'Beach Volleyball Saturday', ev_volley) RETURNING id INTO conv_volley;
  INSERT INTO public.conversations (is_direct, title, event_id) VALUES (false, 'Friendsgiving Potluck', ev_potluck) RETURNING id INTO conv_potluck;
  INSERT INTO public.conversations (is_direct, title, event_id) VALUES (false, 'Cherry Blossom Picnic', ev_picnic) RETURNING id INTO conv_picnic;
  INSERT INTO public.conversations (is_direct, title, event_id) VALUES (false, 'Spring Brunch', ev_brunch) RETURNING id INTO conv_brunch;
  INSERT INTO public.conversations (is_direct, title, event_id) VALUES (false, 'Tokyo Trip 🇯🇵', ev_japan) RETURNING id INTO conv_japan;

  INSERT INTO public.conversation_members (conversation_id, user_id) VALUES
    (conv_dinner, me_id), (conv_dinner, lydia), (conv_dinner, nabil), (conv_dinner, lauren), (conv_dinner, sara), (conv_dinner, alex), (conv_dinner, maya),
    (conv_volley, me_id), (conv_volley, nabil), (conv_volley, jordan), (conv_volley, sofia), (conv_volley, alex), (conv_volley, sara),
    (conv_potluck, me_id), (conv_potluck, lydia), (conv_potluck, lauren), (conv_potluck, maya), (conv_potluck, sofia), (conv_potluck, jordan), (conv_potluck, alex),
    (conv_picnic, me_id), (conv_picnic, lydia), (conv_picnic, lauren), (conv_picnic, sara), (conv_picnic, maya), (conv_picnic, sofia),
    (conv_brunch, me_id), (conv_brunch, nabil), (conv_brunch, alex), (conv_brunch, jordan), (conv_brunch, lydia),
    (conv_japan, me_id), (conv_japan, lydia), (conv_japan, nabil), (conv_japan, lauren), (conv_japan, sara), (conv_japan, maya), (conv_japan, alex)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.messages (conversation_id, sender_id, body, created_at) VALUES
    (conv_dinner, me_id, 'Hey everyone! Booked the rooftop for 8 — see you Friday at 7!', now() - interval '2 days'),
    (conv_dinner, lydia, 'Yesss can''t wait 🥂 I''ll bring wine', now() - interval '2 days' + interval '5 minutes'),
    (conv_dinner, nabil, 'I got the playlist 🎶', now() - interval '1 day'),
    (conv_volley, me_id, 'Court is reserved! Saturday 11 AM ☀️', now() - interval '3 days'),
    (conv_volley, jordan, 'Bringing the ball + net', now() - interval '3 days' + interval '10 minutes'),
    (conv_potluck, me_id, 'Sign-up for dishes — drop yours below 👇', now() - interval '4 days'),
    (conv_potluck, lauren, 'Pumpkin pie 🥧', now() - interval '4 days' + interval '3 minutes'),
    (conv_picnic, me_id, 'Blossoms peaked early — best day ever 🌸', picnic_at + interval '4 hours'),
    (conv_picnic, lauren, 'The sandwiches were a hit 🥪', picnic_at + interval '5 hours'),
    (conv_brunch, me_id, 'Brunch was unreal. Same time next month?', brunch_at + interval '3 hours'),
    (conv_brunch, alex, 'Pancakes >>> ', brunch_at + interval '3 hours' + interval '5 minutes'),
    (conv_japan, me_id, 'JAPAN IS HAPPENING 🇯🇵🎉 Flights booked for the 6 of us!', now() - interval '7 days'),
    (conv_japan, lydia, 'AHHHH I can''t believe it. Already learning hiragana 🥹', now() - interval '7 days' + interval '10 minutes'),
    (conv_japan, nabil, 'Adding teamLab + Mt Fuji to the list', now() - interval '6 days'),
    (conv_japan, lauren, 'Kyoto ryokan suggestions?? 🏯', now() - interval '5 days'),
    (conv_japan, sara, 'I''ll handle Kyoto — got a great one near Gion', now() - interval '5 days' + interval '15 minutes'),
    (conv_japan, me_id, 'Airbnb deposit is in. Drop $100 each into Venmo when you can 🙏', now() - interval '2 days'),
    (conv_japan, maya, 'Just sent! 💸', now() - interval '1 day');

  -- 8) Direct chats
  FOR friend IN
    SELECT * FROM (VALUES
      (lydia, 'Hey! Excited for Friday 🥳'),
      (nabil, 'Send me the rooftop address again?'),
      (lauren, 'Pumpkin pie or pecan? 👀'),
      (sara, 'Want to carpool to the rooftop?'),
      (alex, 'I''ll swing by with drinks 🍻'),
      (maya, 'Bringing fresh flowers — what colors?'),
      (jordan, 'Court reserved — confirmed!'),
      (sofia, 'Sunday volleyball still on?')
    ) AS f(fid, msg)
  LOOP
    INSERT INTO public.conversations (is_direct, title) VALUES (true, NULL) RETURNING id INTO conv_dm;
    INSERT INTO public.conversation_members (conversation_id, user_id) VALUES (conv_dm, me_id), (conv_dm, friend.fid);
    INSERT INTO public.messages (conversation_id, sender_id, body, created_at) VALUES
      (conv_dm, friend.fid, friend.msg, now() - interval '1 day'),
      (conv_dm, me_id, 'Sounds good! 🙌', now() - interval '20 hours');
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'seed_demo_for_user failed for %: % %', me_id, SQLERRM, SQLSTATE;
END;
$function$;

-- Add Tokyo Trip to current user immediately so it shows up without re-signup
DO $$
DECLARE
  me_id uuid := 'a64682e2-f65f-4436-9007-1425ab98b4b2';
  lydia uuid := 'a1111111-1111-1111-1111-111111111111';
  nabil uuid := 'a2222222-2222-2222-2222-222222222222';
  lauren uuid := 'a3333333-3333-3333-3333-333333333333';
  sara uuid := 'a4444444-4444-4444-4444-444444444444';
  alex uuid := 'b1111111-1111-1111-1111-111111111111';
  maya uuid := 'b2222222-2222-2222-2222-222222222222';
  ev_japan uuid := gen_random_uuid();
  conv_japan uuid;
  japan_at timestamptz := now() + interval '60 days' + interval '14 hours';
BEGIN
  -- Skip if user already has a Tokyo Trip
  IF EXISTS (SELECT 1 FROM public.events WHERE host_id = me_id AND title = 'Tokyo Trip 🇯🇵') THEN
    RETURN;
  END IF;

  INSERT INTO public.events (id, host_id, title, description, location, scheduled_at) VALUES
    (ev_japan, me_id, 'Tokyo Trip 🇯🇵', E'10-day group trip to Japan! Tokyo → Kyoto → Osaka. Cherry blossoms, ramen, karaoke, day trip to Mt. Fuji. Splitting Airbnbs and JR passes.\n\n📅 Itinerary draft\n• Days 1-4: Tokyo (Shibuya, Shinjuku, Akihabara, teamLab)\n• Days 5-7: Kyoto (Fushimi Inari, Arashiyama bamboo, tea ceremony)\n• Days 8-10: Osaka (Dotonbori food tour, Universal Studios)', 'Tokyo, Japan', japan_at);

  INSERT INTO public.rsvps (event_id, user_id, status) VALUES
    (ev_japan, lydia, 'going'), (ev_japan, nabil, 'going'), (ev_japan, lauren, 'going'),
    (ev_japan, sara, 'going'), (ev_japan, maya, 'maybe'), (ev_japan, alex, 'maybe');

  INSERT INTO public.tasks (event_id, created_by, assigned_to, task_name, priority, completed) VALUES
    (ev_japan, me_id, me_id, 'Book group flights ✈️', 'high', true),
    (ev_japan, me_id, me_id, 'Reserve Airbnb in Shinjuku', 'high', true),
    (ev_japan, me_id, lydia, 'Buy JR Rail passes (7-day)', 'high', false),
    (ev_japan, me_id, nabil, 'Reserve teamLab Planets tickets', 'med', false),
    (ev_japan, me_id, lauren, 'Book Mt. Fuji day tour', 'med', false),
    (ev_japan, me_id, sara, 'Make Kyoto ryokan reservation', 'med', false),
    (ev_japan, me_id, me_id, 'Get pocket wifi for the group', 'low', false);

  INSERT INTO public.expenses (event_id, paid_by, title, amount, notes) VALUES
    (ev_japan, me_id, 'Airbnb deposit (Tokyo)', 600.00, '4 nights, 6 people'),
    (ev_japan, me_id, 'Group flight booking fee', 80.00, 'Travel agent service'),
    (ev_japan, lydia, 'JR Rail passes', 1680.00, '6 × 7-day passes');

  INSERT INTO public.time_proposals (event_id, proposed_by, proposed_time, label) VALUES
    (ev_japan, me_id, now() + interval '60 days', 'Depart in 2 months'),
    (ev_japan, lydia, now() + interval '90 days', 'Depart in 3 months (cheaper flights)');

  INSERT INTO public.conversations (is_direct, title, event_id) VALUES (false, 'Tokyo Trip 🇯🇵', ev_japan) RETURNING id INTO conv_japan;
  INSERT INTO public.conversation_members (conversation_id, user_id) VALUES
    (conv_japan, me_id), (conv_japan, lydia), (conv_japan, nabil), (conv_japan, lauren),
    (conv_japan, sara), (conv_japan, maya), (conv_japan, alex);

  INSERT INTO public.messages (conversation_id, sender_id, body, created_at) VALUES
    (conv_japan, me_id, 'JAPAN IS HAPPENING 🇯🇵🎉 Flights booked for the 6 of us!', now() - interval '7 days'),
    (conv_japan, lydia, 'AHHHH I can''t believe it. Already learning hiragana 🥹', now() - interval '7 days' + interval '10 minutes'),
    (conv_japan, nabil, 'Adding teamLab + Mt Fuji to the list', now() - interval '6 days'),
    (conv_japan, lauren, 'Kyoto ryokan suggestions?? 🏯', now() - interval '5 days'),
    (conv_japan, sara, 'I''ll handle Kyoto — got a great one near Gion', now() - interval '5 days' + interval '15 minutes'),
    (conv_japan, me_id, 'Airbnb deposit is in. Drop $100 each into Venmo when you can 🙏', now() - interval '2 days'),
    (conv_japan, maya, 'Just sent! 💸', now() - interval '1 day');
END $$;