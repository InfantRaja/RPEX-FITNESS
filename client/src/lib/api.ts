import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('repx_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('repx_token');
      localStorage.removeItem('repx_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message || 'Something went wrong';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
};

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  googleLogin: () => { window.location.href = `${BASE_URL}/auth/google`; },
};

// User API
export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: Partial<{
    name: string;
    avatar: string;
    bio?: string;
    height?: number;
    weight?: number;
    unitSystem?: 'metric' | 'imperial';
    age?: number;
    fitnessGoal?: string;
    fitnessExperience?: string;
  }>) => api.put('/users/profile', data),
  getPublicProfile: (id: string) => api.get(`/users/profile/${id}`),
  follow: (id: string) => api.post(`/users/${id}/follow`),
  unfollow: (id: string) => api.post(`/users/${id}/unfollow`),
  getFollowers: (id: string) => api.get(`/users/${id}/followers`),
  getFollowing: (id: string) => api.get(`/users/${id}/following`),
  discover: (params?: { q?: string; limit?: number }) => api.get('/users/discover', { params }),
  updateOnboarding: (data: any) => api.put('/users/onboarding', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/users/change-password', { currentPassword, newPassword }),
  deleteAccount: () => api.delete('/users/account'),
};

// Workout API
export const workoutApi = {
  getAll: (params?: any) => api.get('/workouts', { params }),
  getById: (id: string) => api.get(`/workouts/${id}`),
  create: (data: any) => api.post('/workouts', data),
  update: (id: string, data: any) => api.put(`/workouts/${id}`, data),
  delete: (id: string) => api.delete(`/workouts/${id}`),
  getStats: () => api.get('/workouts/stats/summary'),
};

// Split API
export const splitApi = {
  getAll: () => api.get('/splits'),
  getById: (id: string) => api.get(`/splits/${id}`),
  create: (data: any) => api.post('/splits', data),
  update: (id: string, data: any) => api.put(`/splits/${id}`, data),
  activate: (id: string) => api.patch(`/splits/${id}/activate`),
  delete: (id: string) => api.delete(`/splits/${id}`),
};

// Nutrition API
export const nutritionApi = {
  getAll: (params?: any) => api.get('/nutrition', { params }),
  getToday: () => api.get('/nutrition/today'),
  getById: (id: string) => api.get(`/nutrition/${id}`),
  create: (data: any) => api.post('/nutrition', data),
  update: (id: string, data: any) => api.put(`/nutrition/${id}`, data),
  delete: (id: string) => api.delete(`/nutrition/${id}`),
  getStats: () => api.get('/nutrition/stats/summary'),
  getCalculator: () => api.get('/nutrition/calculator'),
  recalculateTargets: (data: any) => api.post('/nutrition/recalculate', data),
  getMealPlan: (params?: any) => api.get('/nutrition/meal-plan', { params }),
  generateMealPlan: (data?: any) => api.post('/nutrition/meal-plan/generate', data),
  logPlannedMeal: (meal: any) => api.post('/nutrition/meal-plan/log-meal', { meal }),
  searchFoods: (params?: { query?: string; category?: string; dietaryPreference?: string; isAffordable?: boolean }) =>
    api.get('/nutrition/foods', { params }),
  logWater: (amountMl: number) => api.post('/nutrition/water', { amountMl }),
  quickLogFood: (data: { mealType: string; food: any }) => api.post('/nutrition/quick-log', data),
  deleteMealItem: (mealIndex: number, itemIndex: number) =>
    api.delete(`/nutrition/meals/${mealIndex}/item/${itemIndex}`),
  getTrends: () => api.get('/nutrition/progress/trends'),
};

// Progress API
export const progressApi = {
  getAll: (params?: any) => api.get('/progress', { params }),
  getLatest: () => api.get('/progress/latest'),
  getById: (id: string) => api.get(`/progress/${id}`),
  create: (data: any) => api.post('/progress', data),
  update: (id: string, data: any) => api.put(`/progress/${id}`, data),
  delete: (id: string) => api.delete(`/progress/${id}`),
};

// AI API
export const aiApi = {
  getConversations: () => api.get('/ai/conversations'),
  getConversation: (id: string) => api.get(`/ai/conversations/${id}`),
  chat: (data: { message: string; conversationId?: string; topic?: string; language?: string }) =>
    api.post('/ai/chat', data),
  deleteConversation: (id: string) => api.delete(`/ai/conversations/${id}`),
  recommendWorkout: () => api.post('/ai/recommend/workout'),
  recommendNutrition: () => api.post('/ai/recommend/nutrition'),
  getKeyStatus: () => api.get('/ai/key-status'),
  configKey: (apiKey: string) => api.post('/ai/config-key', { apiKey }),
};

// Analytics API
export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getWeeklyWorkouts: () => api.get('/analytics/workouts/weekly'),
  getWeeklyNutrition: () => api.get('/analytics/nutrition/weekly'),
  getProgressChart: (metric: string, limit?: number) =>
    api.get('/analytics/progress/chart', { params: { metric, limit } }),
};

export default api;
