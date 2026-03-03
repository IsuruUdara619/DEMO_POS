
// Use environment variable or default to relative path for Vite proxy
const base = import.meta.env.VITE_API_URL || '/api';

const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
  logApiError: (err: any, url: string, method: string) => console.error(`API Error [${method}] ${url}`, err),
  logPerformance: (label: string, duration: number) => console.debug(`[Perf] ${label}: ${duration.toFixed(2)}ms`)
};

async function handleResponse(res: Response, method: string, path: string) {
  if (!res.ok) {
    const text = await res.text();
    const err: any = new Error(text || 'Request failed');
    err.status = res.status;
    err.response = { status: res.status, statusText: res.statusText, data: text };
    
    // Log API error with full context
    logger.logApiError(err, `${base}${path}`, method);
    throw err;
  }
  return res.json();
}

export async function get(path: string) {
  const startTime = performance.now();
  logger.debug('API Request', { method: 'GET', path, url: `${base}${path}` });
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${base}${path}`, {
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    
    const duration = performance.now() - startTime;
    logger.logPerformance(`GET ${path}`, duration);
    
    return await handleResponse(res, 'GET', path);
  } catch (error) {
    logger.error('API Request Failed', { method: 'GET', path, error });
    throw error;
  }
}

export async function post(path: string, data: unknown) {
  const startTime = performance.now();
  logger.debug('API Request', { method: 'POST', path, url: `${base}${path}`, data });
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data),
    });
    
    const duration = performance.now() - startTime;
    logger.logPerformance(`POST ${path}`, duration);
    
    return await handleResponse(res, 'POST', path);
  } catch (error) {
    logger.error('API Request Failed', { method: 'POST', path, error });
    throw error;
  }
}

export async function put(path: string, data: unknown) {
  const startTime = performance.now();
  logger.debug('API Request', { method: 'PUT', path, url: `${base}${path}`, data });
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${base}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data),
    });
    
    const duration = performance.now() - startTime;
    logger.logPerformance(`PUT ${path}`, duration);
    
    return await handleResponse(res, 'PUT', path);
  } catch (error) {
    logger.error('API Request Failed', { method: 'PUT', path, error });
    throw error;
  }
}

export async function del(path: string) {
  const startTime = performance.now();
  logger.debug('API Request', { method: 'DELETE', path, url: `${base}${path}` });
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${base}${path}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    
    const duration = performance.now() - startTime;
    logger.logPerformance(`DELETE ${path}`, duration);
    
    return await handleResponse(res, 'DELETE', path);
  } catch (error) {
    logger.error('API Request Failed', { method: 'DELETE', path, error });
    throw error;
  }
}
