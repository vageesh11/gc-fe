import client from './client';
import type { Booking } from '../types';

export interface BookingFilters {
  table_id?: number;
  date?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function createBooking(payload: {
  customer_id: number;
  table_id: number;
  scheduled_start: string;
  booked_duration: number;
  notes?: string;
}): Promise<Booking> {
  const res = await client.post('/bookings', payload);
  return res.data.data;
}

export async function getBookings(filters?: BookingFilters): Promise<Booking[]> {
  const res = await client.get('/bookings', { params: filters });
  return res.data.data;
}

export async function getBooking(id: number): Promise<Booking> {
  const res = await client.get(`/bookings/${id}`);
  return res.data.data;
}

export async function confirmBooking(id: number): Promise<any> {
  const res = await client.patch(`/bookings/${id}/confirm`);
  return res.data.data;
}

export async function cancelBooking(id: number): Promise<{ id: number; status: string; updated_at: string }> {
  const res = await client.patch(`/bookings/${id}/cancel`);
  return res.data.data;
}
