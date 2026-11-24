// The only module that talks to the network. Every call goes to the API with
// the browser's HttpOnly session cookie; this app holds no credentials.

export const API_URL: string = (
  import.meta.env.VITE_API_URL ?? "https://api.manhattanreasoning.com"
).replace(/\/+$/, "");

/** A non-2xx answer from the API, in its `{detail: {error, message}}` shape. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** The request never got an answer (offline, DNS, CORS, API down). */
export class NetworkError extends Error {
  constructor() {
    super("Could not reach the Manhattan Reasoning API.");
    this.name = "NetworkError";
  }
}

type UnauthorizedListener = () => void;
let onUnauthorized: UnauthorizedListener | null = null;

/** Called by the session provider: a 401 on any call means "signed out". */
export function setUnauthorizedListener(fn: UnauthorizedListener | null): void {
  onUnauthorized = fn;
}

async function toApiError(resp: Response): Promise<ApiError> {
  let code = "unknown";
  let message = `The API answered ${resp.status}.`;
  try {
    const body = await resp.json();
    const detail = body?.detail;
    if (detail && typeof detail === "object") {
      if (typeof detail.error === "string") code = detail.error;
      if (typeof detail.message === "string") message = detail.message;
    } else if (typeof detail === "string") {
      message = detail;
    }
  } catch {
    // not JSON; keep the generic message
  }
  return new ApiError(resp.status, code, message);
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  opts: { quiet401?: boolean } = {},
): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(`${API_URL}${path}`, { ...init, credentials: "include" });
  } catch {
    throw new NetworkError();
  }
  if (resp.status === 401 && !opts.quiet401) onUnauthorized?.();
  if (!resp.ok) throw await toApiError(resp);
  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}

// ── shapes (orchestrator api/models.py) ─────────────────────────────────────

export interface Profile {
  username: string;
  github_username: string | null;
  status: string;
  max_concurrent_boards: number;
  max_session_minutes: number;
}

export type BillingStatus = "none" | "active" | "blocked" | "comp";

export interface UsageBuild {
  job_id: string;
  build_minutes: number;
  started_at: string | null;
  ended_at: string | null;
  source: string;
}

export interface Usage {
  month: string;
  build_minutes_used: number;
  build_minutes_limit: number;
  build_minutes_remaining: number;
  builds: UsageBuild[];
  // Absent on servers that predate membership reporting.
  billing_status?: BillingStatus;
  subscription_required?: boolean;
  billing_enforced?: boolean;
}

export interface RecentBuild {
  job_id: string;
  name: string;
  project: string | null;
  status: string;
  status_display: string;
  submitted_at: string;
  relative_time: string | null;
  duration_seconds: number | null;
  duration_formatted: string | null;
  board_id: string | null;
  command: string | null;
}

export interface Overview {
  active_builds_count: number;
  total_builds_count: number;
  board_time_total_seconds: number | null;
  board_time_total_formatted: string | null;
  build_minutes_used: number;
  build_minutes_limit: number;
  build_minutes_remaining: number;
  recent_builds: RecentBuild[];
}

export interface Project {
  name: string;
  build_count: number;
  latest_build_id: string;
  latest_build_status: string;
  latest_build_at: string;
  latest_build_relative: string;
}

export type StageStatus =
  | "pending"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "skipped";

export interface PipelineStage {
  id: string;
  name: string;
  status: StageStatus;
  duration_seconds: number | null;
  duration_formatted: string | null;
}

export interface JobDetail {
  job_id: string;
  name: string;
  status: string;
  status_display: string;
  fpga_id: number | null;
  board_id: string | null;
  type: string;
  owner: string;
  submitted_by: string;
  submitted_at: string;
  submitted_at_formatted: string | null;
  relative_time: string | null;
  elapsed_build_seconds: number | null;
  elapsed_build_time_formatted: string | null;
  board_time_seconds: number | null;
  board_time_formatted: string | null;
  command: string | null;
  output: string | null;
  pipeline: PipelineStage[];
  logs_streaming: boolean;
}

// ── calls ───────────────────────────────────────────────────────────────────

/** Who is signed in. A 401 here is the normal signed-out answer, not an event. */
export const getProfile = () =>
  request<Profile>("/auth/me", {}, { quiet401: true });

export const signOut = () =>
  request<void>("/auth/session", { method: "DELETE" }, { quiet401: true });

export const getUsage = () => request<Usage>("/usage");

export const getOverview = (limit = 10) =>
  request<Overview>(`/dashboard/overview?limit=${limit}`);

export const getProjects = () => request<Project[]>("/dashboard/projects");

export const getJob = (jobId: string) =>
  request<JobDetail>(`/dashboard/jobs/${encodeURIComponent(jobId)}`);

/**
 * Cancel a build. 204 on success; 403 (not_job_owner) if it is someone else's build, which an
 * admin can open; 404 if it does not exist; 409 if it can no longer be cancelled (already
 * finished, flashing the board, or running on it).
 */
export const cancelJob = (jobId: string) =>
  request<void>(`/jobs/${encodeURIComponent(jobId)}`, { method: "DELETE" });

/** Where the browser goes to start GitHub sign-in; the API redirects back. */
export function signInUrl(returnTo: string): string {
  return `${API_URL}/auth/github/login?return_to=${encodeURIComponent(returnTo)}`;
}

/**
 * How this app tells the API a billing request came from the dashboard, so
 * Stripe returns the user here instead of to the CLI's landing pages.
 * THE ONE PLACE that knows the marker's form: a `source=web` query parameter
 * on a POST with no body.
 */
export function webBillingRequest(path: string): { path: string; init: RequestInit } {
  return { path: `${path}?source=web`, init: { method: "POST" } };
}

async function startBillingSession(route: string): Promise<string> {
  const { path, init } = webBillingRequest(route);
  const { url } = await request<{ url: string }>(path, init);
  return url;
}

/** A Stripe Checkout URL for starting a membership. */
export const startCheckout = () => startBillingSession("/billing/checkout");

/** A Stripe customer-portal URL for managing a membership. */
export const startPortal = () => startBillingSession("/billing/portal");

/**
 * Open a live log stream for a build. The stream is authorised by a
 * single-use ticket (never a long-lived key in a URL), so a dropped
 * connection cannot simply reconnect: the caller asks for a new stream.
 */
export async function openLogStream(
  jobId: string,
  handlers: {
    onLine: (line: string) => void;
    onDone: (finalStatus: string) => void;
    onError: () => void;
  },
): Promise<() => void> {
  const id = encodeURIComponent(jobId);
  const { ticket } = await request<{ ticket: string; expires_in: number }>(
    `/dashboard/jobs/${id}/stream-ticket`,
    { method: "POST" },
  );
  const source = new EventSource(
    `${API_URL}/dashboard/jobs/${id}/logs/stream?ticket=${encodeURIComponent(ticket)}`,
  );
  let finished = false;
  const close = () => {
    finished = true;
    source.close();
  };
  source.onmessage = (event) => handlers.onLine(event.data);
  source.addEventListener("done", (event) => {
    close();
    handlers.onDone((event as MessageEvent).data);
  });
  source.onerror = () => {
    if (finished) return;
    // EventSource would retry with the same, already-spent ticket.
    close();
    handlers.onError();
  };
  return close;
}
