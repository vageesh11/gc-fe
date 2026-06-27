import client from './client';
import type { SessionFrame } from '../types';

export async function startFrame(session_id: number): Promise<SessionFrame> {
  const res = await client.post('/frames/start', { session_id });
  return res.data.data;
}

export async function endFrame(frameId: number, player_name: string): Promise<SessionFrame> {
  const res = await client.patch(`/frames/${frameId}/end`, { player_name });
  return res.data.data;
}

export async function getFrames(sessionId: number): Promise<SessionFrame[]> {
  const res = await client.get(`/frames/session/${sessionId}`);
  return res.data.data;
}
