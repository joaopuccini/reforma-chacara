export interface Expense {
  id: string;
  descricao: string;
  categoria: string;
  subcategoria: string;
  valor_bruto: number;
  desconto: number;
  valor_final: number;
  status: 'Pago' | 'Pendente';
  origem_pagamento: string;
  responsavel: string;
  parcela_numero: number;
  parcelas_total: number;
  valor_parcela: number;
  data_vencimento: string | null;
  compra_grupo_id?: string | null;
  link_comprovante?: string | null;
  comprovante_url?: string | null;
  observacoes?: string | null;
  created_at?: string;
  updated_at: string;
}

export interface Metrics {
  totalGeral: number;
  totalPagoJoao: number;
  totalPagoFofo: number;
  totalPendente: number;
  acertoContas: {
    diferenca: number;
    devedor: string;
    credor: string;
    valorCompensacao: number;
    resumoTexto: string;
  };
  totalPorCategoria: Record<string, number>;
}
