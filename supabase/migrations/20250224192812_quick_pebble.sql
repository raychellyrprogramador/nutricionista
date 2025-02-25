/*
  # Remove admin functionality and update policies

  1. Changes
    - Remove admin-related tables and policies
    - Update profile policies to simpler user-based access
    - Update meal plans policies
    - Add nutritionist_id column if missing

  2. Security
    - Maintain user data privacy
    - Allow users to manage only their own data
*/

-- First check and add nutritionist_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'nutritionist_id'
  ) THEN
    ALTER TABLE meal_plans 
    ADD COLUMN nutritionist_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

    -- Create index for better query performance
    CREATE INDEX idx_meal_plans_nutritionist ON meal_plans(nutritionist_id);
  END IF;
END $$;

-- Drop admin-related tables and policies
DROP TABLE IF EXISTS admin_users CASCADE;

-- Update profiles table policies
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile or admins can read all" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON profiles;
DROP POLICY IF EXISTS "Admins can edit all profiles" ON profiles;

-- Create new simplified policies for profiles
CREATE POLICY "Enable read access for authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for users based on id"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Drop admin-related functions
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS check_admin_permission(uuid, text) CASCADE;

-- Update meal_plans policies
DROP POLICY IF EXISTS "Admins can manage meal plans" ON meal_plans;

CREATE POLICY "Users can manage their meal plans"
  ON meal_plans FOR ALL
  TO authenticated
  USING (auth.uid() = nutritionist_id)
  WITH CHECK (auth.uid() = nutritionist_id);