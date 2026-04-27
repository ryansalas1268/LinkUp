ALTER TABLE public.rsvps
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS ended_at timestamptz;