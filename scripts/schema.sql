DROP TABLE IF EXISTS despesas;

CREATE TABLE despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  valor_bruto NUMERIC(10,2) DEFAULT 0,
  desconto NUMERIC(10,2) DEFAULT 0,
  valor_final NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pago',
  origem_pagamento TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  parcela_numero INTEGER DEFAULT 1,
  parcelas_total INTEGER DEFAULT 1,
  valor_parcela NUMERIC(10,2) NOT NULL,
  data_vencimento DATE,
  compra_grupo_id UUID,
  link_comprovante TEXT DEFAULT '—',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_despesas_modtime
  BEFORE UPDATE ON despesas
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
