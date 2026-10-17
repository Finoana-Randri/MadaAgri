// Thin client for the JSON API served by server.py under /api.
export async function api(path, { method, body } = {}) {
  const response = await fetch("/api" + path, {
    method: method || (body ? "POST" : "GET"),
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");
  return data;
}

export const post = (path, body = {}) => api(path, { method: "POST", body });
