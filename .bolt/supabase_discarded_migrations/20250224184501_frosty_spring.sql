-- Drop existing meal_plans table if it exists
DROP TABLE IF EXISTS meal_plans CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Create meal_plan_images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal_plan_images', 'meal_plan_images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for meal plan images
CREATE POLICY "Images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'meal_plan_images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'meal_plan_images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create meal_plans table with correct structure
CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('breakfast', 'lunch', 'snack', 'dinner')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  nutritional_info jsonb NOT NULL DEFAULT '{
    "calories": "0",
    "protein": "0",
    "carbs": "0",
    "fats": "0"
  }'::jsonb,
  scheduled_date date,
  scheduled_time time,
  selected_groups text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  nutritionist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  meal_plan_id uuid REFERENCES meal_plans(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for meal_plans
CREATE POLICY "Admins can manage meal plans"
  ON meal_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can read published meal plans"
  ON meal_plans FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Policies for notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_meal_plans_nutritionist ON meal_plans(nutritionist_id);
CREATE INDEX idx_meal_plans_status ON meal_plans(status);
CREATE INDEX idx_meal_plans_category ON meal_plans(category);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read) WHERE NOT read;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for meal_plans
CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();