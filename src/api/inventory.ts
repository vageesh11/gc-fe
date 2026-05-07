import client from './client';
import type { InventoryItem, PaginatedResponse } from '../types';

export async function getInventory(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResponse<InventoryItem>> {
  const res = await client.get('/inventory', { params });
  return { data: res.data.data, pagination: res.data.pagination };
}

export async function getInventoryItem(id: number): Promise<InventoryItem> {
  const res = await client.get(`/inventory/${id}`);
  return res.data.data;
}

export async function createInventoryItem(payload: {
  name: string;
  price: number;
  stock_quantity: number;
}): Promise<InventoryItem> {
  const res = await client.post('/inventory', payload);
  return res.data.data;
}

export async function updateInventoryItem(
  id: number,
  payload: { name?: string; price?: number; stock_quantity?: number }
): Promise<InventoryItem> {
  const res = await client.patch(`/inventory/${id}`, payload);
  return res.data.data;
}

export async function deleteInventoryItem(
  id: number
): Promise<{ id: number; name: string }> {
  const res = await client.delete(`/inventory/${id}`);
  return res.data.data;
}
