/*
  # Fix Appointment Reminders RLS Policies

  1. Changes
    - Drop existing policies for appointment_reminders
    - Add new policies for better access control
    - Add validation trigger instead of check constraint

  2. Security
    - Enable RLS for appointment_reminders
    - Add policies for authenticated users
    - Restrict access to appointment participants only
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their appointment reminders" ON appointment_reminders;

-- Create new policies
CREATE POLICY "Participants can view appointment reminders"
ON appointment_reminders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.id = appointment_reminders.appointment_id
    AND (auth.uid() = a.patient_id OR auth.uid() = a.nutritionist_id)
  )
);

CREATE POLICY "System can create appointment reminders"
ON appointment_reminders
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.id = appointment_reminders.appointment_id
    AND (auth.uid() = a.patient_id OR auth.uid() = a.nutritionist_id)
  )
);

CREATE POLICY "Participants can update appointment reminders"
ON appointment_reminders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.id = appointment_reminders.appointment_id
    AND (auth.uid() = a.patient_id OR auth.uid() = a.nutritionist_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.id = appointment_reminders.appointment_id
    AND (auth.uid() = a.patient_id OR auth.uid() = a.nutritionist_id)
  )
);

-- Create function to validate reminder send_at time
CREATE OR REPLACE FUNCTION validate_reminder_send_at()
RETURNS TRIGGER AS $$
DECLARE
  appointment_time timestamptz;
BEGIN
  -- Get appointment date and time
  SELECT (date || ' ' || start_time)::timestamptz
  INTO appointment_time
  FROM appointments
  WHERE id = NEW.appointment_id;

  -- Validate send_at is before appointment and after current time
  IF NEW.send_at > appointment_time THEN
    RAISE EXCEPTION 'Reminder cannot be sent after appointment time';
  END IF;

  IF NEW.send_at <= CURRENT_TIMESTAMP THEN
    RAISE EXCEPTION 'Reminder must be scheduled for future time';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for send_at validation
DROP TRIGGER IF EXISTS validate_reminder_send_at_trigger ON appointment_reminders;
CREATE TRIGGER validate_reminder_send_at_trigger
  BEFORE INSERT OR UPDATE ON appointment_reminders
  FOR EACH ROW
  EXECUTE FUNCTION validate_reminder_send_at();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointment_reminders_appointment_id 
ON appointment_reminders(appointment_id);

CREATE INDEX IF NOT EXISTS idx_appointment_reminders_send_at_status 
ON appointment_reminders(send_at) 
WHERE status = 'pending';