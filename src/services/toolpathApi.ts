export interface ToolpathIssue {
  code: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  line_no?: number;
  suggestion?: string;
  penalty: number;
}

export interface ToolpathSegment {
  line_no: number;
  mode: string;
  start: Record<string, number>;
  end: Record<string, number>;
  length: number;
  feed?: number;
}

export interface ToolpathScore {
  safety: number;
  efficiency: number;
  stability: number;
  surface: number;
  tool_life: number;
  gcode_quality: number;
  strategy: number;
  total: number;
}

export interface ToolpathEvaluationResult {
  fail_fast: boolean;
  score: ToolpathScore;
  issues: ToolpathIssue[];
  simulation: ToolpathSegment[];
  metrics: Record<string, number>;
  suggestions: string[];
}

export async function evaluateToolpath(payload: {
  file?: File;
  gcodeText?: string;
}): Promise<ToolpathEvaluationResult> {
  const createFormData = () => {
    const formData = new FormData();
    if (payload.file) {
      formData.append('file', payload.file);
    }
    if (payload.gcodeText) {
      formData.append('gcode_text', payload.gcodeText);
    }
    return formData;
  };

  const payloadSizeBytes = payload.file?.size ?? new Blob([payload.gcodeText ?? '']).size;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalRuntime = hostname === 'localhost' || hostname === '127.0.0.1';
  const endpoints = isLocalRuntime
    ? payloadSizeBytes > 2 * 1024 * 1024
      ? [
          'http://127.0.0.1:8000/toolpath/evaluate',
          'http://localhost:8000/toolpath/evaluate',
          '/api/toolpath/evaluate'
        ]
      : [
          '/api/toolpath/evaluate',
          'http://localhost:8000/toolpath/evaluate',
          'http://127.0.0.1:8000/toolpath/evaluate'
        ]
    : ['/api/toolpath/evaluate'];
  let response: Response | null = null;
  let lastNetworkError: unknown = null;
  const fallbackStatuses = new Set([400, 404, 405, 500, 501, 502, 503, 504]);
  const requestTimeoutMs = payloadSizeBytes > 20 * 1024 * 1024 ? 300000 : payloadSizeBytes > 2 * 1024 * 1024 ? 120000 : 30000;
  const proxyEndpointTimeoutMs = payloadSizeBytes > 2 * 1024 * 1024 ? requestTimeoutMs : Math.min(requestTimeoutMs, 5000);

  const parseResponseError = async (resp: Response) => {
    const statusInfo = `请求失败(${resp.status})`;
    const contentType = resp.headers.get('content-type') || '';
    let detail = '';
    if (contentType.includes('application/json')) {
      try {
        const err = await resp.json();
        if (typeof err?.detail === 'string') {
          detail = err.detail;
        } else if (Array.isArray(err?.detail)) {
          detail = err.detail.map((item: unknown) => JSON.stringify(item)).join('; ');
        } else if (err?.detail) {
          detail = JSON.stringify(err.detail);
        } else {
          detail = JSON.stringify(err);
        }
      } catch {
        detail = '';
      }
    } else {
      try {
        detail = (await resp.text()).trim();
      } catch {
        detail = '';
      }
    }
    return detail ? `${statusInfo}: ${detail}` : statusInfo;
  };

  for (let i = 0; i < endpoints.length; i += 1) {
    const endpoint = endpoints[i];
    const hasFallback = i < endpoints.length - 1;
    const endpointTimeoutMs = endpoint.startsWith('/api') ? proxyEndpointTimeoutMs : requestTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), endpointTimeoutMs);
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        body: createFormData(),
        signal: controller.signal
      });
      if (response.ok) {
        return response.json();
      }
      if (hasFallback && fallbackStatuses.has(response.status)) {
        continue;
      }
      throw new Error(await parseResponseError(response));
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('请求失败(')) {
        throw error;
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        lastNetworkError = new Error(`请求超时(${endpointTimeoutMs}ms, ${payloadSizeBytes}B)`);
        continue;
      }
      lastNetworkError = error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (!response) {
    if (lastNetworkError instanceof Error) {
      throw new Error(`服务不可用: ${lastNetworkError.message}`);
    }
    throw new Error('服务不可用: 无法连接评测服务');
  }

  if (!response.ok) {
    throw new Error(await parseResponseError(response));
  }

  return response.json();
}
