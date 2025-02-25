-- First ensure the profile exists
INSERT INTO profiles (
  id,
  full_name,
  email,
  birth_date,
  phone,
  created_at,
  updated_at,
  is_active
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'Administrator',
  'admin@nutriapp.com',
  '1990-01-01',
  '+5511999999999',
  now(),
  now(),
  true
) ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  updated_at = now();

-- Then add the admin user
INSERT INTO admin_users (
  id,
  role,
  permissions
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'super_admin',
  '{
    "users": true,
    "appointments": true,
    "meal_plans": true,
    "settings": true,
    "system": true,
    "users_management": true
  }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  permissions = '{
    "users": true,
    "appointments": true,
    "meal_plans": true,
    "settings": true,
    "system": true,
    "users_management": true
  }'::jsonb;

-- Finally log the action
INSERT INTO audit_logs (
  action,
  details,
  performed_by
) VALUES (
  'admin_role_assigned',
  'User assigned super_admin role with full permissions',
  '123e4567-e89b-12d3-a456-426614174000'
);