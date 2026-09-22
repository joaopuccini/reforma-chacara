import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const expensesApi = {
  getExpenses: async (params?: any) => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },
  createExpense: async (data: any) => {
    const response = await api.post('/expenses', data);
    return response.data;
  },
  updateExpense: async (id: string, data: any) => {
    const response = await api.patch(`/expenses/${id}`, data);
    return response.data;
  },
  deleteExpense: async (id: string) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },
  getMetrics: async (params?: any) => {
    const response = await api.get('/expenses/metrics', { params });
    return response.data;
  },
  getEtapas: async () => {
    const response = await api.get('/expenses/etapas');
    return response.data;
  }
};

export const planningApi = {
  getWorkStages: async () => {
    const response = await api.get('/planning/stages');
    return response.data;
  },
  getExecutionSchedules: async () => {
    const response = await api.get('/planning/schedules');
    return response.data;
  },
  getPlanningCosts: async () => {
    const response = await api.get('/planning/costs');
    return response.data;
  }
};

export const chatApi = {
  sendMessage: async (text: string, mediaData?: { mimeType: string; base64: string }) => {
    const response = await api.post('/telegram/web-chat', { text, mediaData });
    return response.data;
  }
};

export default api;
