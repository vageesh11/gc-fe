import client from './client';
import type { Customer, CustomerSession, PaginatedResponse } from '../types';

export async function getCustomers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResponse<Customer>> {
  const res = await client.get('/customers', { params });
  return { data: res.data.data, pagination: res.data.pagination };
}

export async function getCustomer(id: number): Promise<Customer> {
  const res = await client.get(`/customers/${id}`);
  return res.data.data;
}

export async function createCustomer(payload: { name: string; phone: string }): Promise<Customer> {
  const res = await client.post('/customers', payload);
  return res.data.data;
}

export async function getCustomerSessions(id: number, params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<CustomerSession>> {
  const res = await client.get(`/customers/${id}/sessions`, { params });
  return { data: res.data.data, pagination: res.data.pagination };
}
