/**
 * API client skeleton — Phase 1 foundation.
 * Auth headers, tenant headers, and interceptors will be added in Phase 2.
 */

import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export default api;
