import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Metrics } from '../types/expense';

export function useMetrics(etapa?: string) {
  return useQuery({
    queryKey: ['metrics', etapa],
    queryFn: async () => {
      const { data } = await api.get('/expenses/metrics', { params: { etapa } });
      return data as Metrics;
    },
  });
}
