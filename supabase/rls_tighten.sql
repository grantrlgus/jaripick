-- Tighten RLS for parking_cells: keep public read, remove public write.
-- The API route uses the service role key, which bypasses RLS, so writes still work.
-- Run this in Supabase dashboard > SQL editor.

drop policy if exists "public write" on parking_cells;

-- Keep existing "public read" policy as-is.
-- Confirm:
--   select policyname, cmd, qual from pg_policies where tablename = 'parking_cells';
