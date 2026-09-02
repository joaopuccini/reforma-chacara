export class Expense {
  id: string;
  descricao: string;
  categoria: string;
  subcategoria: string;
  valor_bruto: number;
  desconto: number;
  valor_final: number;
  status: string;
  parcelas: string;
  pago_joao: number;
  pago_fofo: number;
  pendente: number;
  link_comprovante: string;
  observacoes: string;
  created_at: Date;
}
