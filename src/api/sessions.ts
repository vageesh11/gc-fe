import client from './client';
import type {
  StartSessionPayload,
  StartSessionResponse,
  EndSessionResponse,
  PauseResumeResponse,
  ActiveSession,
  Session,
  PaginatedResponse,
} from '../types';

export async function startSession(payload: StartSessionPayload): Promise<StartSessionResponse> {
  const res = await client.post('/sessions/start', payload);
  return res.data.data;
}

export async function confirmSession(sessionId: number): Promise<StartSessionResponse> {
  const res = await client.patch(`/sessions/${sessionId}/confirm`);
  return res.data.data;
}

export async function cancelSession(sessionId: number): Promise<{ id: number; status: string; updated_at: string }> {
  const res = await client.patch(`/sessions/${sessionId}/cancel`);
  return res.data.data;
}

export interface EndSessionPayload {
  session_id: number;
  discount_type?: string;
  discount_value?: number;
  customer_pass_id?: number;
  cash_amount?: number;
  online_amount?: number;
}

export async function endSession(payload: EndSessionPayload): Promise<EndSessionResponse> {
  const res = await client.post('/sessions/end', payload);
  return res.data.data;
}

export async function pauseSession(session_id: number): Promise<PauseResumeResponse> {
  const res = await client.post('/sessions/pause', { session_id });
  return res.data.data;
}

export async function resumeSession(session_id: number): Promise<PauseResumeResponse> {
  const res = await client.post('/sessions/resume', { session_id });
  return res.data.data;
}

export async function getActiveSessions(): Promise<ActiveSession[]> {
  const res = await client.get('/sessions/active');
  return res.data.data;
}

export interface SessionFilters {
  status?: 'active' | 'paused' | 'reserved' | 'closed';
  table_id?: number;
  date?: string;
  page?: number;
  limit?: number;
}

export async function getSessions(filters?: SessionFilters): Promise<PaginatedResponse<Session>> {
  const res = await client.get('/sessions', { params: filters });
  return { data: res.data.data, pagination: res.data.pagination };
}

export async function getSession(id: number): Promise<Session> {
  const res = await client.get(`/sessions/${id}`);
  return res.data.data;
}
