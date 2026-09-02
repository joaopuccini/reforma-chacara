export interface Expense {
  id: string;
  descricao: string;
  categoria: string;
  subcategoria: string;
  valor_bruto: number;
  desconto: number;
  valor_final: number;
  status: 'Pago' | 'Pendente';
  parcelas: string;
  pago_joao: number;
  pago_fofo: number;
  pendente: number;
  link_comprovante: string;
  observacoes: string;
  created_at: string;
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
