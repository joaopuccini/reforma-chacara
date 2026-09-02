CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS despesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descricao TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Mão de Obra', 'Material para a Casa', 'Material de Apoio', 'Serviços e Locações')),
    subcategoria VARCHAR(50) NOT NULL,
    valor_bruto NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    desconto NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    valor_final NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pago' CHECK (status IN ('Pago', 'Pendente')),
    parcelas VARCHAR(50) NOT NULL DEFAULT 'À vista',
    pago_joao NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    pago_fofo NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    pendente NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    link_comprovante TEXT DEFAULT '—',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização de consultas e relatórios
CREATE INDEX IF NOT EXISTS idx_despesas_created_at ON despesas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_despesas_categoria ON despesas(categoria);
CREATE INDEX IF NOT EXISTS idx_despesas_status ON despesas(status);

-- RLS e Policies (Segurança Básica para Client/Service Role)
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura anon" ON despesas FOR SELECT USING (true);
CREATE POLICY "Permitir mutacoes backend" ON despesas FOR ALL USING (true) WITH CHECK (true);
