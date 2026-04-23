
-- 1. Add 'invited' to rsvp_status enum
ALTER TYPE public.rsvp_status ADD VALUE IF NOT EXISTS 'invited';

-- 2. Helper: is the current user the host of this event?
CREATE OR REPLACE FUNCTION public.is_event_host(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.events WHERE id = _event_id AND host_id = _user_id);
$$;

-- 3. Add host-can-manage RSVP policies (keep existing self policies)
DROP POLICY IF EXISTS "Hosts can insert any rsvp on own event" ON public.rsvps;
CREATE POLICY "Hosts can insert any rsvp on own event"
  ON public.rsvps FOR INSERT TO authenticated
  WITH CHECK (public.is_event_host(event_id, auth.uid()));

DROP POLICY IF EXISTS "Hosts can update any rsvp on own event" ON public.rsvps;
CREATE POLICY "Hosts can update any rsvp on own event"
  ON public.rsvps FOR UPDATE TO authenticated
  USING (public.is_event_host(event_id, auth.uid()));

DROP POLICY IF EXISTS "Hosts can delete any rsvp on own event" ON public.rsvps;
CREATE POLICY "Hosts can delete any rsvp on own event"
  ON public.rsvps FOR DELETE TO authenticated
  USING (public.is_event_host(event_id, auth.uid()));
