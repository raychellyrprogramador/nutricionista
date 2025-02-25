/*
  # Check meal plans table structure

  1. Changes
    - Check and add nutritionist_id column if missing
    - Create index for nutritionist_id if missing
    - No data migration needed since nutritionist_id is new

  2. Security
    - Maintain referential integrity with profiles table
*/

-- Check meal_plans table structure
DO $$ 
BEGIN
  -- Check if nutritionist_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'nutritionist_id'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN nutritionist_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  -- Create index for nutritionist_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'meal_plans' AND indexname = 'idx_meal_plans_nutritionist'
  ) THEN
    CREATE INDEX idx_meal_plans_nutritionist ON meal_plans(nutritionist_id);
  END IF;
END $$;