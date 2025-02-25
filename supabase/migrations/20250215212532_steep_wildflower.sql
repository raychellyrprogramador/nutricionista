-- Drop existing policies
DROP POLICY IF EXISTS "admin_users_select_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_all_policy" ON admin_users;

-- Create new simplified policies
CREATE POLICY "Enable read access for all users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable all access for super admins"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid() AND au.role = 'super_admin'
    )
  );

-- Add is_active column to profiles if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Update existing profiles to be active by default
UPDATE profiles SET is_active = true WHERE is_active IS NULL;

-- Add constraint to prevent null values
ALTER TABLE profiles
ALTER COLUMN is_active SET NOT NULL;

-- Ensure admin user exists with correct role
INSERT INTO admin_users (id, role, permissions)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'super_admin',
  '{
    "users": true,
    "appointments": true,
    "meal_plans": true,
    "settings": true,
    "system": true
  }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  permissions = '{
    "users": true,
    "appointments": true,
    "meal_plans": true,
    "settings": true,
    "system": true
  }'::jsonb;