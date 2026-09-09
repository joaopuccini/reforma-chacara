import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useExpenseMutation } from '../hooks/useExpenses';
import api from '../services/api';

interface ExpenseFormModalProps {
  expenseId: string | null;
  onClose: () => void;
}

export default function ExpenseFormModal({ expenseId, onClose }: ExpenseFormModalProps) {
  const { createExpense, updateExpense, isPending } = useExpenseMutation();
  
  const [formData, setFormData] = useState({
    descricao: '',
    categoria: 'Material para a Casa',
    subcategoria: '',
    valor_bruto: 0,
    desconto: 0,
    valor_final: 0,
    status: 'Pago',
    origem_pagamento: 'PIX',
    responsavel: 'João',
    parcelas_total: 1,
    data_vencimento: '',
    link_comprovante: '',
    observacoes: ''
  });

  const [useCustomInstallments, setUseCustomInstallments] = useState(false);
  const [customValores, setCustomValores] = useState<number[]>([]);

  useEffect(() => {
    if (formData.parcelas_total > customValores.length) {
      setCustomValores(prev => [...prev, ...Array(formData.parcelas_total - prev.length).fill(0)]);
    } else if (formData.parcelas_total < customValores.length) {
      setCustomValores(prev => prev.slice(0, formData.parcelas_total));
    }
  }, [formData.parcelas_total]);

  useEffect(() => {
    if (expenseId) {
      api.get(`/expenses/${expenseId}`).then(res => {
        setFormData({
          descricao: res.data.descricao || '',
          categoria: res.data.categoria || 'Material para a Casa',
          subcategoria: res.data.subcategoria || '',
          valor_bruto: Number(res.data.valor_bruto) || 0,
          desconto: Number(res.data.desconto) || 0,
          valor_final: Number(res.data.valor_final) || 0,
          status: res.data.status || 'Pago',
          origem_pagamento: res.data.origem_pagamento || 'PIX',
          responsavel: res.data.responsavel || 'João',
          parcelas_total: Number(res.data.parcelas_total) || 1,
          data_vencimento: res.data.data_vencimento ? res.data.data_vencimento.split('T')[0] : '',
          link_comprovante: res.data.link_comprovante || '',
          observacoes: res.data.observacoes || ''
        });
      });
    }
  }, [expenseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | number = value;
    
    if (type === 'number') {
      newValue = value === '' ? 0 : parseFloat(value);
    }
    
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      
      // Auto-calculate valor_final if bruto or desconto changes
      if (name === 'valor_bruto' || name === 'desconto') {
        updated.valor_final = Number(updated.valor_bruto) - Number(updated.desconto);
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...formData, status: formData.status as 'Pago' | 'Pendente' };
      
      if (!expenseId && formData.parcelas_total > 1 && useCustomInstallments) {
        payload.valores_parcelas = customValores;
        const sum = customValores.reduce((a, b) => a + b, 0);
        if (Math.abs(sum - formData.valor_final) > 0.05) {
          alert('A soma das parcelas deve ser igual ao Valor Final!');
          return;
        }
      }

      if (expenseId) {
        await updateExpense({ id: expenseId, updates: payload });
      } else {
        await createExpense(payload);
      }
      onClose();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar despesa');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card text-card-foreground w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border/50 bg-background/80 backdrop-blur-md">
          <h2 className="text-lg font-semibold">{expenseId ? 'Editar Despesa' : 'Nova Despesa'}</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição *</label>
                <input required type="text" name="descricao" value={formData.descricao} onChange={handleChange} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria *</label>
                <select name="categoria" value={formData.categoria} onChange={handleChange} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
                  <option value="Mão de Obra">Mão de Obra</option>
                  <option value="Material para a Casa">Material para a Casa</option>
                  <option value="Material de Apoio">Material de Apoio</option>
                  <option value="Serviços e Locações">Serviços e Locações</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subcategoria *</label>
                <input required type="text" name="subcategoria" value={formData.subcategoria} onChange={handleChange} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status *</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
                  <option value="Pago">Pago</option>
                  <option value="Pendente">Pendente</option>
                </select>
              </div>
            </div>

            <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor Bruto</label>
                <input type="number" step="0.01" name="valor_bruto" value={formData.valor_bruto} onChange={handleChange} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Desconto</label>
                <input type="number" step="0.01" name="desconto" value={formData.desconto} onChange={handleChange} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Valor Final *</label>
                <input required type="number" step="0.01" name="valor_final" value={formData.valor_final} onChange={handleChange} className="w-full rounded-md border border-primary bg-primary/5 px-3 py-2 text-sm shadow-sm" />
              </div>
            </div>

            <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Origem do Pagamento *</label>
                <select required name="origem_pagamento" value={formData.origem_pagamento} onChange={handleChange} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
                  <option value="PIX">PIX</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CARTAO_CREDITO_JOAO">Cartão de Crédito João</option>
                  <option value="CARTAO_PRETO_CREDITO_FOFO">Cartão Preto Crédito Fofo</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Responsável *</label>
                <select required name="responsavel" value={formData.responsavel} onChange={handleChange} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
                  <option value="João">João</option>
                  <option value="Fofo">Fofo</option>
                </select>
              </div>
            </div>
            
            {!expenseId && (
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Qtd. Parcelas *</label>
                    <input required type="number" min="1" step="1" name="parcelas_total" value={formData.parcelas_total} onChange={handleChange} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                  </div>
                </div>

                {formData.parcelas_total > 1 && (
                  <div className="space-y-4 border border-border rounded-md p-4 bg-muted/10">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="customInstallments" 
                        checked={useCustomInstallments} 
                        onChange={(e) => setUseCustomInstallments(e.target.checked)}
                        className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                      />
                      <label htmlFor="customInstallments" className="text-sm font-medium cursor-pointer">
                        Definir valores manualmente por parcela
                      </label>
                    </div>

                    {useCustomInstallments ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {customValores.map((val, idx) => (
                            <div key={idx} className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">{idx + 1}ª Parcela</label>
                              <input 
                                type="number" 
                                step="0.01"
                                value={val || ''} 
                                onChange={(e) => {
                                  const newVals = [...customValores];
                                  newVals[idx] = parseFloat(e.target.value) || 0;
                                  setCustomValores(newVals);
                                }} 
                                className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm" 
                              />
                            </div>
                          ))}
                        </div>
                        <div className="text-sm flex items-center justify-between pt-2 border-t border-border/50">
                          <span className="text-muted-foreground">Soma das parcelas:</span>
                          <span className={`font-semibold ${Math.abs(customValores.reduce((a, b) => a + b, 0) - formData.valor_final) > 0.05 ? 'text-destructive' : 'text-emerald-500'}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(customValores.reduce((a, b) => a + b, 0))}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm space-y-1">
                        <p className="text-muted-foreground mb-2">O sistema dividirá o valor igualmente:</p>
                        <div className="bg-background border border-border rounded p-3 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-foreground">1ª parcela (à vista):</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.floor((formData.valor_final / formData.parcelas_total) * 100) / 100)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-foreground">Demais {formData.parcelas_total - 1} parcelas (mensais):</span>
                            <span className="font-semibold text-muted-foreground">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.floor((formData.valor_final / formData.parcelas_total) * 100) / 100)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {expenseId && formData.status === 'Pendente' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vencimento da Parcela (Se Pendente)</label>
                  <input type="date" name="data_vencimento" value={formData.data_vencimento} onChange={handleChange} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                </div>
              </div>
            )}

            <div className="border-t border-border pt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={2} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none"></textarea>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Link do Comprovante</label>
                <input type="text" name="link_comprovante" value={formData.link_comprovante} onChange={handleChange} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isPending ? 'Salvando...' : 'Salvar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
