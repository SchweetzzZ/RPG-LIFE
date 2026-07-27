import createClient from "openapi-fetch"
import type { paths } from "../api/schema"

const BASE_URL = "/api"

export const client = createClient<paths>({
  baseUrl: BASE_URL,
  credentials: 'include'
})

client.use({
  async onRequest({ request }) {
    const token = localStorage.getItem('access_token');

    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }

    if (!request.headers.has('Content-Type')) {
      request.headers.set('Content-Type', 'application/json');
    }

    return request;
  },

  async onResponse({ response }) {
    if (response.status === 401) {
      localStorage.removeItem('access_token')

      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return response;
  }
})