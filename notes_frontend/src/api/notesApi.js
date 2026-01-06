/**
 * Notes API client.
 *
 * How to configure the backend base URL (CRA):
 * - Default (no env var): tries same-origin "/api" when app is served with an "/api" proxy, otherwise falls back to http://localhost:3001
 * - Absolute URL: set REACT_APP_API_BASE_URL="https://your-backend.example.com"
 * - Relative mode: set REACT_APP_API_BASE_URL="relative" to force fetch("/api/...")
 *
 * Example:
 *   REACT_APP_API_BASE_URL=http://localhost:3001 npm start
 *   REACT_APP_API_BASE_URL=relative npm start
 */

const DEFAULT_LOCALHOST_API = "http://localhost:3001";

/**
 * @typedef {Object} Note
 * @property {number|string} id
 * @property {string} title
 * @property {string} content
 */

/**
 * INTERNAL: Ensure we don't end up with double slashes when joining base + path.
 * @param {string} base
 * @param {string} path
 * @returns {string}
 */
function joinUrl(base, path) {
  const safeBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${safeBase}${safePath}`;
}

/**
 * INTERNAL: Compute the API base URL, supporting preview environments.
 *
 * Priority:
 * 1) REACT_APP_API_BASE_URL:
 *    - "relative" => "/api" (so calls become fetch("/api/notes"))
 *    - otherwise treated as explicit base URL (e.g. "https://host:3001" or "/api")
 * 2) Same-origin fallback: if app is not running on localhost, assume a reverse-proxy exposes backend on "/api"
 * 3) Local development fallback: "http://localhost:3001"
 *
 * @returns {string}
 */
function computeApiBaseUrl() {
  const envValueRaw =
    typeof process !== "undefined" ? process.env.REACT_APP_API_BASE_URL : undefined;
  const envValue = (envValueRaw ?? "").trim();

  // Explicit configuration via env
  if (envValue) {
    if (envValue.toLowerCase() === "relative") return "/api";
    // Allow both absolute and relative paths like "/api"
    return envValue.endsWith("/") ? envValue.slice(0, -1) : envValue;
  }

  // Heuristic for preview environments:
  // If the frontend is served from a non-localhost origin, it's common that the platform
  // reverse-proxies the backend under the same origin at "/api".
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocalhost =
      host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";

    if (!isLocalhost) {
      return "/api";
    }
  }

  // Local development default (matches existing behavior)
  return DEFAULT_LOCALHOST_API;
}

/**
 * PUBLIC_INTERFACE
 * @returns {string} The computed API base URL used for all notes CRUD requests.
 */
export function getApiBaseUrl() {
  /** Return the computed API base URL used by this module. */
  return computeApiBaseUrl();
}

const API_BASE_URL = computeApiBaseUrl();

/**
 * INTERNAL: Parse JSON or throw a useful error for non-2xx responses.
 * @param {Response} res
 * @returns {Promise<any>}
 */
async function parseJsonOrThrow(res) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let bodyText = "";
    try {
      bodyText = isJson ? JSON.stringify(await res.json()) : await res.text();
    } catch {
      bodyText = "";
    }
    throw new Error(`API error ${res.status}${bodyText ? `: ${bodyText}` : ""}`);
  }

  return isJson ? res.json() : null;
}

// PUBLIC_INTERFACE
export async function listNotes() {
  /** Fetch all notes. */
  const url = joinUrl(API_BASE_URL, "/notes");
  const res = await fetch(url, { method: "GET" });
  return parseJsonOrThrow(res);
}

// PUBLIC_INTERFACE
export async function createNote(payload) {
  /** Create a note with {title, content}. */
  const url = joinUrl(API_BASE_URL, "/notes");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow(res);
}

// PUBLIC_INTERFACE
export async function updateNote(noteId, payload) {
  /** Update a note by id with {title, content}. */
  const url = joinUrl(API_BASE_URL, `/notes/${noteId}`);
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow(res);
}

// PUBLIC_INTERFACE
export async function deleteNote(noteId) {
  /** Delete a note by id. */
  const url = joinUrl(API_BASE_URL, `/notes/${noteId}`);
  const res = await fetch(url, {
    method: "DELETE",
  });
  return parseJsonOrThrow(res);
}
