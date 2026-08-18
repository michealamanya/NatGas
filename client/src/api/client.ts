export type ApiResult<T> = { success: boolean; data: T; message?: string; meta?: { total: number } };

export async function api<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const response = await fetch(`/api${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers }, ...options });
  const body = await response.json().catch(() => ({ message: 'Unable to reach NATGAS services.' }));
  if (!response.ok) throw new Error(body.message ?? 'Request failed.');
  return body;
}

export type Product = { id: string; name: string; slug?: string; cylinderSize?: string; shortDescription?: string; description?: string; imageUrl?: string; status?: string; category?: { name: string } };
export type User = { id: string; firstName: string; lastName: string; email: string; role: string };
