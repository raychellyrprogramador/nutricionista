-- Create admin user with credentials
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@nutriapp.com',
  crypt('Admin@2025', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Administrador"}',
  now(),
  now(),
  'authenticated',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create admin profile
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
) ON CONFLICT (id) DO NOTHING;

-- Grant admin role
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