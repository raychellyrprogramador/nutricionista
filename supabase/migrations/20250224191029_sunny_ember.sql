/*
  # Add nutritionist_id to meal_plans table

  1. Changes
    - Add nutritionist_id column to meal_plans table
    - Create foreign key reference to profiles table
    - Create index for better performance
    - Update existing records if needed

  2. Security
    - Cascade deletion when profile is deleted
*/

-- Add nutritionist_id column if it doesn't exist
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