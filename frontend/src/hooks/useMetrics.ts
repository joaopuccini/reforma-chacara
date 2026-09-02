import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Metrics } from '../types/expense';

export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const { data } = await api.get('/expenses/metrics');
      return data as Metrics;
    },
  });
}
