import client from './client';
import type { Discount, PaginatedResponse } from '../types';

export async function getDiscounts(params?: {
  page?: number;
  limit?: number;
  include_inactive?: boolean;
  table_type?: 'pool' | 'snooker' | 'ps5';
}): Promise<PaginatedResponse<Discount>> {
  const res = await client.get('/discounts', { params });
  return { data: res.data.data, pagination: res.data.pagination };
}

export async function getDiscount(id: number): Promise<Discount> {
  const res = await client.get(`/discounts/${id}`);
  return res.data.data;
}

export async function getDiscountByCode(code: string): Promise<Discount> {
  const res = await client.get(`/discounts/code/${encodeURIComponent(code)}`);
  return res.data.data;
}

export async function createDiscount(payload: {
  name: string;
  code?: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  scope?: 'session' | 'order' | 'all';
  valid_from?: string | null;
  valid_until?: string | null;
}): Promise<Discount> {
  const res = await client.post('/discounts', payload);
  return res.data.data;
}

export async function updateDiscount(
  id: number,
  payload: Partial<{
    name: string;
    code: string;
    discount_type: 'percentage' | 'flat';
    discount_value: number;
    scope: 'session' | 'order' | 'all';
    is_active: boolean;
    valid_from: string | null;
    valid_until: string | null;
  }>
): Promise<Discount> {
  const res = await client.patch(`/discounts/${id}`, payload);
  return res.data.data;
}

export async function deleteDiscount(id: number): Promise<void> {
  await client.delete(`/discounts/${id}`);
}
