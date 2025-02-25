-- Add is_active column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Update existing profiles to be active by default
UPDATE profiles SET is_active = true WHERE is_active IS NULL;

-- Add constraint to prevent null values
ALTER TABLE profiles
ALTER COLUMN is_active SET NOT NULL;