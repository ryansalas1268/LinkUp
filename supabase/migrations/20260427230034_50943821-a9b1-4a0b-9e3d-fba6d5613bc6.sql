-- Add a flag column to profiles to mark demo accounts
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Seed 6 demo profiles with deterministic UUIDs.
-- These are profile rows only (no auth.users entry) so they cannot log in,
-- but they appear in search, can be invited/friended, and the app auto-accepts on their behalf.
INSERT INTO public.profiles (id, username, display_name, is_demo)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'demoaccount1', 'Demo Account 1', true),
  ('11111111-1111-4111-8111-111111111102', 'demoaccount2', 'Demo Account 2', true),
  ('11111111-1111-4111-8111-111111111103', 'demoaccount3', 'Demo Account 3', true),
  ('11111111-1111-4111-8111-111111111104', 'demoaccount4', 'Demo Account 4', true),
  ('11111111-1111-4111-8111-111111111105', 'demoaccount5', 'Demo Account 5', true),
  ('11111111-1111-4111-8111-111111111106', 'demoaccount6', 'Demo Account 6', true)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  is_demo = true;