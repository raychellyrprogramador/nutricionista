-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can read own profile or admins can read all" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON profiles;
DROP POLICY IF EXISTS "Admins can edit all profiles" ON profiles;

-- Create new simplified policies
CREATE POLICY "Enable read access for users and admins"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for users and admins"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Ensure admin user has correct permissions
UPDATE admin_users
SET permissions = permissions || 
  '{"users_management": true}'::jsonb
WHERE role = 'super_admin';