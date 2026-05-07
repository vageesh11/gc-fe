import client from './client';
import type { AuthUser } from '../types';

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await client.post('/auth/login', { username, password });
  return res.data.data;
}
