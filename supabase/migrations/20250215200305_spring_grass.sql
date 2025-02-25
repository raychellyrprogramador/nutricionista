/*
  # Fix admin user setup and policies

  1. Updates
    - Drop and recreate admin user policies
    - Ensure admin user exists with correct credentials
    - Update admin profile and permissions
  
  2. Security
    - Simplified RLS policies for admin users
    - Super admin role with full permissions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable update for super admins only" ON admin_users;

-- Create new simplified policies
CREATE POLICY "Anyone can read admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (id = auth.uid() AND role = 'super_admin');

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