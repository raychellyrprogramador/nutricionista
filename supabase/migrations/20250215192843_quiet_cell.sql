/*
  # Create Initial Admin User

  1. Changes
    - Insert initial admin user into auth.users
    - Insert admin user profile
    - Insert admin user permissions
  
  2. Security
    - Password is hashed using Supabase Auth
    - Admin role and permissions are properly set
*/

-- Insert admin user into auth.users
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
  crypt('Nutri@2025', gen_salt('bf')),
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
);

-- Insert admin profile
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
);

-- Insert admin permissions
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
);