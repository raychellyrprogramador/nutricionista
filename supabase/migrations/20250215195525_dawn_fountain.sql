-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON admin_users;

-- Create new simplified policies
CREATE POLICY "Enable read access for all authenticated users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for super admins only"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND role = 'super_admin')
  WITH CHECK (id = auth.uid() AND role = 'super_admin');

-- Add role column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_users' AND column_name = 'role'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN role text NOT NULL DEFAULT 'admin';
  END IF;
END $$;

-- Add constraint for role values
ALTER TABLE admin_users 
  DROP CONSTRAINT IF EXISTS valid_role;

ALTER TABLE admin_users
  ADD CONSTRAINT valid_role 
  CHECK (role IN ('admin', 'super_admin'));

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_admin_users_id_role 
  ON admin_users(id, role);

-- Insert test admin user if not exists
INSERT INTO admin_users (id, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'super_admin')
ON CONFLICT (id) DO NOTHING;