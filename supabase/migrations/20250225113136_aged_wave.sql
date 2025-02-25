-- First verify if admin_users table exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admin_users'
  ) THEN
    -- Create admin_users table if it doesn't exist
    CREATE TABLE admin_users (
      id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
      role text NOT NULL DEFAULT 'admin',
      permissions jsonb NOT NULL DEFAULT '{"users": true, "appointments": true, "meal_plans": true, "settings": true}'::jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Anyone can read admin users"
      ON admin_users FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Super admins can manage admin users"
      ON admin_users FOR ALL
      TO authenticated
      USING (id = auth.uid() AND role = 'super_admin');

    -- Add role constraint
    ALTER TABLE admin_users
    ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'super_admin'));

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_admin_users_id_role ON admin_users(id, role);
  END IF;

  -- Verify permissions
  GRANT SELECT ON admin_users TO authenticated;
  GRANT INSERT, UPDATE, DELETE ON admin_users TO authenticated;
END $$;