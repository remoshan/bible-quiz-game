const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error ?? `Request failed with status ${response.status}`);
  }

  return body;
}
