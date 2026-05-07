import client from './client';
import type { Order } from '../types';

export async function createOrder(payload: {
  session_id: number;
  item_id: number;
  quantity: number;
}): Promise<Order> {
  const res = await client.post('/orders', payload);
  return res.data.data;
}

export async function getSessionOrders(sessionId: number): Promise<Order[]> {
  const res = await client.get(`/orders/${sessionId}`);
  return res.data.data;
}
