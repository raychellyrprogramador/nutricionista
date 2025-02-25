-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable update for super admins" ON admin_users;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for super admins"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (id::text = auth.uid()::text AND role = 'super_admin')
  WITH CHECK (id::text = auth.uid()::text AND role = 'super_admin');

-- Update admin user ID to match auth.users format
UPDATE admin_users
SET id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE id = '00000000-0000-0000-0000-000000000000';