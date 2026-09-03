import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Expense } from '../types/expense';

interface QueryParams {
  page?: number;
  limit?: number;
  categoria?: string;
  status?: string;
  search?: string;
}

export function useExpenses(params: QueryParams) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: async () => {
      const { data } = await api.get('/expenses', { params });
      return data as { data: Expense[]; meta: { total: number; page: number; totalPages: number } };
    },
  });
}

export function useExpenseMutation() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (newExpense: Partial<Expense>) => {
      const { data } = await api.post('/expenses', newExpense);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Expense> }) => {
      const { data } = await api.patch(`/expenses/${id}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data } = await api.post(`/expenses/${id}/receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  return {
    createExpense: createMutation.mutateAsync,
    updateExpense: updateMutation.mutateAsync,
    deleteExpense: deleteMutation.mutateAsync,
    uploadReceipt: uploadMutation.mutateAsync,
    isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || uploadMutation.isPending,
  };
}
