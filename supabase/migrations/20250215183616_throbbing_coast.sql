/*
  # Sistema de Agendamento de Consultas

  1. Novas Tabelas
    - `appointment_slots`: Slots de horários disponíveis
    - `appointments`: Agendamentos de consultas
    - `appointment_files`: Arquivos anexados às consultas
    - `appointment_reminders`: Lembretes de consultas

  2. Funcionalidades
    - Gerenciamento de slots de horário
    - Agendamento de consultas
    - Upload de exames
    - Sistema de lembretes
    - Histórico de consultas

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas específicas para nutricionistas e pacientes
*/

-- Criar bucket para arquivos de consulta
INSERT INTO storage.buckets (id, name, public)
VALUES ('appointment_files', 'appointment_files', false)
ON CONFLICT (id) DO NOTHING;

-- Slots de horário disponíveis
CREATE TABLE appointment_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_online boolean DEFAULT false,
  slot_duration interval NOT NULL DEFAULT '1 hour',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Agendamentos
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  nutritionist_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  type text NOT NULL CHECK (type IN ('first_visit', 'follow_up')),
  modality text NOT NULL CHECK (modality IN ('online', 'in_person')),
  status text NOT NULL DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
  notes text,
  cancellation_reason text,
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_appointment_time CHECK (start_time < end_time),
  CONSTRAINT future_date CHECK (date >= CURRENT_DATE)
);

-- Arquivos anexados
CREATE TABLE appointment_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  file_path text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Lembretes
CREATE TABLE appointment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('24h', '1h', 'custom')),
  send_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'sent', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;

-- Políticas para slots de horário
CREATE POLICY "Nutritionists can manage their slots"
  ON appointment_slots
  FOR ALL
  TO authenticated
  USING (auth.uid() = nutritionist_id)
  WITH CHECK (auth.uid() = nutritionist_id);

CREATE POLICY "Patients can view available slots"
  ON appointment_slots
  FOR SELECT
  TO authenticated
  USING (true);

-- Políticas para agendamentos
CREATE POLICY "Patients can view and manage their appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = patient_id OR 
    auth.uid() = nutritionist_id
  )
  WITH CHECK (
    auth.uid() = patient_id OR 
    auth.uid() = nutritionist_id
  );

-- Políticas para arquivos
CREATE POLICY "Users can manage their appointment files"
  ON appointment_files
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT patient_id FROM appointments WHERE id = appointment_id
      UNION
      SELECT nutritionist_id FROM appointments WHERE id = appointment_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT patient_id FROM appointments WHERE id = appointment_id
      UNION
      SELECT nutritionist_id FROM appointments WHERE id = appointment_id
    )
  );

-- Políticas para lembretes
CREATE POLICY "Users can view their appointment reminders"
  ON appointment_reminders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT patient_id FROM appointments WHERE id = appointment_id
      UNION
      SELECT nutritionist_id FROM appointments WHERE id = appointment_id
    )
  );

-- Índices para melhor performance
CREATE INDEX idx_appointment_slots_nutritionist ON appointment_slots(nutritionist_id);
CREATE INDEX idx_appointment_slots_day_time ON appointment_slots(day_of_week, start_time);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_nutritionist ON appointments(nutritionist_id);
CREATE INDEX idx_appointments_date ON appointments(date, start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointment_files_appointment ON appointment_files(appointment_id);
CREATE INDEX idx_appointment_reminders_send_at ON appointment_reminders(send_at) 
  WHERE status = 'pending';

-- Função para atualizar o timestamp de atualização
CREATE OR REPLACE FUNCTION update_appointment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp
CREATE TRIGGER update_appointment_timestamp
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_timestamp();

-- Função para criar lembretes automáticos
CREATE OR REPLACE FUNCTION create_appointment_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- Lembrete de 24 horas
  INSERT INTO appointment_reminders (
    appointment_id,
    type,
    send_at
  ) VALUES (
    NEW.id,
    '24h',
    (NEW.date || ' ' || NEW.start_time)::timestamptz - interval '24 hours'
  );

  -- Lembrete de 1 hora
  INSERT INTO appointment_reminders (
    appointment_id,
    type,
    send_at
  ) VALUES (
    NEW.id,
    '1h',
    (NEW.date || ' ' || NEW.start_time)::timestamptz - interval '1 hour'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar lembretes
CREATE TRIGGER create_appointment_reminders
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_reminders();