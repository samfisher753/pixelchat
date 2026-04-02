const BASE_URL       = process.env.API_URL        ?? 'http://localhost:8080';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? 'dev-internal-secret';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': INTERNAL_SECRET,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        throw new Error(`API error ${response.status}: ${method} ${path}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
}

export const apiService = {
    get:    <T>(path: string)                  => request<T>('GET',    path),
    post:   <T>(path: string, body: unknown)   => request<T>('POST',   path, body),
    put:    <T>(path: string, body: unknown)   => request<T>('PUT',    path, body),
    patch:  <T>(path: string, body: unknown)   => request<T>('PATCH',  path, body),
    delete: <T>(path: string)                  => request<T>('DELETE', path),
};
