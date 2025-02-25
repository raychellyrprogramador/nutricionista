/*
  # Add meal plans management

  1. New Tables
    - `meal_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `file_url` (text, PDF URL)
      - `nutritionist_name` (text)
      - `title` (text)
      - `received_at` (timestamptz)
      - `viewed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `meal_plans` table
    - Add policies for authenticated users to manage their meal plans
*/

CREATE TABLE IF NOT EXISTS meal_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    file_url text NOT NULL,
    nutritionist_name text NOT NULL,
    title text NOT NULL,
    received_at timestamptz DEFAULT now(),
    viewed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own meal plans"
    ON meal_plans
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
    ON meal_plans
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_received 
    ON meal_plans(user_id, received_at DESC);