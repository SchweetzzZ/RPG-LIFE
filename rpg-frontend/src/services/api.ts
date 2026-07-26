/**
 * Centralized API Service for HTTP calls to NestJS Backend
 */

import { WorkoutRoutine, WorkoutLogEntry } from '../types';

const BASE_URL = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token');
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    localStorage.removeItem('access_token');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorBody.message || `API Error (${response.status})`);
  }

  return response.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; username: string; password: string; role?: string }) =>
    request<{ id: string; email: string; username: string }>('/user/register', {
      method: 'POST',
      body: JSON.stringify({ role: 'player', ...data }),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ access_Token: string }>('/user/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── Profile ──────────────────────────────────────────────────────────────────

export const profileApi = {
  getProfile: () => request<any>('/profile'),

  updateProfile: (data: any) =>
    request<any>('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getRecommendations: () => request<any[]>('/profile/recommendations'),

  updateNutrition: (data: any) =>
    request<any>('/profile/nutrition', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ── Workout Routines ─────────────────────────────────────────────────────────

export const workoutApi = {
  /** Create a new routine — returns the saved doc with _id */
  create: (routine: Omit<WorkoutRoutine, 'id'>) =>
    request<WorkoutRoutine & { _id: string }>('/workout', {
      method: 'POST',
      body: JSON.stringify(routine),
    }),

  /** List all routines for the authenticated user */
  list: () => request<(WorkoutRoutine & { _id: string })[]>('/workout'),

  /** Update an existing routine */
  update: (id: string, routine: Partial<WorkoutRoutine>) =>
    request<WorkoutRoutine & { _id: string }>(`/workout/${id}`, {
      method: 'PUT',
      body: JSON.stringify(routine),
    }),

  /** Delete a routine */
  delete: (id: string) =>
    request<void>(`/workout/${id}`, {
      method: 'DELETE',
    }),
};

// ── Workout Logs ─────────────────────────────────────────────────────────────

export const workoutLogApi = {
  createLog: (log: WorkoutLogEntry) =>
    request<any>('/workout/logs', {
      method: 'POST',
      body: JSON.stringify(log),
    }),

  getLogs: () => request<any[]>('/workout/logs/user'),
};

// ── Nutrition ────────────────────────────────────────────────────────────────

export const nutritionApi = {
  searchFoods: (query: string) =>
    request<any[]>(`/search?q=${encodeURIComponent(query)}`),
};

// ── Character ────────────────────────────────────────────────────────────────

export const characterApi = {
  addXp: (data: { xpGained: number; coinsGained: number; statBonus?: { stat: string; amount: number } }) =>
    request<any>('/character/xp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
