// ---------------------------------------------------------------------------
// Tipos de error que devuelve la API de Quarkus
// ---------------------------------------------------------------------------

export interface FieldViolation {
  field: string;
  code: string;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly violations?: FieldViolation[]
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

// ---------------------------------------------------------------------------
// Servicio HTTP
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_URL;

class ApiService {

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    isRetry = false
  ): Promise<T> {
    const token = localStorage.getItem('access_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // Token expirado: solo intentar refresh si el usuario ya tenía sesión activa.
    // Si no hay access_token (p.ej. endpoint de login) se trata como error normal.
    if (response.status === 401 && !isRetry && localStorage.getItem('access_token')) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return this.request<T>(method, path, body, true);
      }
      this.handleAuthFailure();
      throw new ApiError('auth.session_expired');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        errorData?.code ?? 'unknown_error',
        errorData?.violations
      );
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;

      const data = await response.json();
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  private handleAuthFailure(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

const apiService = new ApiService();
export default apiService;
