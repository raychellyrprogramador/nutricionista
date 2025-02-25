/*
  # Add city and state columns to profiles table

  1. Changes
    - Add city column to profiles table
    - Add state column to profiles table with validation
    - Add index for city and state columns for better query performance

  2. Security
    - No changes to RLS policies (using existing profile policies)
*/

-- Add city and state columns if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text;

-- Add state validation
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_state;

ALTER TABLE profiles
ADD CONSTRAINT valid_state CHECK (
  state IS NULL OR
  state IN (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  )
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_state ON profiles(state);