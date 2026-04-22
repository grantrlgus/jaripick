-- ============================================================
-- parking_cells: add photo_url column + Storage bucket
-- Run in Supabase SQL editor
-- ============================================================

ALTER TABLE parking_cells
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create public storage bucket for cell photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('cell-photos', 'cell-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read of cell photos
DROP POLICY IF EXISTS "cell_photos_public_read" ON storage.objects;
CREATE POLICY "cell_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'cell-photos');
-- Service role handles writes (bypasses RLS automatically).
