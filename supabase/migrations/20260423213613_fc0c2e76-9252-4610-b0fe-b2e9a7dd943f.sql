-- Allow event hosts to delete event group chats, and direct chat participants to delete the conversation
CREATE OR REPLACE FUNCTION public.can_delete_conversation(_conv_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    LEFT JOIN public.events e ON e.id = c.event_id
    WHERE c.id = _conv_id
      AND (
        -- direct chats: any member can delete
        (c.is_direct = true AND public.is_conversation_member(_conv_id, _user_id))
        -- event group chats: only the host
        OR (c.is_direct = false AND c.event_id IS NOT NULL AND e.host_id = _user_id)
        -- non-event group chats: any member can delete
        OR (c.is_direct = false AND c.event_id IS NULL AND public.is_conversation_member(_conv_id, _user_id))
      )
  );
$$;

CREATE POLICY "Allowed users can delete conversation"
  ON public.conversations FOR DELETE
  TO authenticated
  USING (public.can_delete_conversation(id, auth.uid()));

-- Cascade: clean up members & messages when conversation deleted
-- Allow members to delete messages in conversations they can delete
CREATE POLICY "Conversation deleters can purge messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (public.can_delete_conversation(conversation_id, auth.uid()));

CREATE POLICY "Conversation deleters can purge members"
  ON public.conversation_members FOR DELETE
  TO authenticated
  USING (public.can_delete_conversation(conversation_id, auth.uid()));

-- Blocked users table for blocking from direct chats
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own blocks"
  ON public.blocked_users FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users create own blocks"
  ON public.blocked_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users delete own blocks"
  ON public.blocked_users FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);