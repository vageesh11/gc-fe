import client from './client';
import type { Bill } from '../types';

export async function getBill(sessionId: number): Promise<Bill> {
  const res = await client.get(`/billing/${sessionId}`);
  return res.data.data;
}
