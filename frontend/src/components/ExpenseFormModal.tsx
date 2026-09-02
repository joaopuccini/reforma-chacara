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
    parcelas: 'À vista',
    pago_joao: 0,
    pago_fofo: 0,
    pendente: 0,
    link_comprovante: '',
    observacoes: ''
  });

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
          parcelas: res.data.parcelas || 'À vista',
          pago_joao: Number(res.data.pago_joao) || 0,
          pago_fofo: Number(res.data.pago_fofo) || 0,
          pendente: Number(res.data.pendente) || 0,
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

  const setSplit = (type: 'joao' | 'fofo' | 'meio' | 'pendente') => {
    const total = formData.valor_final;
    if (type === 'joao') {
      setFormData(prev => ({ ...prev, pago_joao: total, pago_fofo: 0, pendente: 0, status: 'Pago' }));
    } else if (type === 'fofo') {
      setFormData(prev => ({ ...prev, pago_joao: 0, pago_fofo: total, pendente: 0, status: 'Pago' }));
    } else if (type === 'meio') {
      const half = total / 2;
      setFormData(prev => ({ ...prev, pago_joao: half, pago_fofo: half, pendente: 0, status: 'Pago' }));
    } else if (type === 'pendente') {
      setFormData(prev => ({ ...prev, pago_joao: 0, pago_fofo: 0, pendente: total, status: 'Pendente' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (expenseId) {
        await updateExpense({ id: expenseId, updates: { ...formData, status: formData.status as 'Pago' | 'Pendente' } });
      } else {
        await createExpense({ ...formData, status: formData.status as 'Pago' | 'Pendente' });
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
                <label className="text-sm font-medium">Status</label>
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

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium">Rateio</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setSplit('joao')} className="px-2 py-1 text-xs border rounded hover:bg-muted">100% João</button>
                  <button type="button" onClick={() => setSplit('fofo')} className="px-2 py-1 text-xs border rounded hover:bg-muted">100% Fofo</button>
                  <button type="button" onClick={() => setSplit('meio')} className="px-2 py-1 text-xs border rounded hover:bg-muted">50/50</button>
                  <button type="button" onClick={() => setSplit('pendente')} className="px-2 py-1 text-xs border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 rounded">Pendente</button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pago por João</label>
                  <input type="number" step="0.01" name="pago_joao" value={formData.pago_joao} onChange={handleChange} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pago por Fofo</label>
                  <input type="number" step="0.01" name="pago_fofo" value={formData.pago_fofo} onChange={handleChange} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-amber-500">Pendente a Pagar</label>
                  <input type="number" step="0.01" name="pendente" value={formData.pendente} onChange={handleChange} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" />
                </div>
              </div>
            </div>

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
