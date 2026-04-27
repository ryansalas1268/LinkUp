CREATE OR REPLACE FUNCTION public.seed_demo_for_user(me_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  lydia uuid;  nabil uuid;  lauren uuid;  sara uuid;
  alex uuid;   maya uuid;   jordan uuid;  sofia uuid;
  ev_dinner uuid := gen_random_uuid();
  ev_volley uuid := gen_random_uuid();
  ev_potluck uuid := gen_random_uuid();
  ev_picnic uuid := gen_random_uuid();
  ev_brunch uuid := gen_random_uuid();
  ev_japan uuid := gen_random_uuid();
  picnic_at timestamptz := (date_trunc('year', now()) + interval '3 months' + interval '12 days' + interval '14 hours');
  brunch_at timestamptz := (date_trunc('year', now()) + interval '3 months' + interval '21 days' + interval '11 hours');
  japan_at timestamptz  := now() + interval '60 days';
  conv_dinner uuid := gen_random_uuid();
  conv_volley uuid := gen_random_uuid();
  conv_potluck uuid := gen_random_uuid();
  conv_picnic uuid := gen_random_uuid();
  conv_brunch uuid := gen_random_uuid();
  conv_japan uuid := gen_random_uuid();
BEGIN
  IF EXISTS (SELECT 1 FROM public.events WHERE host_id = me_id LIMIT 1) THEN
    RETURN;
  END IF;

  lydia  := gen_random_uuid();
  nabil  := gen_random_uuid();
  lauren := gen_random_uuid();
  sara   := gen_random_uuid();
  alex   := gen_random_uuid();
  maya   := gen_random_uuid();
  jordan := gen_random_uuid();
  sofia  := gen_random_uuid();

  INSERT INTO public.profiles (id, username, display_name) VALUES
    (lydia, 'lydialiu', 'Lydia Liu'),
    (nabil, 'nabilali', 'Nabil Ali'),
    (lauren, 'laurenyeo', 'Lauren Yeo'),
    (sara, 'sarahu', 'Sara Hu'),
    (alex, 'alexkim', 'Alex Kim'),
    (maya, 'mayapatel', 'Maya Patel'),
    (jordan, 'jordanlee', 'Jordan Lee'),
    (sofia, 'sofiagarcia', 'Sofia Garcia')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.friendships (requester_id, addressee_id, status) VALUES
    (me_id, lydia, 'accepted'), (me_id, nabil, 'accepted'),
    (me_id, lauren, 'accepted'), (me_id, sara, 'accepted'),
    (me_id, alex, 'accepted'), (me_id, maya, 'accepted'),
    (me_id, jordan, 'accepted'), (me_id, sofia, 'accepted')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.events (id, host_id, title, description, location, scheduled_at, ended_at) VALUES
    (ev_dinner, me_id, 'Sunset Rooftop Dinner', 'Casual dinner with great views and good people 🌅', 'The Rooftop, 14th St NW, Washington DC', now() + interval '5 days' + interval '19 hours', NULL),
    (ev_volley, me_id, 'Beach Volleyball Saturday', 'Pickup games + snacks. Bring sunscreen!', 'East Potomac Park', now() + interval '12 days' + interval '11 hours', NULL),
    (ev_potluck, me_id, 'Friendsgiving Potluck', 'Bring one dish to share. We have turkey covered 🦃', 'My place — 2200 G St NW', now() + interval '20 days' + interval '18 hours', NULL),
    (ev_picnic, me_id, 'Cherry Blossom Picnic', 'Spring picnic under the cherry blossoms 🌸 — bring a blanket!', 'Tidal Basin, Washington DC', picnic_at, picnic_at + interval '3 hours'),
    (ev_brunch, me_id, 'Spring Brunch', 'Mimosas + pancakes ☀️ Catch up after midterms.', 'Founding Farmers, Foggy Bottom', brunch_at, brunch_at + interval '2 hours'),
    (ev_japan, me_id, 'Tokyo Trip 🇯🇵', E'10-day group trip to Japan! Tokyo → Kyoto → Osaka. Cherry blossoms, ramen, karaoke, day trip to Mt. Fuji. Splitting Airbnbs and JR passes.\n\n📅 Itinerary draft\n• Days 1-4: Tokyo (Shibuya, Shinjuku, Akihabara, teamLab)\n• Days 5-7: Kyoto (Fushimi Inari, Arashiyama bamboo, tea ceremony)\n• Days 8-10: Osaka (Dotonbori food tour, Universal Studios)', 'Tokyo, Japan', japan_at, NULL);

  INSERT INTO public.rsvps (event_id, user_id, status, checked_in_at, cancelled_at) VALUES
    (ev_dinner, lydia,  'going', NULL, NULL),
    (ev_dinner, nabil,  'going', NULL, NULL),
    (ev_dinner, lauren, 'going', NULL, NULL),
    (ev_dinner, sara,   'maybe', NULL, NULL),
    (ev_dinner, alex,   'going', NULL, NULL),
    (ev_dinner, maya,   'maybe', NULL, NULL),
    (ev_dinner, jordan, 'no',    NULL, NULL),
    (ev_dinner, sofia,  'going', NULL, NULL),
    (ev_volley, nabil,  'going', NULL, NULL),
    (ev_volley, jordan, 'maybe', NULL, NULL),
    (ev_volley, sofia,  'going', NULL, NULL),
    (ev_volley, alex,   'maybe', NULL, NULL),
    (ev_volley, sara,   'no',    NULL, NULL),
    (ev_volley, lydia,  'going', NULL, NULL),
    (ev_volley, maya,   'no',    NULL, NULL),
    (ev_potluck, lydia,  'going', NULL, NULL),
    (ev_potluck, lauren, 'going', NULL, NULL),
    (ev_potluck, maya,   'maybe', NULL, NULL),
    (ev_potluck, sofia,  'no',    NULL, NULL),
    (ev_potluck, jordan, 'no',    NULL, NULL),
    (ev_potluck, alex,   'going', NULL, NULL),
    (ev_potluck, nabil,  'going', NULL, NULL),
    (ev_potluck, sara,   'maybe', NULL, NULL),
    (ev_picnic, lydia,  'going', picnic_at + interval '15 minutes', NULL),
    (ev_picnic, lauren, 'going', picnic_at + interval '20 minutes', NULL),
    (ev_picnic, sara,   'going', NULL, picnic_at - interval '2 hours'),
    (ev_picnic, maya,   'no',    NULL, NULL),
    (ev_picnic, sofia,  'going', picnic_at + interval '30 minutes', NULL),
    (ev_picnic, nabil,  'going', picnic_at + interval '10 minutes', NULL),
    (ev_picnic, alex,   'maybe', NULL, NULL),
    (ev_picnic, jordan, 'no',    NULL, NULL),
    (ev_brunch, nabil,  'going', brunch_at + interval '5 minutes',  NULL),
    (ev_brunch, alex,   'going', brunch_at + interval '25 minutes', NULL),
    (ev_brunch, jordan, 'no',    NULL, NULL),
    (ev_brunch, lydia,  'going', brunch_at + interval '10 minutes', NULL),
    (ev_brunch, lauren, 'maybe', NULL, NULL),
    (ev_brunch, sara,   'no',    NULL, NULL),
    (ev_brunch, maya,   'maybe', NULL, NULL),
    (ev_brunch, sofia,  'going', brunch_at + interval '40 minutes', NULL),
    (ev_japan, lydia,  'going', NULL, NULL),
    (ev_japan, nabil,  'going', NULL, NULL),
    (ev_japan, lauren, 'maybe', NULL, NULL),
    (ev_japan, sara,   'no',    NULL, NULL),
    (ev_japan, maya,   'maybe', NULL, NULL),
    (ev_japan, alex,   'maybe', NULL, NULL),
    (ev_japan, jordan, 'no',    NULL, NULL),
    (ev_japan, sofia,  'maybe', NULL, NULL)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.tasks (event_id, created_by, assigned_to, task_name, priority, completed) VALUES
    (ev_dinner, me_id, me_id, 'Reserve rooftop table for 8', 'high', true),
    (ev_dinner, me_id, lydia, 'Bring wine 🍷', 'med', false),
    (ev_dinner, me_id, nabil, 'Make reservation playlist', 'low', false),
    (ev_volley, me_id, me_id, 'Reserve volleyball court', 'high', false),
    (ev_volley, me_id, jordan, 'Bring volleyball + net', 'high', false),
    (ev_volley, me_id, sofia, 'Snacks + drinks for 8', 'med', false),
    (ev_potluck, me_id, me_id, 'Cook the turkey 🦃', 'high', false),
    (ev_potluck, me_id, lauren, 'Bring dessert', 'med', false),
    (ev_potluck, me_id, maya, 'Bring sides (mac & cheese!)', 'med', false),
    (ev_japan, me_id, me_id, 'Book group flights', 'high', true),
    (ev_japan, me_id, lydia, 'Reserve Tokyo Airbnb (Days 1-4)', 'high', true),
    (ev_japan, me_id, nabil, 'Reserve Kyoto ryokan (Days 5-7)', 'high', false),
    (ev_japan, me_id, lauren, 'Buy JR Pass for everyone', 'high', false),
    (ev_japan, me_id, sara, 'Build day-by-day itinerary', 'med', false),
    (ev_japan, me_id, me_id, 'Get pocket WiFi rentals', 'low', false);

  INSERT INTO public.expenses (id, event_id, paid_by, title, amount, notes) VALUES
    (gen_random_uuid(), ev_dinner, me_id, 'Rooftop deposit', 80.00, 'Held the table'),
    (gen_random_uuid(), ev_picnic, lydia, 'Picnic blanket + snacks', 45.00, 'CVS run'),
    (gen_random_uuid(), ev_brunch, nabil, 'Brunch tab', 168.00, 'Split 6 ways'),
    (gen_random_uuid(), ev_japan, me_id, 'Group flight deposits', 1200.00, '$200 x 6 people'),
    (gen_random_uuid(), ev_japan, lydia, 'Tokyo Airbnb (Days 1-4)', 880.00, 'Shibuya 2BR'),
    (gen_random_uuid(), ev_japan, lauren, 'JR Passes (7-day)', 1680.00, '$280 x 6 people');

  INSERT INTO public.time_proposals (event_id, proposed_by, label, proposed_time) VALUES
    (ev_volley, me_id, 'Sat 11am', now() + interval '12 days' + interval '11 hours'),
    (ev_volley, jordan, 'Sat 2pm', now() + interval '12 days' + interval '14 hours'),
    (ev_volley, me_id, 'Sun 11am', now() + interval '13 days' + interval '11 hours');

  -- Create conversations directly (bypass get_or_create_event_chat which needs auth.uid())
  INSERT INTO public.conversations (id, is_direct, title, event_id) VALUES
    (conv_dinner,  false, 'Sunset Rooftop Dinner', ev_dinner),
    (conv_volley,  false, 'Beach Volleyball Saturday', ev_volley),
    (conv_potluck, false, 'Friendsgiving Potluck', ev_potluck),
    (conv_picnic,  false, 'Cherry Blossom Picnic', ev_picnic),
    (conv_brunch,  false, 'Spring Brunch', ev_brunch),
    (conv_japan,   false, 'Tokyo Trip 🇯🇵', ev_japan);

  INSERT INTO public.conversation_members (conversation_id, user_id) VALUES
    (conv_dinner, me_id), (conv_dinner, lydia), (conv_dinner, nabil), (conv_dinner, lauren), (conv_dinner, alex),
    (conv_volley, me_id), (conv_volley, nabil), (conv_volley, jordan), (conv_volley, sofia),
    (conv_potluck, me_id), (conv_potluck, lydia), (conv_potluck, lauren), (conv_potluck, maya), (conv_potluck, alex),
    (conv_picnic, me_id), (conv_picnic, lydia), (conv_picnic, lauren), (conv_picnic, sara), (conv_picnic, maya),
    (conv_brunch, me_id), (conv_brunch, nabil), (conv_brunch, alex), (conv_brunch, jordan), (conv_brunch, lydia),
    (conv_japan, me_id), (conv_japan, lydia), (conv_japan, nabil), (conv_japan, lauren), (conv_japan, sara), (conv_japan, maya), (conv_japan, alex)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.messages (conversation_id, sender_id, body, created_at) VALUES
    (conv_dinner, lydia, 'Cannot wait!! 🌅', now() - interval '2 hours'),
    (conv_dinner, nabil, 'Playlist incoming 🎶', now() - interval '90 minutes'),
    (conv_volley, jordan, 'I got the net 🏐', now() - interval '1 day'),
    (conv_japan, lydia, 'Airbnb is booked!! Confirmation in DM 🇯🇵', now() - interval '3 days'),
    (conv_japan, nabil, 'I will lock the ryokan this weekend', now() - interval '2 days'),
    (conv_japan, lauren, 'JR passes ordered, will hand them out at the airport ✈️', now() - interval '1 day'),
    (conv_japan, sara, 'Working on the itinerary doc — sharing tonight', now() - interval '12 hours');

EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'seed_demo_for_user failed for %: % %', me_id, SQLERRM, SQLSTATE;
  RAISE;
END;
$function$;