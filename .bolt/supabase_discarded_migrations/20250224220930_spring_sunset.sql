/*
  # Admin Authentication System

  1. Changes
    - Creates admin_users table with all required fields including email
    - Sets up RLS policies
    - Creates initial admin user
    - Configures authentication triggers and functions

  2. Security
    - Enables RLS
    - Implements secure policies
    - Sets up validation rules
*/

-- Create admin_users table with all required fields
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  is_active boolean NOT NULL DEFAULT true,
  permissions jsonb NOT NULL DEFAULT '{}',
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_users_email_unique UNIQUE (email),
  CONSTRAINT admin_users_role_check CHECK (role IN ('admin', 'super_admin'))
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Create policies
CREATE POLICY "Admins can read active users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    is_active = true OR 
    auth.uid()::uuid = id
  );

CREATE POLICY "Super admins can manage all users"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()::uuid
      AND role = 'super_admin'
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()::uuid
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Function to validate admin credentials
CREATE OR REPLACE FUNCTION validate_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure email is valid
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Set default values if not provided
  NEW.is_active := COALESCE(NEW.is_active, true);
  NEW.role := COALESCE(NEW.role, 'admin');
  NEW.created_at := COALESCE(NEW.created_at, now());
  NEW.updated_at := now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for admin user validation
DROP TRIGGER IF EXISTS validate_admin_user_trigger ON admin_users;
CREATE TRIGGER validate_admin_user_trigger
  BEFORE INSERT OR UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION validate_admin_user();

-- Update or create initial admin user in auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'admin@nutriapp.com',
  crypt('Admin@2025', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = 'admin@nutriapp.com',
  encrypted_password = crypt('Admin@2025', gen_salt('bf')),
  email_confirmed_at = now(),
  updated_at = now();

-- Insert admin user into admin_users table
INSERT INTO admin_users (
  id,
  email,
  full_name,
  role,
  is_active,
  permissions,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@nutriapp.com',
  'Administrador',
  'super_admin',
  true,
  '{
    "users": true,
    "appointments": true,
    "meal_plans": true,
    "settings": true,
    "system": true
  }'::jsonb,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = 'admin@nutriapp.com',
  full_name = 'Administrador',
  role = 'super_admin',
  is_active = true,
  permissions = '{
    "users": true,
    "appointments": true,
    "meal_plans": true,
    "settings": true,
    "system": true
  }'::jsonb,
  updated_at = now();

-- Create function to update last_login
CREATE OR REPLACE FUNCTION update_admin_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE admin_users
  SET last_login = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for last_login update
DROP TRIGGER IF EXISTS update_admin_last_login_trigger ON auth.users;
CREATE TRIGGER update_admin_last_login_trigger
  AFTER INSERT OR UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.last_sign_in_at IS NOT NULL)
  EXECUTE FUNCTION update_admin_last_login();