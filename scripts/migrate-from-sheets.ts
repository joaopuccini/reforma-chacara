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
    descricao: "Pedreiro (Entrada Mão de Obra)",
    categoria: "Mão de Obra",
    subcategoria: "Alvenaria / Geral",
    valor_bruto: 500.00,
    desconto: 0.00,
    valor_final: 500.00,
    status: "Pago",
    parcelas: "À vista",
    pago_joao: 200.00,
    pago_fofo: 300.00,
    pendente: 0.00,
    observacoes: "João via PIX (R$ 200.00) e Fofo em Dinheiro (R$ 300.00)"
  },
  {
    descricao: "Caçamba de entulho",
    categoria: "Serviços e Locações",
    subcategoria: "Limpeza / Caçamba",
    valor_bruto: 200.00,
    desconto: 0.00,
    valor_final: 200.00,
    status: "Pago",
    parcelas: "À vista",
    pago_joao: 0.00,
    pago_fofo: 200.00,
    pendente: 0.00,
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
    parcelas: "À vista",
    pago_joao: 0.00,
    pago_fofo: 0.00,
    pendente: 1040.00,
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
    parcelas: "À vista",
    pago_joao: 456.00,
    pago_fofo: 0.00,
    pendente: 0.00,
    observacoes: "Cartão de Crédito João"
  },
  {
    descricao: "Laje estrutural",
    categoria: "Material para a Casa",
    subcategoria: "Estrutura",
    valor_bruto: 6400.00,
    desconto: 0.00,
    valor_final: 6400.00,
    status: "Pendente",
    parcelas: "3x PIX",
    pago_joao: 0.00,
    pago_fofo: 0.00,
    pendente: 6400.00,
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
    parcelas: "À vista",
    pago_joao: 0.00,
    pago_fofo: 670.00,
    pendente: 0.00,
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
    parcelas: "À vista",
    pago_joao: 0.00,
    pago_fofo: 0.00,
    pendente: 1200.00,
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
    parcelas: "À vista",
    pago_joao: 175.00,
    pago_fofo: 0.00,
    pendente: 0.00,
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
    parcelas: "À vista",
    pago_joao: 0.00,
    pago_fofo: 160.00,
    pendente: 0.00,
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
