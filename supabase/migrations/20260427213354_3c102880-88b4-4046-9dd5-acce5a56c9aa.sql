
CREATE OR REPLACE FUNCTION public.reset_demo_for_user(me_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ev_ids uuid[];
  conv_ids uuid[];
  friend_ids uuid[];
BEGIN
  -- Collect this user's hosted events
  SELECT array_agg(id) INTO ev_ids FROM public.events WHERE host_id = me_id;

  IF ev_ids IS NOT NULL THEN
    -- Collect conversations tied to those events
    SELECT array_agg(id) INTO conv_ids FROM public.conversations WHERE event_id = ANY(ev_ids);

    IF conv_ids IS NOT NULL THEN
      DELETE FROM public.messages WHERE conversation_id = ANY(conv_ids);
      DELETE FROM public.conversation_members WHERE conversation_id = ANY(conv_ids);
      DELETE FROM public.conversations WHERE id = ANY(conv_ids);
    END IF;

    DELETE FROM public.expense_shares WHERE expense_id IN (SELECT id FROM public.expenses WHERE event_id = ANY(ev_ids));
    DELETE FROM public.expenses WHERE event_id = ANY(ev_ids);
    DELETE FROM public.time_votes WHERE proposal_id IN (SELECT id FROM public.time_proposals WHERE event_id = ANY(ev_ids));
    DELETE FROM public.time_proposals WHERE event_id = ANY(ev_ids);
    DELETE FROM public.tasks WHERE event_id = ANY(ev_ids);
    DELETE FROM public.rsvps WHERE event_id = ANY(ev_ids);
    DELETE FROM public.events WHERE id = ANY(ev_ids);
  END IF;

  -- Remove demo friend profiles linked to this user (only the seeded ones, identified by friendship rows)
  SELECT array_agg(CASE WHEN requester_id = me_id THEN addressee_id ELSE requester_id END)
    INTO friend_ids
  FROM public.friendships
  WHERE requester_id = me_id OR addressee_id = me_id;

  DELETE FROM public.friendships WHERE requester_id = me_id OR addressee_id = me_id;

  IF friend_ids IS NOT NULL THEN
    -- Only delete profiles that are NOT real auth users (demo seed profiles have no auth.users row)
    DELETE FROM public.profiles
    WHERE id = ANY(friend_ids)
      AND id NOT IN (SELECT id FROM auth.users);
  END IF;

  -- Reset subscription so they're back on free tier
  DELETE FROM public.subscriptions WHERE user_id = me_id;

  -- Re-seed
  PERFORM public.seed_demo_for_user(me_id);
END;
$$;
