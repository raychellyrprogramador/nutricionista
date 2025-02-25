-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "admin_users_read" ON admin_users;
  DROP POLICY IF EXISTS "admin_users_write" ON admin_users;
  DROP POLICY IF EXISTS "admin_users_read_policy" ON admin_users;
  DROP POLICY IF EXISTS "admin_users_write_policy" ON admin_users;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new simplified policies
CREATE POLICY "admin_users_select_policy"
  ON admin_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_users_all_policy"
  ON admin_users FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure the admin user exists in auth.users
DO $$
BEGIN
  -- Delete existing admin user if exists (to ensure clean state)
  DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000';
  
  -- Insert admin user with correct credentials
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
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    phone
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
    '',
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Administrador"}',
    true,
    null
  );
END $$;

-- Ensure admin profile exists with all required fields
INSERT INTO profiles (
  id,
  full_name,
  email,
  birth_date,
  phone,
  city,
  state,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Administrador',
  'admin@nutriapp.com',
  '1990-01-01',
  '+5511999999999',
  'São Paulo',
  'SP',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = 'admin@nutriapp.com',
  full_name = 'Administrador',
  city = 'São Paulo',
  state = 'SP',
  updated_at = now();

-- Ensure admin user exists in admin_users with correct role
INSERT INTO admin_users (
  id,
  role,
  permissions,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'super_admin',
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
  role = 'super_admin',
  permissions = '{
    "users": true,
    "appointments": true,
    "meal_plans": true,
    "settings": true,
    "system": true
  }'::jsonb,
  updated_at = now();