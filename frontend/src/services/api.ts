import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Apenas forçamos o reload se não estivermos na tela de login
      if (window.location.pathname !== '/login' && !error.config.url.includes('/auth/login')) {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

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
  },
  saveFloorPlan: async (plan: any) => {
    const response = await api.post('/planning/floorplan/save', plan);
    return response.data;
  },
  getFloorPlanVersions: async () => {
    const response = await api.get('/planning/floorplan/versions');
    return response.data;
  }
};

export const chatApi = {
  sendMessage: async (text: string, mediaData?: { mimeType: string; base64: string }) => {
    const response = await api.post('/telegram/web-chat', { text, mediaData });
    return response.data;
  }
};

export const authApi = {
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  }
};

export default api;
