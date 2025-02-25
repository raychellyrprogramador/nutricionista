/*
  # Create nutritionist management tables

  1. New Tables
    - `nutritionists`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `crn` (text, unique)
      - `specialties` (text array)
      - `created_at` (timestamp)
    
    - `patients`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `nutritionist_id` (uuid, references nutritionists)
      - `goals` (text array)
      - `restrictions` (text array)
      - `allergies` (text array)
      - `created_at` (timestamp)

  2. Changes to existing tables
    - Drop existing meal_plans table and recreate with new structure
    - Add new columns and relationships

  3. Security
    - Enable RLS on all tables
    - Add policies for nutritionists and patients
    - Ensure data access is properly restricted
*/

-- Create nutritionists table
CREATE TABLE nutritionists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  crn text UNIQUE NOT NULL,
  specialties text[],
  created_at timestamptz DEFAULT now()
);

-- Create patients table
CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  nutritionist_id uuid REFERENCES nutritionists(id) ON DELETE CASCADE,
  goals text[],
  restrictions text[],
  allergies text[],
  created_at timestamptz DEFAULT now()
);

-- Drop and recreate meal_plans table with new structure
DROP TABLE IF EXISTS meal_plans;

CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id uuid REFERENCES nutritionists(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  meals jsonb NOT NULL DEFAULT '[]',
  restrictions text[],
  allergies text[],
  total_calories numeric,
  total_protein numeric,
  total_carbs numeric,
  total_fats numeric,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE nutritionists ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Policies for nutritionists
CREATE POLICY "Nutritionists can read own data"
  ON nutritionists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Nutritionists can update own data"
  ON nutritionists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for patients
CREATE POLICY "Nutritionists can read their patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM nutritionists WHERE id = nutritionist_id
    )
  );

CREATE POLICY "Patients can read own data"
  ON patients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Nutritionists can insert patients"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM nutritionists WHERE id = nutritionist_id
    )
  );

CREATE POLICY "Nutritionists can update their patients"
  ON patients
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM nutritionists WHERE id = nutritionist_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM nutritionists WHERE id = nutritionist_id
    )
  );

-- Policies for meal_plans
CREATE POLICY "Nutritionists can manage their meal plans"
  ON meal_plans
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM nutritionists WHERE id = nutritionist_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM nutritionists WHERE id = nutritionist_id
    )
  );

CREATE POLICY "Patients can read their meal plans"
  ON meal_plans
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM patients WHERE id = patient_id
    )
  );

-- Indexes for better performance
CREATE INDEX idx_nutritionists_user_id ON nutritionists(user_id);
CREATE INDEX idx_patients_nutritionist_id ON patients(nutritionist_id);
CREATE INDEX idx_meal_plans_nutritionist_id ON meal_plans(nutritionist_id);
CREATE INDEX idx_meal_plans_patient_id ON meal_plans(patient_id);
CREATE INDEX idx_meal_plans_status ON meal_plans(status);