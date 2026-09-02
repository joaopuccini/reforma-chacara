import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis do .env do projeto se existir, ou usar fallback
dotenv.config({ path: resolve(__dirname, '../.env') });

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
    descricao: "Andaime e escoras",
    categoria: "Serviços e Locações",
    subcategoria: "Equipamentos",
    valor_bruto: 1040.00,
    desconto: 0.00,
    valor_final: 1040.00,
    status: "Pendente",
    origem_pagamento: "CARTAO_PRETO_CREDITO_FOFO",
    responsavel: "Fofo",
    parcela_numero: 1,
    parcelas_total: 1,
    valor_parcela: 1040.00,
    data_vencimento: "2026-09-10",
    observacoes: "Será pago no Cartão Preto do Fofo"
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
    valor_bruto: 6400.00,
    desconto: 0.00,
    valor_final: 6400.00,
    status: "Pago",
    origem_pagamento: "PIX",
    responsavel: "João",
    parcela_numero: 1,
    parcelas_total: 3,
    valor_parcela: 2133.33,
    data_vencimento: null,
    observacoes: "3 parcelas de R$ 2.133,33 via PIX"
  },
  {
    descricao: "Laje estrutural (2/3)",
    categoria: "Material para a Casa",
    subcategoria: "Estrutura",
    valor_bruto: 6400.00,
    desconto: 0.00,
    valor_final: 6400.00,
    status: "Pendente",
    origem_pagamento: "PIX",
    responsavel: "João",
    parcela_numero: 2,
    parcelas_total: 3,
    valor_parcela: 2133.33,
    data_vencimento: "2026-10-10",
    observacoes: "3 parcelas de R$ 2.133,33 via PIX"
  },
  {
    descricao: "Laje estrutural (3/3)",
    categoria: "Material para a Casa",
    subcategoria: "Estrutura",
    valor_bruto: 6400.00,
    desconto: 0.00,
    valor_final: 6400.00,
    status: "Pendente",
    origem_pagamento: "PIX",
    responsavel: "João",
    parcela_numero: 3,
    parcelas_total: 3,
    valor_parcela: 2133.34,
    data_vencimento: "2026-11-10",
    observacoes: "3 parcelas de R$ 2.133,33 via PIX"
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
  },
  {
    descricao: "Cimento 5 sacos",
    categoria: "Material para a Casa",
    subcategoria: "Alvenaria",
    valor_bruto: 175.00,
    desconto: 0.00,
    valor_final: 175.00,
    status: "Pago",
    origem_pagamento: "CARTAO_CREDITO_JOAO",
    responsavel: "João",
    parcela_numero: 1,
    parcelas_total: 1,
    valor_parcela: 175.00,
    data_vencimento: null,
    observacoes: "Teste"
  },
  {
    descricao: "2 latas de tinta",
    categoria: "Material para a Casa",
    subcategoria: "Pintura",
    valor_bruto: 160.00,
    desconto: 0.00,
    valor_final: 160.00,
    status: "Pago",
    origem_pagamento: "DINHEIRO",
    responsavel: "Fofo",
    parcela_numero: 1,
    parcelas_total: 1,
    valor_parcela: 160.00,
    data_vencimento: null,
    observacoes: "Pagamento realizado integralmente pelo Fofo"
  }
];

async function run() {
  console.log("Iniciando migração dos dados históricos para o Supabase...");
  const { data, error } = await supabase.from('despesas').insert(dadosMigracao).select();
  if (error) {
    console.error("Erro na inserção:", error);
    process.exit(1);
  }
  console.log(`Sucesso: ${data.length} registros persistidos no banco.`);
}

run();
