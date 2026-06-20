import client from './client';
import type { GamingTable, ActiveTableSession, TableStatus, PaginatedResponse } from '../types';

export async function getTables(params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}): Promise<PaginatedResponse<GamingTable>> {
  const res = await client.get('/tables', { params });
  return { data: res.data.data, pagination: res.data.pagination };
}

export async function getTable(id: number): Promise<GamingTable> {
  const res = await client.get(`/tables/${id}`);
  return res.data.data;
}

export async function createTable(payload: {
  name: string;
  type: string;
  price_per_minute?: number;
  price_per_hour?: number;
  wiz_ip?: string;
  wiz_mac?: string;
}): Promise<GamingTable> {
  const res = await client.post('/tables', payload);
  return res.data.data;
}

export async function updateTableStatus(
  id: number,
  status: TableStatus
): Promise<GamingTable> {
  const res = await client.patch(`/tables/${id}/status`, { status });
  return res.data.data;
}

export async function deleteTable(id: number): Promise<{ id: number; name: string; type: string }> {
  const res = await client.delete(`/tables/${id}`);
  return res.data.data;
}

export async function getTableActiveSession(
  id: number
): Promise<ActiveTableSession | null> {
  const res = await client.get(`/tables/${id}/session`);
  return res.data.data;
}
