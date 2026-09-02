export class Expense {
  id: string;
  descricao: string;
  categoria: string;
  subcategoria: string;
  valor_bruto: number;
  desconto: number;
  valor_final: number;
  status: string;
  origem_pagamento: string;
  responsavel: string;
  parcela_numero: number;
  parcelas_total: number;
  valor_parcela: number;
  data_vencimento: Date | null;
  compra_grupo_id: string | null;
  link_comprovante: string;
  observacoes: string;
  created_at: Date;
  updated_at: Date;
}
