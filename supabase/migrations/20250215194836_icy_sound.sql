-- Drop existing policies
DROP POLICY IF EXISTS "Admins can read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can update admin_users" ON admin_users;

-- Create new policies without recursion
CREATE POLICY "Enable read access for authenticated users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can update"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    role = 'super_admin'
  )
  WITH CHECK (
    role = 'super_admin'
  );

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Create storage bucket for appointment files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('appointment_files', 'appointment_files', false)
ON CONFLICT (id) DO NOTHING;

-- Update storage policies for appointment files
DROP POLICY IF EXISTS "Appointment files are accessible to participants" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload appointment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own appointment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own appointment files" ON storage.objects;

CREATE POLICY "Users can read appointment files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'appointment_files');

CREATE POLICY "Users can upload appointment files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'appointment_files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own appointment files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'appointment_files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own appointment files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'appointment_files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );