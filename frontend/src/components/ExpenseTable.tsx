import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Expense } from '../types/expense';
import { Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
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

function EditableTotal({ expense, onSave }: { expense: Expense, onSave: (val: number) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(expense.valor_final);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVal(expense.valor_final);
  }, [expense.valor_final]);

  const handleBlur = () => {
    setIsEditing(false);
    if (val !== expense.valor_final) onSave(val);
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  }

  if (isEditing) {
    return <input 
      ref={inputRef}
      autoFocus
      type="number" 
      step="0.01"
      className="w-24 px-1 py-0.5 text-sm bg-background border border-primary rounded outline-none" 
      value={val} 
      onChange={e => setVal(parseFloat(e.target.value))} 
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
    />
  }

  return <span 
    className="cursor-pointer hover:text-primary hover:underline underline-offset-2 decoration-dashed transition-colors"
    onClick={(e) => {
      e.stopPropagation();
      setIsEditing(true);
    }}
    title="Clique para editar o valor total"
  >
    {formatCurrency(expense.valor_final)}
  </span>
}

export default function ExpenseTable({ data, meta, isLoading, onEdit, onPageChange }: ExpenseTableProps) {
  const { deleteExpense, updateExpense } = useExpenseMutation();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const groupedData = useMemo(() => {
    if (!data) return [];
    const groups = new Map<string, Expense[]>();
    const result: Array<{ isGroup: boolean; id: string; items: Expense[] }> = [];

    data.forEach(exp => {
      if (exp.compra_grupo_id && exp.parcelas_total > 1) {
        if (!groups.has(exp.compra_grupo_id)) {
          groups.set(exp.compra_grupo_id, []);
          result.push({ isGroup: true, id: exp.compra_grupo_id, items: groups.get(exp.compra_grupo_id)! });
        }
        groups.get(exp.compra_grupo_id)!.push(exp);
      } else {
        result.push({ isGroup: false, id: exp.id, items: [exp] });
      }
    });

    return result;
  }, [data]);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta despesa (e todas suas parcelas)?')) {
      await deleteExpense(id);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateExpense({ id, updates: { status: newStatus as 'Pago' | 'Pendente' } });
  };

  const handleTotalChange = async (id: string, newTotal: number) => {
    if (isNaN(newTotal) || newTotal <= 0) return;
    await updateExpense({ id, updates: { valor_final: newTotal } });
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
                <th className="w-8 px-2 py-3"></th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Parcela (R$)</th>
                <th className="px-4 py-3 font-medium">Origem</th>
                <th className="px-4 py-3 font-medium">Resp.</th>
                <th className="px-4 py-3 font-medium">Venc.</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {groupedData.map((group) => {
                if (!group.isGroup) {
                  const expense = group.items[0];
                  return (
                    <tr 
                      key={expense.id} 
                      className={clsx(
                        "border-b border-border last:border-0 hover:bg-muted/30 transition-colors border-l-[3px]",
                        expense.status === 'Pago' ? "border-l-emerald-500" : "border-l-amber-500"
                      )}
                    >
                      <td className="w-8 px-2 py-3"></td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{expense.descricao}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]" title={expense.observacoes}>{expense.observacoes}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-foreground">{expense.categoria}</div>
                        <div className="text-xs text-muted-foreground">{expense.subcategoria}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <EditableTotal expense={expense} onSave={(val) => handleTotalChange(expense.id, val)} />
                      </td>
                      <td className="px-4 py-3 font-medium text-muted-foreground">
                        {formatCurrency(expense.valor_parcela)}
                        {expense.parcelas_total > 1 && <span className="ml-1 text-xs">({expense.parcela_numero}/{expense.parcelas_total})</span>}
                      </td>
                      <td className="px-4 py-3 text-sm">{expense.origem_pagamento}</td>
                      <td className="px-4 py-3 text-sm">{expense.responsavel}</td>
                      <td className="px-4 py-3 text-sm">
                        {expense.data_vencimento ? new Date(expense.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={expense.status}
                          onChange={(e) => handleStatusChange(expense.id, e.target.value)}
                          className={clsx(
                            "px-2 py-0.5 rounded text-xs font-medium cursor-pointer appearance-none outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-0",
                            expense.status === 'Pago' ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          )}
                        >
                          <option value="Pago" className="bg-background text-foreground">Pago</option>
                          <option value="Pendente" className="bg-background text-foreground">Pendente</option>
                        </select>
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
                  );
                } else {
                  // Linha Agrupada (Compra Parcelada)
                  const parent = group.items[0];
                  const isExpanded = expandedGroups.has(group.id);
                  const paidCount = group.items.filter(i => i.status === 'Pago').length;
                  const totalCount = parent.parcelas_total;
                  const isAllPaid = paidCount === totalCount;
                  const cleanDescription = parent.descricao.replace(/\(\d+\/\d+\)$/, '').trim();

                  return (
                    <React.Fragment key={group.id}>
                      <tr 
                        onClick={() => toggleGroup(group.id)}
                        className={clsx(
                          "border-b border-border last:border-0 hover:bg-muted/30 transition-colors border-l-[3px] cursor-pointer",
                          isExpanded ? "bg-muted/10" : "",
                          isAllPaid ? "border-l-emerald-500" : "border-l-amber-500"
                        )}
                      >
                        <td className="w-8 px-2 py-3 text-muted-foreground">
                          <div className="flex justify-center">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {cleanDescription}
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              Parcelada
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]" title={parent.observacoes}>{parent.observacoes}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-foreground">{parent.categoria}</div>
                          <div className="text-xs text-muted-foreground">{parent.subcategoria}</div>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <EditableTotal expense={parent} onSave={(val) => handleTotalChange(parent.id, val)} />
                        </td>
                        <td className="px-4 py-3 font-medium text-muted-foreground">
                          —
                        </td>
                        <td className="px-4 py-3 text-sm">{parent.origem_pagamento}</td>
                        <td className="px-4 py-3 text-sm">{parent.responsavel}</td>
                        <td className="px-4 py-3 text-sm">—</td>
                        <td className="px-4 py-3">
                          <span className={clsx(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border-0",
                            isAllPaid ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          )}>
                            {paidCount}/{totalCount} Pagas
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => handleDelete(parent.id)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                              title="Excluir Grupo Inteiro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && group.items.map(expense => (
                        <tr 
                          key={expense.id} 
                          className={clsx(
                            "border-b border-border last:border-0 hover:bg-muted/40 transition-colors bg-muted/20 border-l-[3px]",
                            expense.status === 'Pago' ? "border-l-emerald-500/40" : "border-l-amber-500/40"
                          )}
                        >
                          <td className="w-8 px-2 py-3"></td>
                          <td className="px-4 py-3 pl-8">
                            <div className="font-medium text-foreground opacity-90 text-sm flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-border" />
                              Parcela {expense.parcela_numero}
                            </div>
                          </td>
                          <td className="px-4 py-3 opacity-70">
                            <div className="text-xs">{expense.subcategoria}</div>
                          </td>
                          <td className="px-4 py-3 opacity-40 text-sm">
                            —
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {formatCurrency(expense.valor_parcela)}
                          </td>
                          <td className="px-4 py-3 text-sm opacity-80">{expense.origem_pagamento}</td>
                          <td className="px-4 py-3 text-sm opacity-80">{expense.responsavel}</td>
                          <td className="px-4 py-3 text-sm">
                            {expense.data_vencimento ? new Date(expense.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              value={expense.status}
                              onChange={(e) => handleStatusChange(expense.id, e.target.value)}
                              className={clsx(
                                "px-2 py-0.5 rounded text-xs font-medium cursor-pointer appearance-none outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-0",
                                expense.status === 'Pago' ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              )}
                            >
                              <option value="Pago" className="bg-background text-foreground">Pago</option>
                              <option value="Pendente" className="bg-background text-foreground">Pendente</option>
                            </select>
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
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                }
              })}
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
              className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Anterior
            </button>
            <button 
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange(meta.page + 1)}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
