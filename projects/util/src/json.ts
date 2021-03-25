export function parseJSONSafe<T = any, F = null>(json: string, fallback?: F) {

  try {

    return JSON.parse(json) as T;
  } catch {

    return fallback || null;
  }
}
