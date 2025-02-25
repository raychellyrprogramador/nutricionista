/*
  # Fix profile and meal plan issues

  1. Changes
    - Add missing INSERT policy for profiles
    - Update meal_plans table structure
    - Fix RLS policies
    
  2. Security
    - Add proper RLS policies for profiles and meal_plans
    - Ensure authenticated users can create their own profiles
*/

-- Fix profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Enable read access for authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- First drop all existing policies on meal_plans
DROP POLICY IF EXISTS "Users can view own meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Users can update own meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Nutritionists can manage their meal plans" ON meal_plans;
DROP POLICY IF EXISTS "Patients can read their meal plans" ON meal_plans;

-- Then drop the constraints
ALTER TABLE meal_plans 
  DROP CONSTRAINT IF EXISTS meal_plans_user_id_fkey,
  DROP CONSTRAINT IF EXISTS meal_plans_patient_id_fkey,
  DROP CONSTRAINT IF EXISTS meal_plans_nutritionist_id_fkey;

-- Now we can safely drop the columns
ALTER TABLE meal_plans 
  DROP COLUMN IF EXISTS user_id,
  DROP COLUMN IF EXISTS patient_id,
  DROP COLUMN IF EXISTS nutritionist_id;

-- Add new columns
ALTER TABLE meal_plans 
  ADD COLUMN IF NOT EXISTS patient_profile_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS nutritionist_profile_id uuid REFERENCES profiles(id);

-- Create new policies
CREATE POLICY "Enable read access for meal plan participants"
  ON meal_plans FOR SELECT
  TO authenticated
  USING (
    auth.uid() = patient_profile_id OR 
    auth.uid() = nutritionist_profile_id
  );

CREATE POLICY "Enable update for nutritionists"
  ON meal_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = nutritionist_profile_id)
  WITH CHECK (auth.uid() = nutritionist_profile_id);

CREATE POLICY "Enable insert for nutritionists"
  ON meal_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = nutritionist_profile_id);