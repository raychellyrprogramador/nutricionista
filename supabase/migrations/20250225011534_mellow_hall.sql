-- Function to ensure performed_by exists in profiles
CREATE OR REPLACE FUNCTION ensure_performed_by_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if performed_by exists in profiles
  IF NEW.performed_by IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = NEW.performed_by
  ) THEN
    -- Insert a basic profile if it doesn't exist
    INSERT INTO profiles (
      id,
      full_name,
      email,
      birth_date,
      phone,
      created_at,
      updated_at,
      is_active
    ) VALUES (
      NEW.performed_by,
      'System User',
      'system@nutriapp.com',
      '1990-01-01',
      '0000000000',
      now(),
      now(),
      true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure performed_by exists before insert
DROP TRIGGER IF EXISTS ensure_performed_by_trigger ON audit_logs;
CREATE TRIGGER ensure_performed_by_trigger
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION ensure_performed_by_exists();

-- Function to verify audit log insertion
CREATE OR REPLACE FUNCTION verify_audit_log_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Verify the profile exists after insertion
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = NEW.performed_by
  ) THEN
    RAISE EXCEPTION 'Failed to create profile for performed_by user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to verify successful insertion
DROP TRIGGER IF EXISTS verify_audit_log_trigger ON audit_logs;
CREATE TRIGGER verify_audit_log_trigger
  AFTER INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION verify_audit_log_insert();