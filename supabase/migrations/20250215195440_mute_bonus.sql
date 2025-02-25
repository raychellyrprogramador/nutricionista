-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can update" ON admin_users;

-- Create new policies with simplified checks
CREATE POLICY "Anyone can read admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can update admin users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND role = 'super_admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND role = 'super_admin'
  ));

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_id_role ON admin_users(id, role);

-- Update storage policies for appointment files
DROP POLICY IF EXISTS "Users can read appointment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload appointment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own appointment files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own appointment files" ON storage.objects;

CREATE POLICY "Appointment files access"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'appointment_files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'appointment_files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );