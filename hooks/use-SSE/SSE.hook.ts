// hooks/useSSE.ts
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { refreshTokenAction } from '../use-auth/auth.action';
import Cookies from 'js-cookie';

interface SSEOptions<T> {
  userId: string;
  onMessage: (data: T) => void;
  onError?: (error: Event) => void;
  onComplete?: () => void;
  enabled?: boolean; // false = chưa mở connection
}

interface SSEState {
  status: 'idle' | 'connecting' | 'connected' | 'error' | 'closed';
}

function parseJwt(token: string) {
  const base64 = token.split('.')[1];
  return JSON.parse(atob(base64));
}

export function useSSE<T = unknown>({
  userId,
  onMessage,
  onError,
  onComplete,
  enabled = true,
}: SSEOptions<T>) {
  const [state, setState] = useState<SSEState>({ status: 'idle' });

  const esRef = useRef<EventSource | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT = 3;

  // Dùng ref để giữ callback mới nhất, tránh stale closure
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const cleanup = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    cleanup();

    let token: string;
    try {
      token = Cookies.get('access_token') || '';
    //   const payload = parseJwt(token);

      // Token đã hết hạn → refresh luôn trước khi connect
    //   if (payload.exp * 1000 < Date.now()) {
    //     token = await refreshAccessToken();
    //   }
    } catch {
      setState({ status: 'error' });
      return;
    }

    setState({ status: 'connecting' });

    const es = new EventSource(`http://localhost:3500/api/v1/sse/events/${userId}?token=${token}`);
    esRef.current = es;

    es.onopen = () => {
      setState({ status: 'connected' });
      reconnectAttempts.current = 0;

      // Schedule refresh trước khi token hết hạn
    //   const payload = parseJwt(token);
    //   const expiresIn = payload.exp * 1000 - Date.now();
    //   const refreshAt = Math.max(expiresIn - 30_000, 0);

    //   refreshTimerRef.current = setTimeout(async () => {
    //     try {
    //       await refreshAccessToken();
    //       connect(); // reconnect với token mới
    //     } catch {
    //       setState({ status: 'error' });
    //       cleanup();
    //     }
    //   }, refreshAt);
    };

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as T;

        // 1. invalid token → chuyển sang trạng thái error, không reconnect
        if ((data as { type?: string }).type === 'TOKEN_EXPIRED' || (data as { type?: string }).type === 'INVALID_TOKEN') {
            const refreshToken = Cookies.get('refresh_token') || '';
            refreshTokenAction(refreshToken).then(() => {
              connect(); // reconnect với token mới
            }).catch(() => {
              setState({ status: 'error' });
              cleanup();
            });
          return;
        }

        // Server báo stream kết thúc
        if ((data as { type?: string }).type === 'COMPLETE') {
          onCompleteRef.current?.();
          cleanup();
          setState({ status: 'closed' });
          return;
        }

        onMessageRef.current(data);
      } catch {
        console.error('SSE parse error', e.data);
      }
    };

    es.onerror = (event) => {
      onErrorRef.current?.(event);
        
      // Auto reconnect với exponential backoff
      if (reconnectAttempts.current < MAX_RECONNECT) {
        const delay = Math.pow(2, reconnectAttempts.current) * 1000; // 1s, 2s, 4s
        reconnectAttempts.current += 1;

        setState({ status: 'connecting' });
        reconnectTimerRef.current = setTimeout(connect, delay);
      } else {
        setState({ status: 'error' });
        cleanup();
      }
    };
  }, [userId, cleanup]);

  useEffect(() => {
    if (!enabled || !userId) return;
    connect();
    return cleanup;
  }, [enabled, userId, connect, cleanup]);

  const close = useCallback(() => {
    cleanup();
    setState({ status: 'closed' });
  }, [cleanup]);

  return { status: state.status, close };
}