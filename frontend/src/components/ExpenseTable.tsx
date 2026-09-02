import { Expense } from '../types/expense';
import { Pencil, Trash2 } from 'lucide-react';
import { useExpenseMutation } from '../hooks/useExpenses';
import clsx from 'clsx';

interface ExpenseTableProps {
  data: Expense[];
  meta: any;
  isLoading: boolean;
  onEdit: (id: string) => void;
  onPageChange: (page: number) => void;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export default function ExpenseTable({ data, meta, isLoading, onEdit, onPageChange }: ExpenseTableProps) {
  const { deleteExpense } = useExpenseMutation();

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      await deleteExpense(id);
    }
  };

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center">Carregando...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Nenhuma despesa encontrada.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Origem</th>
                <th className="px-4 py-3 font-medium">Resp.</th>
                <th className="px-4 py-3 font-medium">Parcela</th>
                <th className="px-4 py-3 font-medium">Venc.</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((expense) => (
                <tr key={expense.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{expense.descricao}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{expense.observacoes}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{expense.categoria}</div>
                    <div className="text-xs text-muted-foreground">{expense.subcategoria}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(expense.valor_parcela)}</td>
                  <td className="px-4 py-3 text-sm">{expense.origem_pagamento}</td>
                  <td className="px-4 py-3 text-sm">{expense.responsavel}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {expense.parcela_numero}/{expense.parcelas_total}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {expense.data_vencimento ? new Date(expense.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                      expense.status === 'Pago' ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    )}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => onEdit(expense.id)}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(expense.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Página {meta.page} de {meta.totalPages} (Total: {meta.total})
          </span>
          <div className="flex gap-2">
            <button 
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50"
            >
              Anterior
            </button>
            <button 
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
