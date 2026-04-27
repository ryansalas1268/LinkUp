-- =====================================================================
-- Auto-seed demo content for every new signup
-- =====================================================================
CREATE OR REPLACE FUNCTION public.seed_demo_for_user(me_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  -- 1) Ensure demo friend accounts + profiles exist, accept friendships
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

  -- 2) Events
  INSERT INTO public.events (id, host_id, title, description, location, scheduled_at) VALUES
    (ev_dinner, me_id, 'Sunset Rooftop Dinner', 'Casual dinner with great views and good people 🌅', 'The Rooftop, 14th St NW, Washington DC', now() + interval '5 days' + interval '19 hours'),
    (ev_volley, me_id, 'Beach Volleyball Saturday', 'Pickup games + snacks. Bring sunscreen!', 'East Potomac Park', now() + interval '12 days' + interval '11 hours'),
    (ev_potluck, me_id, 'Friendsgiving Potluck', 'Bring one dish to share. We have turkey covered 🦃', 'My place — 2200 G St NW', now() + interval '20 days' + interval '18 hours');

  -- 3) RSVPs
  INSERT INTO public.rsvps (event_id, user_id, status) VALUES
    (ev_dinner, lydia, 'going'), (ev_dinner, nabil, 'going'), (ev_dinner, lauren, 'going'), (ev_dinner, sara, 'going'), (ev_dinner, alex, 'going'), (ev_dinner, maya, 'going'),
    (ev_volley, nabil, 'going'), (ev_volley, jordan, 'going'), (ev_volley, sofia, 'going'), (ev_volley, alex, 'going'), (ev_volley, sara, 'going'),
    (ev_potluck, lydia, 'going'), (ev_potluck, lauren, 'going'), (ev_potluck, maya, 'going'), (ev_potluck, sofia, 'going'), (ev_potluck, jordan, 'going'), (ev_potluck, alex, 'going')
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

  -- 6) Time proposals
  INSERT INTO public.time_proposals (event_id, proposed_by, proposed_time, label) VALUES
    (ev_volley, me_id, now() + interval '12 days' + interval '10 hours', 'Saturday 10 AM'),
    (ev_volley, jordan, now() + interval '12 days' + interval '14 hours', 'Saturday 2 PM'),
    (ev_volley, sofia, now() + interval '13 days' + interval '11 hours', 'Sunday 11 AM');

  -- 7) Event group chats
  INSERT INTO public.conversations (is_direct, title, event_id) VALUES (false, 'Sunset Rooftop Dinner', ev_dinner) RETURNING id INTO conv_dinner;
  INSERT INTO public.conversations (is_direct, title, event_id) VALUES (false, 'Beach Volleyball Saturday', ev_volley) RETURNING id INTO conv_volley;
  INSERT INTO public.conversations (is_direct, title, event_id) VALUES (false, 'Friendsgiving Potluck', ev_potluck) RETURNING id INTO conv_potluck;

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

  -- 8) Direct chats with each friend
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
$$;

-- Wrap handle_new_user to also seed demo content, but skip when the new
-- user IS one of the demo friend accounts (avoid recursion / self-seeding)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  base_username text;
  final_username text;
  counter int := 0;
  demo_ids uuid[] := ARRAY[
    'a1111111-1111-1111-1111-111111111111'::uuid,
    'a2222222-2222-2222-2222-222222222222'::uuid,
    'a3333333-3333-3333-3333-333333333333'::uuid,
    'a4444444-4444-4444-4444-444444444444'::uuid,
    'b1111111-1111-1111-1111-111111111111'::uuid,
    'b2222222-2222-2222-2222-222222222222'::uuid,
    'b3333333-3333-3333-3333-333333333333'::uuid,
    'b4444444-4444-4444-4444-444444444444'::uuid
  ];
begin
  base_username := regexp_replace(lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))), '[^a-z0-9_]', '', 'g');
  if base_username = '' then base_username := 'user'; end if;
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    counter := counter + 1;
    final_username := base_username || counter::text;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', final_username),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  -- Auto-seed demo content for non-demo accounts
  if not (new.id = ANY(demo_ids)) then
    perform public.seed_demo_for_user(new.id);
  end if;

  return new;
end;
$function$;

-- Make sure the trigger is attached (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();