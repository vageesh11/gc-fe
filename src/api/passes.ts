import client from './client';
import type { Pass, CustomerPass } from '../types';

export async function getPasses(): Promise<Pass[]> {
  const res = await client.get('/passes');
  return res.data.data;
}

export async function createPass(payload: {
  name: string;
  total_minutes: number;
  price: number;
}): Promise<Pass> {
  const res = await client.post('/passes', payload);
  return res.data.data;
}

export async function purchasePass(payload: {
  customer_id: number;
  pass_id: number;
  expires_at?: string;
}): Promise<CustomerPass> {
  const res = await client.post('/passes/purchase', payload);
  return res.data.data;
}

export async function getCustomerPasses(customerId: number): Promise<CustomerPass[]> {
  const res = await client.get(`/passes/customer/${customerId}`);
  return res.data.data;
}
