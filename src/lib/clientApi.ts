export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Expected JSON from ${url}, received ${res.status} ${res.statusText || "response"}`);
    }
  }
  if (!res.ok) {
    const message = typeof json === "object" && json && "error" in json ? String((json as { error: unknown }).error) : `Request failed with ${res.status}`;
    throw new Error(message);
  }
  return json as T;
}
