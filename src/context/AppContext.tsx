import React, { createContext, useContext, useMemo, useRef, useState, ReactNode } from 'react';
import { A2UIMessage, ChatMessage } from '../types/a2ui';
import { examplesMap } from '../data/a2uiExamples';
import { postA2UIAction, streamRestaurant, type StreamMeta } from '../services/a2uiApi';

interface AppState {
  messages: ChatMessage[];
  currentA2UIData: A2UIMessage | null;
  isLoading: boolean;
  selectedExample: string | null;
  lastRequest?: {
    requestId?: string;
    startedAtMs: number;
    firstA2UIAtMs?: number;
    endedAtMs?: number;
  };
}

interface AppContextType {
  state: AppState;
  actions: {
    sendMessage: (message: string) => Promise<void>;
    loadExample: (exampleId: string) => void;
    updateA2UIData: (data: A2UIMessage) => void;
    dispatchA2UIAction: (action: string, context?: Record<string, any>, values?: Record<string, any>) => Promise<void>;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    messages: [
      {
        id: 'welcome',
        role: 'agent',
        content: '你好！我现在会真实调用后端 + Supabase 数据库来生成可交互的 A2UI UI。试试：我想订一个上海的日料餐厅。',
        timestamp: new Date()
      }
    ],
    currentA2UIData: null,
    isLoading: false,
    selectedExample: null,
    lastRequest: undefined,
  });

  const activeEventSourceRef = useRef<EventSource | null>(null);
  const requestStartLocalRef = useRef<number | null>(null);

  const cleanupStream = () => {
    if (activeEventSourceRef.current) {
      activeEventSourceRef.current.close();
      activeEventSourceRef.current = null;
    }
  };

  const actions = {
    sendMessage: async (content: string) => {
      cleanupStream();

      // Add user message
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date()
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, userMsg],
        isLoading: true,
        lastRequest: {
          startedAtMs: Date.now(),
        },
      }));

      requestStartLocalRef.current = Date.now();

      const es = streamRestaurant(content, {
        onMeta: (meta: StreamMeta) => {
          setState(prev => ({
            ...prev,
            lastRequest: {
              ...(prev.lastRequest ?? { startedAtMs: meta.startedAtMs }),
              requestId: meta.requestId,
              startedAtMs: meta.startedAtMs,
            },
          }));
        },
        onA2UI: (evt) => {
          setState(prev => {
            const now = Date.now();
            const firstA2UIAtMs = prev.lastRequest?.firstA2UIAtMs ?? now;
            return {
              ...prev,
              currentA2UIData: evt.message,
              lastRequest: {
                ...(prev.lastRequest ?? { startedAtMs: now }),
                firstA2UIAtMs,
              },
            };
          });
        },
        onDone: (done) => {
          setState(prev => ({
            ...prev,
            isLoading: false,
            lastRequest: {
              ...(prev.lastRequest ?? { startedAtMs: Date.now() }),
              endedAtMs: done.endedAtMs,
            },
          }));

          const agentMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'agent',
            content: '已返回可交互的餐厅预订 UI（来自后端 + 数据库）。',
            timestamp: new Date(),
          };

          setState(prev => ({
            ...prev,
            messages: [...prev.messages, agentMsg],
          }));
        },
        onError: (err) => {
          setState(prev => ({
            ...prev,
            isLoading: false,
          }));

          const agentMsg: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'agent',
            content: `后端请求失败：${err instanceof Error ? err.message : 'unknown error'}`,
            timestamp: new Date(),
          };

          setState(prev => ({
            ...prev,
            messages: [...prev.messages, agentMsg],
          }));
        },
      });

      activeEventSourceRef.current = es;

    },

    loadExample: (exampleId: string) => {
      cleanupStream();
      const example = examplesMap[exampleId];
      if (example) {
        setState(prev => ({
          ...prev,
          currentA2UIData: example,
          selectedExample: exampleId
        }));
      }
    },

    updateA2UIData: (data: A2UIMessage) => {
      setState(prev => ({
        ...prev,
        currentA2UIData: data
      }));
    },

    dispatchA2UIAction: async (action: string, context?: Record<string, any>, values?: Record<string, any>) => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        const res = await postA2UIAction({ action, context, values });
        const agentMsg: ChatMessage = {
          id: (Date.now() + 3).toString(),
          role: 'agent',
          content: res.message,
          a2uiData: res.a2uiData,
          timestamp: new Date(),
        };
        setState(prev => ({
          ...prev,
          isLoading: false,
          messages: [...prev.messages, agentMsg],
          currentA2UIData: res.a2uiData || prev.currentA2UIData,
        }));
      } catch (err) {
        const agentMsg: ChatMessage = {
          id: (Date.now() + 4).toString(),
          role: 'agent',
          content: `动作执行失败：${err instanceof Error ? err.message : 'unknown error'}`,
          timestamp: new Date(),
        };
        setState(prev => ({
          ...prev,
          isLoading: false,
          messages: [...prev.messages, agentMsg],
        }));
      }
    },
  };

  const value = useMemo(() => ({ state, actions }), [state]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
