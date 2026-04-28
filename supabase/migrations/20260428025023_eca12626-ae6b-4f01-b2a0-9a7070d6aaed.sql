-- Permanent demo account: ryanjsalas@gwu.edu / Ryan25
-- This function ensures the demo account always has its full seed data.
-- Safe to call on every login — only reseeds if data is missing/incomplete.

CREATE OR REPLACE FUNCTION public.ensure_demo_account_seeded()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  demo_user_id uuid := 'a64682e2-f65f-4436-9007-1425ab98b4b2'; -- ryanjsalas@gwu.edu (Ryan25)
  caller_id uuid := auth.uid();
  event_count int;
  friend_count int;
  expected_events int := 6;
  expected_friends int := 8;
BEGIN
  -- Only the demo user themselves can trigger this
  IF caller_id IS NULL OR caller_id <> demo_user_id THEN
    RETURN;
  END IF;

  SELECT count(*) INTO event_count FROM public.events WHERE host_id = demo_user_id;
  SELECT count(*) INTO friend_count FROM public.friendships
    WHERE requester_id = demo_user_id OR addressee_id = demo_user_id;

  -- If demo data is incomplete, reset it fully
  IF event_count < expected_events OR friend_count < expected_friends THEN
    PERFORM public.reset_demo_for_user(demo_user_id);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_demo_account_seeded() TO authenticated;