/*
  # Atualização do perfil para funcionalidades fitness

  1. Novas Tabelas
    - `weight_history`: Histórico de peso do usuário
      - `id` (uuid, primary key)
      - `user_id` (uuid, referência para profiles)
      - `weight` (numeric)
      - `date` (date)
      - `notes` (text)
    
    - `body_measurements`: Medidas corporais
      - `id` (uuid, primary key)
      - `user_id` (uuid, referência para profiles)
      - `date` (date)
      - `chest` (numeric)
      - `waist` (numeric)
      - `hips` (numeric)
      - `biceps` (numeric)
      - `thighs` (numeric)
      - `notes` (text)
    
    - `progress_photos`: Fotos de progresso
      - `id` (uuid, primary key)
      - `user_id` (uuid, referência para profiles)
      - `photo_url` (text)
      - `date` (date)
      - `category` (text)
      - `notes` (text)

  2. Alterações em Tabelas Existentes
    - Adição de campos fitness em `profiles`
      - `current_weight` (numeric)
      - `height` (numeric)
      - `fitness_goals` (text[])
      - `dietary_restrictions` (text[])
      - `exercise_routine` (jsonb)

  3. Segurança
    - Habilitar RLS em todas as novas tabelas
    - Adicionar políticas para leitura/escrita apenas pelo próprio usuário
*/

-- Adicionar campos fitness à tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_weight numeric,
ADD COLUMN IF NOT EXISTS height numeric,
ADD COLUMN IF NOT EXISTS fitness_goals text[],
ADD COLUMN IF NOT EXISTS dietary_restrictions text[],
ADD COLUMN IF NOT EXISTS exercise_routine jsonb;

-- Criar tabela de histórico de peso
CREATE TABLE IF NOT EXISTS weight_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    weight numeric NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Criar tabela de medidas corporais
CREATE TABLE IF NOT EXISTS body_measurements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT CURRENT_DATE,
    chest numeric,
    waist numeric,
    hips numeric,
    biceps numeric,
    thighs numeric,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Criar tabela de fotos de progresso
CREATE TABLE IF NOT EXISTS progress_photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    photo_url text NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    category text NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

-- Políticas para weight_history
CREATE POLICY "Users can view own weight history"
    ON weight_history
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight history"
    ON weight_history
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight history"
    ON weight_history
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight history"
    ON weight_history
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Políticas para body_measurements
CREATE POLICY "Users can view own measurements"
    ON body_measurements
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements"
    ON body_measurements
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measurements"
    ON body_measurements
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements"
    ON body_measurements
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Políticas para progress_photos
CREATE POLICY "Users can view own progress photos"
    ON progress_photos
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress photos"
    ON progress_photos
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress photos"
    ON progress_photos
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress photos"
    ON progress_photos
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_weight_history_user_date ON weight_history(user_id, date);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON body_measurements(user_id, date);
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_date ON progress_photos(user_id, date);