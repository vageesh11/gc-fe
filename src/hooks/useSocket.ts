import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  TableStatusChangedEvent,
  SessionStartedEvent,
  SessionEndedEvent,
  SessionPausedEvent,
  SessionResumedEvent,
  TablePreBookedEvent,
  TableBookingCancelledEvent,
  SessionFixedSlotExpiredEvent,
} from '../types';

interface SocketHandlers {
  onTableStatusChanged?: (data: TableStatusChangedEvent) => void;
  onSessionStarted?: (data: SessionStartedEvent) => void;
  onSessionEnded?: (data: SessionEndedEvent) => void;
  onSessionPaused?: (data: SessionPausedEvent) => void;
  onSessionResumed?: (data: SessionResumedEvent) => void;
  onTablePreBooked?: (data: TablePreBookedEvent) => void;
  onTableBookingCancelled?: (data: TableBookingCancelledEvent) => void;
  onSessionFixedSlotExpired?: (data: SessionFixedSlotExpiredEvent) => void;
}

export function useSocket(handlers: SocketHandlers) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const socket = io('http://localhost:3000', { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('table_status_changed', (data: TableStatusChangedEvent) => {
      handlersRef.current.onTableStatusChanged?.(data);
    });
    socket.on('session_started', (data: SessionStartedEvent) => {
      handlersRef.current.onSessionStarted?.(data);
    });
    socket.on('session_ended', (data: SessionEndedEvent) => {
      handlersRef.current.onSessionEnded?.(data);
    });
    socket.on('session_paused', (data: SessionPausedEvent) => {
      handlersRef.current.onSessionPaused?.(data);
    });
    socket.on('session_resumed', (data: SessionResumedEvent) => {
      handlersRef.current.onSessionResumed?.(data);
    });
    socket.on('table_pre_booked', (data: TablePreBookedEvent) => {
      handlersRef.current.onTablePreBooked?.(data);
    });
    socket.on('table_booking_cancelled', (data: TableBookingCancelledEvent) => {
      handlersRef.current.onTableBookingCancelled?.(data);
    });
    socket.on('session_fixed_slot_expired', (data: SessionFixedSlotExpiredEvent) => {
      handlersRef.current.onSessionFixedSlotExpired?.(data);
    });

    return () => { socket.disconnect(); };
  }, []);

  return socketRef.current;
}
