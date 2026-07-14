const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, '');
const DEFAULT_TIMEOUT_MS = 190000;

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'API_ERROR' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function postUrl(url, payload, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = body?.detail;
      throw new ApiError((typeof detail === 'string' ? detail : detail?.message) || 'Não foi possível processar a solicitação.', { status: response.status, code: detail?.code });
    }
    const hasValidData = !Object.prototype.hasOwnProperty.call(body || {}, 'data') || (typeof body.data === 'object' && body.data !== null);
    if (!body || typeof body !== 'object' || Array.isArray(body) || !hasValidData) {
      throw new ApiError('O backend retornou uma resposta inválida.', { status: response.status, code: 'INVALID_RESPONSE' });
    }
    return body;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ApiError('A IA demorou mais que o esperado. Tente novamente.', { code: 'TIMEOUT' });
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError('Não foi possível conectar ao backend de IA.', { code: 'NETWORK_ERROR' });
  } finally {
    window.clearTimeout(timer);
  }
}

async function getUrl(url, { timeoutMs = 12000 } = {}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = body?.detail;
      throw new ApiError((typeof detail === 'string' ? detail : detail?.message) || 'Não foi possível consultar os dados do destino.', { status: response.status, code: detail?.code });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError('O backend retornou dados externos inválidos.', { code: 'INVALID_RESPONSE' });
    return body;
  } catch (error) {
    if (error?.name === 'AbortError') throw new ApiError('A consulta externa demorou mais que o esperado.', { code: 'TIMEOUT' });
    if (error instanceof ApiError) throw error;
    throw new ApiError('Não foi possível conectar ao backend.', { code: 'NETWORK_ERROR' });
  } finally {
    window.clearTimeout(timer);
  }
}

export function post(path, payload, options) {
  return postUrl(`${API_BASE_URL}${path}`, payload, options);
}

export function postApi(path, payload, options) {
  return postUrl(`${API_ORIGIN}${path}`, payload, options);
}

export function getApi(path, params = {}, options) {
  const url = new URL(`${API_ORIGIN}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  return getUrl(url.toString(), options);
}
