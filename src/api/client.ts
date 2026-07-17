import axios from 'axios';

/* Placeholder only — Part 1 makes no HTTP calls. Part 2 wires the base URL,
   auth-token interceptor and error normalization here. */
export const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 20_000,
});
