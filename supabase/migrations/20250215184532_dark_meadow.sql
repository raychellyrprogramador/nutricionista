/*
  # Fix appointment files storage policies

  1. Changes
    - Create appointment_files bucket
    - Add storage policies for appointment files
    - Fix file type and size validation

  2. Security
    - Enable RLS for appointment_files bucket
    - Add policies for authenticated users
    - Restrict access to appointment participants only
*/

-- Create appointment_files bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('appointment_files', 'appointment_files', false)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for appointment files
CREATE POLICY "Appointment files are accessible to participants"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'appointment_files'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload appointment files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'appointment_files'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own appointment files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'appointment_files'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'appointment_files'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own appointment files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'appointment_files'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update appointment_files table to include file metadata
ALTER TABLE appointment_files
ADD COLUMN IF NOT EXISTS mime_type text,
ADD COLUMN IF NOT EXISTS file_size bigint,
ADD CONSTRAINT valid_file_size CHECK (file_size <= 10485760), -- 10MB limit
ADD CONSTRAINT valid_mime_type CHECK (
  mime_type IN (
    'application/pdf',
    'image/jpeg',
    'image/png'
  )
);