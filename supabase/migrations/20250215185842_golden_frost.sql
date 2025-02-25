/*
  # Admin User and Permissions Setup

  1. New Tables
    - `admin_users` table to track admin permissions
  
  2. Security
    - Enable RLS on admin_users table
    - Add policies for admin access
    - Add role-based access control
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin',
  permissions jsonb NOT NULL DEFAULT '{"users": true, "appointments": true, "meal_plans": true, "settings": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can read admin_users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users
    )
  );

CREATE POLICY "Admins can update admin_users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users WHERE role = 'super_admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM admin_users WHERE role = 'super_admin'
    )
  );

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check admin permissions
CREATE OR REPLACE FUNCTION check_admin_permission(user_id uuid, permission text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users 
    WHERE id = user_id 
    AND permissions->permission = 'true'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update profiles policies to allow admin access
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid()) OR auth.uid() = id
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.uid()) OR auth.uid() = id
  )
  WITH CHECK (
    is_admin(auth.uid()) OR auth.uid() = id
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_permissions ON admin_users USING gin(permissions);