-- Check if user_id column exists
DO $$ 
BEGIN
  -- First check if the column already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'admin_users' 
    AND column_name = 'user_id'
  ) THEN
    -- Add user_id column
    ALTER TABLE admin_users 
    ADD COLUMN user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

    -- Create index for better performance
    CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

    -- Populate user_id with existing id values
    -- Since id currently references auth.users and profiles.id is the same
    UPDATE admin_users SET user_id = id;

    -- Make user_id NOT NULL after populating
    ALTER TABLE admin_users 
    ALTER COLUMN user_id SET NOT NULL;

    -- Add unique constraint to prevent duplicate entries
    ALTER TABLE admin_users 
    ADD CONSTRAINT unique_user_id UNIQUE (user_id);
  END IF;
END $$;