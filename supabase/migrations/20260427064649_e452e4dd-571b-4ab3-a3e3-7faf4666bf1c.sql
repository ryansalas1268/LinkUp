-- Add cover image column to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Create public bucket for event cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-covers', 'event-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Event covers are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-covers');

-- Authenticated users can upload to their own folder: <user_id>/<filename>
CREATE POLICY "Users can upload their own event covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own event covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own event covers"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);