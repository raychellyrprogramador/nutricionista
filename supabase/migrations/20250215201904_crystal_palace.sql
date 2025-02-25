-- Create the current_user_id() function if it doesn't exist
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid()
$$;

-- Drop all existing policies first to avoid conflicts
DO $$ 
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON admin_users;
  DROP POLICY IF EXISTS "Enable update for super admins only" ON admin_users;
  DROP POLICY IF EXISTS "Anyone can read admin users" ON admin_users;
  DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admin_users;
  DROP POLICY IF EXISTS "Enable update for super admins" ON admin_users;
  DROP POLICY IF EXISTS "admin_users_policy" ON admin_users;
EXCEPTION
  WHEN undefined_object THEN
    -- Do nothing, policy doesn't exist
END $$;

-- Create simplified policies using auth.uid() directly
CREATE POLICY "admin_users_read_policy"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_users_write_policy"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    CASE 
      WHEN auth.uid() = id AND role = 'super_admin' THEN true
      ELSE auth.uid() = id
    END
  )
  WITH CHECK (
    CASE 
      WHEN auth.uid() = id AND role = 'super_admin' THEN true
      ELSE auth.uid() = id
    END
  );

-- Ensure admin user exists in auth.users with correct password
UPDATE auth.users
SET encrypted_password = crypt('Admin@2025', gen_salt('bf'))
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Ensure admin profile exists
INSERT INTO profiles (
  id,
  full_name,
  birth_date,
  phone,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Administrador',
  '1990-01-01',
  '+5511999999999',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  full_name = 'Administrador';

-- Ensure admin user exists in admin_users with correct role
INSERT INTO admin_users (
  id,
  role,
  permissions
) VALUES (
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