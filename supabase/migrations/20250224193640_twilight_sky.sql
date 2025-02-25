/*
  # Add audit logs table

  1. New Tables
    - `audit_logs`
      - `id` (uuid, primary key)
      - `action` (text)
      - `details` (text)
      - `performed_by` (uuid, references profiles)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for read access
*/

-- Create audit_logs table
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  details text,
  performed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for read access
CREATE POLICY "Users can read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index for better performance
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_performed_by ON audit_logs(performed_by);

-- Create function to automatically log user actions
CREATE OR REPLACE FUNCTION log_user_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (action, details, performed_by)
  VALUES (
    TG_ARGV[0],
    'Table: ' || TG_TABLE_NAME || ', Operation: ' || TG_OP,
    auth.uid()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;