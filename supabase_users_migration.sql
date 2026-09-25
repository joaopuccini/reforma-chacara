-- Execute este script no SQL Editor do seu projeto Supabase (Dashboard -> SQL Editor -> New Query)

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Ao reiniciar o backend, o primeiro usuário Admin será criado automaticamente 
-- usando o ADMIN_EMAIL e ADMIN_PASSWORD definidos nas suas variáveis de ambiente.
