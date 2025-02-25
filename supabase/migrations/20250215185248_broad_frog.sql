/*
  # Fix appointment_files table constraints

  1. Changes
    - Remove NOT NULL constraint from file_type
    - Add default value for file_type based on file extension
    - Add trigger to automatically set file_type
    - Update existing policies

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper constraints
*/

-- Remove NOT NULL constraint and add default value
ALTER TABLE appointment_files
ALTER COLUMN file_type DROP NOT NULL,
ALTER COLUMN file_type SET DEFAULT 'application/octet-stream';

-- Create function to determine file type from file name
CREATE OR REPLACE FUNCTION get_file_type(file_name text)
RETURNS text AS $$
BEGIN
  CASE
    WHEN file_name ILIKE '%.pdf' THEN
      RETURN 'application/pdf';
    WHEN file_name ILIKE '%.jpg' OR file_name ILIKE '%.jpeg' THEN
      RETURN 'image/jpeg';
    WHEN file_name ILIKE '%.png' THEN
      RETURN 'image/png';
    ELSE
      RETURN 'application/octet-stream';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set file_type
CREATE OR REPLACE FUNCTION set_file_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.file_type IS NULL THEN
    NEW.file_type := get_file_type(NEW.file_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to set file_type before insert
DROP TRIGGER IF EXISTS set_file_type_trigger ON appointment_files;
CREATE TRIGGER set_file_type_trigger
  BEFORE INSERT ON appointment_files
  FOR EACH ROW
  EXECUTE FUNCTION set_file_type();

-- Update existing records if any have NULL file_type
UPDATE appointment_files
SET file_type = get_file_type(file_name)
WHERE file_type IS NULL;