import type { A2UIMessage } from '../types/a2ui';

export type StreamMeta = {
  requestId: string;
  startedAtMs: number;
};

export type StreamA2UIEvent = {
  message: A2UIMessage;
  serverTimeMs?: number;
};

export type StreamDone = {
  requestId: string;
  endedAtMs: number;
};

export function streamRestaurant(q: string, handlers: {
  onMeta: (meta: StreamMeta) => void;
  onA2UI: (evt: StreamA2UIEvent) => void;
  onDone: (done: StreamDone) => void;
  onError: (err: unknown) => void;
}) {
  const url = `/api/a2ui/restaurant/stream?q=${encodeURIComponent(q)}`;
  const es = new EventSource(url);

  es.addEventListener('meta', (e) => {
    try {
      handlers.onMeta(JSON.parse((e as MessageEvent).data));
    } catch (err) {
      handlers.onError(err);
    }
  });

  es.addEventListener('a2ui', (e) => {
    try {
      handlers.onA2UI(JSON.parse((e as MessageEvent).data));
    } catch (err) {
      handlers.onError(err);
    }
  });

  es.addEventListener('done', (e) => {
    try {
      handlers.onDone(JSON.parse((e as MessageEvent).data));
    } catch (err) {
      handlers.onError(err);
    } finally {
      es.close();
    }
  });

  es.onerror = (e) => {
    handlers.onError(e);
    es.close();
  };

  return es;
}

export async function postA2UIAction(payload: {
  action: string;
  context?: Record<string, any>;
  values?: Record<string, any>;
}) {
  const res = await fetch('/api/a2ui/action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json() as Promise<{ message: string; a2uiData?: A2UIMessage }>;
}

