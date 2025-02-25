/*
  # Update location fields in profiles table

  1. Changes
    - Split location into city and state fields
    - Add state validation for Brazilian states
*/

-- Add new columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text;

-- Add state validation
ALTER TABLE profiles
ADD CONSTRAINT valid_state CHECK (
  state IS NULL OR
  state IN (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  )
);

-- Drop old location column if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles DROP COLUMN location;
  END IF;
END $$;