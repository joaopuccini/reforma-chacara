import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis do .env (assumindo execução a partir de /backend)
dotenv.config({ path: resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gamlpyglhouedscnalqg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbWxweWdsaG91ZWRzY25hbHFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODM1Mzc4OCwiZXhwIjoyMTAzOTI5Nzg4fQ.gC_bgAb4r8QTw7gj2D6wSvU2CuKqAaG47vfisFMKmrM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const dadosMigracao = [
  {
    descricao: "Pedreiro (Entrada Mão de Obra João)",
    categoria: "Mão de Obra",
    subcategoria: "Alvenaria / Geral",
    valor_bruto: 200.00,
    desconto: 0.00,
    valor_final: 200.00,
    status: "Pago",
    origem_pagamento: "PIX",
    responsavel: "João",
    parcela_numero: 1,
    parcelas_total: 1,
    valor_parcela: 200.00,
    data_vencimento: null,
    observacoes: "João via PIX (R$ 200.00)"
  },
  {
    descricao: "Pedreiro (Entrada Mão de Obra Fofo)",
    categoria: "Mão de Obra",
    subcategoria: "Alvenaria / Geral",
    valor_bruto: 300.00,
    desconto: 0.00,
    valor_final: 300.00,
    status: "Pago",
    origem_pagamento: "DINHEIRO",
    responsavel: "Fofo",
    parcela_numero: 1,
    parcelas_total: 1,
    valor_parcela: 300.00,
    data_vencimento: null,
    observacoes: "Fofo em Dinheiro (R$ 300.00)"
  },
  {
    descricao: "Caçamba de entulho",
    categoria: "Serviços e Locações",
    subcategoria: "Limpeza / Caçamba",
    valor_bruto: 200.00,
    desconto: 0.00,
    valor_final: 200.00,
    status: "Pago",
    origem_pagamento: "DINHEIRO",
    responsavel: "Fofo",
    parcela_numero: 1,
    parcelas_total: 1,
    valor_parcela: 200.00,
    data_vencimento: null,
    observacoes: "Fofo em Dinheiro"
  },
  {
    descricao: "Andaime e escoras (1/5)",
    categoria: "Serviços e Locações",
    subcategoria: "Equipamentos",
    valor_bruto: 1045.50,
    desconto: 0.00,
    valor_final: 1045.50,
    status: "Pago",
    origem_pagamento: "CARTAO_PRETO_CREDITO_FOFO",
    responsavel: "Fofo",
    parcela_numero: 1,
    parcelas_total: 5,
    valor_parcela: 209.10,
    data_vencimento: null,
    compra_grupo_id: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d",
    observacoes: "Será pago no Cartão Preto do Fofo (5x)"
  },
  {
    descricao: "Andaime e escoras (2/5)",
    categoria: "Serviços e Locações",
    subcategoria: "Equipamentos",
    valor_bruto: 1045.50,
    desconto: 0.00,
    valor_final: 1045.50,
    status: "Pendente",
    origem_pagamento: "CARTAO_PRETO_CREDITO_FOFO",
    responsavel: "Fofo",
    parcela_numero: 2,
    parcelas_total: 5,
    valor_parcela: 209.10,
    data_vencimento: "2026-10-10",
    compra_grupo_id: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d",
    observacoes: "Será pago no Cartão Preto do Fofo (5x)"
  },
  {
    descricao: "Andaime e escoras (3/5)",
    categoria: "Serviços e Locações",
    subcategoria: "Equipamentos",
    valor_bruto: 1045.50,
    desconto: 0.00,
    valor_final: 1045.50,
    status: "Pendente",
    origem_pagamento: "CARTAO_PRETO_CREDITO_FOFO",
    responsavel: "Fofo",
    parcela_numero: 3,
    parcelas_total: 5,
    valor_parcela: 209.10,
    data_vencimento: "2026-11-10",
    compra_grupo_id: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d",
    observacoes: "Será pago no Cartão Preto do Fofo (5x)"
  },
  {
    descricao: "Andaime e escoras (4/5)",
    categoria: "Serviços e Locações",
    subcategoria: "Equipamentos",
    valor_bruto: 1045.50,
    desconto: 0.00,
    valor_final: 1045.50,
    status: "Pendente",
    origem_pagamento: "CARTAO_PRETO_CREDITO_FOFO",
    responsavel: "Fofo",
    parcela_numero: 4,
    parcelas_total: 5,
    valor_parcela: 209.10,
    data_vencimento: "2026-12-10",
    compra_grupo_id: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d",
    observacoes: "Será pago no Cartão Preto do Fofo (5x)"
  },
  {
    descricao: "Andaime e escoras (5/5)",
    categoria: "Serviços e Locações",
    subcategoria: "Equipamentos",
    valor_bruto: 1045.50,
    desconto: 0.00,
    valor_final: 1045.50,
    status: "Pendente",
    origem_pagamento: "CARTAO_PRETO_CREDITO_FOFO",
    responsavel: "Fofo",
    parcela_numero: 5,
    parcelas_total: 5,
    valor_parcela: 209.10,
    data_vencimento: "2027-01-10",
    compra_grupo_id: "a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d",
    observacoes: "Será pago no Cartão Preto do Fofo (5x)"
  },
  {
    descricao: "Caixa d'água completa",
    categoria: "Material para a Casa",
    subcategoria: "Hidráulica / Elétrica",
    valor_bruto: 456.00,
    desconto: 0.00,
    valor_final: 456.00,
    status: "Pago",
    origem_pagamento: "CARTAO_CREDITO_JOAO",
    responsavel: "João",
    parcela_numero: 1,
    parcelas_total: 1,
    valor_parcela: 456.00,
    data_vencimento: null,
    observacoes: "Cartão de Crédito João"
  },
  {
    descricao: "Laje estrutural (1/3)",
    categoria: "Material para a Casa",
    subcategoria: "Estrutura",
    valor_bruto: 6460.00,
    desconto: 0.00,
    valor_final: 6460.00,
    status: "Pago",
    origem_pagamento: "PIX",
    responsavel: "João",
    parcela_numero: 1,
    parcelas_total: 3,
    valor_parcela: 2153.33,
    data_vencimento: null,
    compra_grupo_id: "b2c3d4e5-f6a5-4b8c-7d9e-0f1a2b3c4d5e",
    observacoes: "3 parcelas via PIX"
  },
  {
    descricao: "Laje estrutural (2/3)",
    categoria: "Material para a Casa",
    subcategoria: "Estrutura",
    valor_bruto: 6460.00,
    desconto: 0.00,
    valor_final: 6460.00,
    status: "Pendente",
    origem_pagamento: "PIX",
    responsavel: "João",
    parcela_numero: 2,
    parcelas_total: 3,
    valor_parcela: 2153.33,
    data_vencimento: "2026-10-10",
    compra_grupo_id: "b2c3d4e5-f6a5-4b8c-7d9e-0f1a2b3c4d5e",
    observacoes: "3 parcelas via PIX"
  },
  {
    descricao: "Laje estrutural (3/3)",
    categoria: "Material para a Casa",
    subcategoria: "Estrutura",
    valor_bruto: 6460.00,
    desconto: 0.00,
    valor_final: 6460.00,
    status: "Pendente",
    origem_pagamento: "PIX",
    responsavel: "João",
    parcela_numero: 3,
    parcelas_total: 3,
    valor_parcela: 2153.34,
    data_vencimento: "2026-11-10",
    compra_grupo_id: "b2c3d4e5-f6a5-4b8c-7d9e-0f1a2b3c4d5e",
    observacoes: "3 parcelas via PIX"
  },
  {
    descricao: "Madeiramento e fôrmas",
    categoria: "Material de Apoio",
    subcategoria: "Fôrmas e Fixação",
    valor_bruto: 706.00,
    desconto: 36.00,
    valor_final: 670.00,
    status: "Pago",
    origem_pagamento: "CARTAO_PRETO_CREDITO_FOFO",
    responsavel: "Fofo",
    parcela_numero: 1,
    parcelas_total: 1,
    valor_parcela: 670.00,
    data_vencimento: null,
    observacoes: "Cartão Preto do Fofo (desconto de R$ 36.00)"
  },
  {
    descricao: "Pedreiro (2ª etapa)",
    categoria: "Mão de Obra",
    subcategoria: "Alvenaria / Geral",
    valor_bruto: 1200.00,
    desconto: 0.00,
    valor_final: 1200.00,
    status: "Pendente",
    origem_pagamento: "PIX",
    responsavel: "João",
    parcela_numero: 1,
    parcelas_total: 1,
    valor_parcela: 1200.00,
    data_vencimento: "2026-09-10",
    observacoes: "Programado para pagamento via PIX do João"
  }
];

async function run() {
  console.log("Iniciando migração dos dados históricos para o Supabase...");
  
  console.log("Limpando a tabela 'despesas' antes de inserir...");
  await supabase.from('despesas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const { data, error } = await supabase.from('despesas').insert(dadosMigracao).select();
  if (error) {
    console.error("Erro na inserção:", error);
    process.exit(1);
  }
  console.log(`Sucesso: ${data.length} registros persistidos no banco.`);
}

run();
