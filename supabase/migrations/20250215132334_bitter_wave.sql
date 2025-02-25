/*
  # Adicionar campos adicionais ao perfil

  1. Alterações
    - Adicionar coluna `tutorial_shown` para controlar exibição do tutorial
    - Adicionar coluna `username` para nome de usuário único
    - Adicionar coluna `bio` para biografia do usuário
    - Adicionar coluna `location` para localização
    - Adicionar coluna `gender` para gênero
    - Adicionar coluna `social_links` para links sociais
    - Adicionar coluna `is_public` para controle de privacidade
    - Adicionar coluna `theme` para preferência de tema
    - Adicionar coluna `notifications` para configurações de notificação
    - Adicionar coluna `cover_image` para imagem de capa

  2. Segurança
    - Manter as políticas RLS existentes
*/

-- Adicionar novas colunas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tutorial_shown BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications JSONB DEFAULT '{"email": true, "push": true}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- Criar índice para busca por username
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles (username);

-- Adicionar constraint de verificação para theme
ALTER TABLE profiles ADD CONSTRAINT theme_check 
  CHECK (theme IN ('light', 'dark', 'system'));