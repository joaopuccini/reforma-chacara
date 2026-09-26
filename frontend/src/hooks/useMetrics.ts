import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Metrics } from '../types/expense';

export function useMetrics(etapa?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['metrics', etapa],
    enabled: options?.enabled !== false,
    queryFn: async () => {
      const { data } = await api.get('/expenses/metrics', { params: { etapa } });
      return data as Metrics;
    },
  });
}

export function useEtapas(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['etapas'],
    enabled: options?.enabled !== false,
    queryFn: async () => {
      const { data } = await api.get('/expenses/etapas');
      return data as string[];
    },
  });
}
