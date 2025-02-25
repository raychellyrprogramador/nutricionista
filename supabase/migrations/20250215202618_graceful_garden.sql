-- First, ensure the admin user exists in auth.users with correct credentials
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

-- Ensure admin profile exists
INSERT INTO profiles (
  id,
  full_name,
  email,
  birth_date,
  phone,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Administrador',
  'admin@nutriapp.com',
  '1990-01-01',
  '+5511999999999',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = 'admin@nutriapp.com',
  full_name = 'Administrador',
  updated_at = now();

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