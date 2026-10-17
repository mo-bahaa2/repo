// src/api.ts

const BASE_URL = 'https://backend-test-six-alpha.vercel.app';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Basic ${token}` } : {})
  };
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token might be invalid, logout the user
      localStorage.removeItem('adminToken');
      window.location.href = '/'; // redirect to login
    }
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || 'حدث خطأ أثناء الاتصال بالخادم');
  }

  return response.json();
};
