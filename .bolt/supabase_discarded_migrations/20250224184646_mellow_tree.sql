-- Check and add missing columns to meal_plans table
DO $$ 
BEGIN
  -- Check if nutritionist_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'nutritionist_id'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN nutritionist_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  -- Check if content column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'content'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN content jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  -- Check if nutritional_info column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'nutritional_info'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN nutritional_info jsonb NOT NULL DEFAULT '{
      "calories": "0",
      "protein": "0",
      "carbs": "0",
      "fats": "0"
    }'::jsonb;
  END IF;

  -- Check if scheduled_date column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'scheduled_date'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN scheduled_date date;
  END IF;

  -- Check if scheduled_time column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'scheduled_time'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN scheduled_time time;
  END IF;

  -- Check if selected_groups column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'selected_groups'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN selected_groups text[] DEFAULT '{}';
  END IF;

  -- Check if status column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'status'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published'));
  END IF;

  -- Check if created_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  -- Check if updated_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  -- Create indexes if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'meal_plans' AND indexname = 'idx_meal_plans_nutritionist'
  ) THEN
    CREATE INDEX idx_meal_plans_nutritionist ON meal_plans(nutritionist_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'meal_plans' AND indexname = 'idx_meal_plans_status'
  ) THEN
    CREATE INDEX idx_meal_plans_status ON meal_plans(status);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'meal_plans' AND indexname = 'idx_meal_plans_category'
  ) THEN
    CREATE INDEX idx_meal_plans_category ON meal_plans(category);
  END IF;
END $$;