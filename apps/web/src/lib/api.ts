let csrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields ?? {};
  }
}

function baseUrl(): string {
  const configured = import.meta.env.VITE_API_URL;
  if (!configured) return "";
  return configured.replace(/\/$/, "");
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = init.method ?? "GET";
  const headers = new Headers();
  if (init.body !== undefined) headers.set("Content-Type", "application/json");
  if (csrfToken && method !== "GET" && method !== "HEAD") {
    headers.set("X-CSRF-Token", csrfToken);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      credentials: "include",
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Lamton could not reach the service. Check that the API is running.");
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = readError(payload);
    throw new ApiError(response.status, error.code, error.message, error.fields);
  }
  return payload as T;
}

function readError(payload: unknown): { code: string; message: string; fields?: Record<string, string> } {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return { code: "REQUEST_FAILED", message: "The request failed." };
  }
  const code = typeof payload.error.code === "string" ? payload.error.code : "REQUEST_FAILED";
  const message = typeof payload.error.message === "string" ? payload.error.message : "The request failed.";
  const details = payload.error.details;
  if (!isRecord(details) || !isRecord(details.fields)) {
    return { code, message };
  }
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(details.fields)) {
    if (typeof value === "string") fields[key] = value;
  }
  return { code, message, fields };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
