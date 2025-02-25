-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON admin_users;
DROP POLICY IF EXISTS "Enable all access for super admins" ON admin_users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable update for super admins" ON admin_users;

-- Create new simplified policies without recursion
CREATE POLICY "Anyone can read admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage admin users"
  ON admin_users FOR ALL
  TO authenticated
  USING (role = 'super_admin' AND id = auth.uid());

-- Update admin_users table structure
ALTER TABLE admin_users
DROP CONSTRAINT IF EXISTS valid_role;

ALTER TABLE admin_users
ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'super_admin'));

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_admin_users_id_role ON admin_users(id, role);

-- Update existing admin user
UPDATE admin_users
SET role = 'super_admin'
WHERE id = '00000000-0000-0000-0000-000000000000';