
-- Function: create a conversation and add the caller as the first member
CREATE OR REPLACE FUNCTION public.create_conversation(
  _is_direct boolean,
  _title text,
  _event_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.conversations (is_direct, title, event_id)
  VALUES (_is_direct, _title, _event_id)
  RETURNING id INTO new_id;
  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES (new_id, uid);
  RETURN new_id;
END;
$$;

-- Function: get or create the event's group chat and add all "going" attendees
CREATE OR REPLACE FUNCTION public.get_or_create_event_chat(_event_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_id uuid;
  ev_title text;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT id INTO conv_id FROM public.conversations
    WHERE event_id = _event_id AND is_direct = false LIMIT 1;

  IF conv_id IS NULL THEN
    SELECT title INTO ev_title FROM public.events WHERE id = _event_id;
    INSERT INTO public.conversations (is_direct, title, event_id)
    VALUES (false, COALESCE(ev_title, 'Event chat'), _event_id)
    RETURNING id INTO conv_id;

    -- add host
    INSERT INTO public.conversation_members (conversation_id, user_id)
    SELECT conv_id, host_id FROM public.events WHERE id = _event_id
    ON CONFLICT DO NOTHING;

    -- add everyone going
    INSERT INTO public.conversation_members (conversation_id, user_id)
    SELECT conv_id, user_id FROM public.rsvps
      WHERE event_id = _event_id AND status = 'going'
    ON CONFLICT DO NOTHING;
  END IF;

  -- ensure caller is a member
  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES (conv_id, uid)
  ON CONFLICT DO NOTHING;

  RETURN conv_id;
END;
$$;

-- Enforce one member row per (conv,user) so ON CONFLICT works
DO $$ BEGIN
  ALTER TABLE public.conversation_members
    ADD CONSTRAINT conversation_members_pkey PRIMARY KEY (conversation_id, user_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN invalid_table_definition THEN NULL; END $$;
