export interface A2UIComponent {
  type: 'form' | 'list' | 'card' | 'button' | 'input' | 'select' | 'image' | 'text';
  id: string;
  properties: Record<string, any>;
  children?: A2UIComponent[];
}

export interface A2UIMessage {
  version: string;
  components: A2UIComponent[];
  dataModel?: Record<string, any>;
  metadata?: {
    title?: string;
    description?: string;
    timestamp: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  a2uiData?: A2UIMessage;
  timestamp: Date;
}

export interface AgentRequest {
  message: string;
  context?: Record<string, any>;
}

export interface AgentResponse {
  message: string;
  a2uiData?: A2UIMessage;
  suggestions?: string[];
}
