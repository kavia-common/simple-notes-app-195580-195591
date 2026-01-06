const API_BASE_URL = "http://localhost:3001";

/**
 * @typedef {Object} Note
 * @property {number|string} id
 * @property {string} title
 * @property {string} content
 */

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
  const res = await fetch(`${API_BASE_URL}/notes`, { method: "GET" });
  return parseJsonOrThrow(res);
}

// PUBLIC_INTERFACE
export async function createNote(payload) {
  /** Create a note with {title, content}. */
  const res = await fetch(`${API_BASE_URL}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow(res);
}

// PUBLIC_INTERFACE
export async function updateNote(noteId, payload) {
  /** Update a note by id with {title, content}. */
  const res = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow(res);
}

// PUBLIC_INTERFACE
export async function deleteNote(noteId) {
  /** Delete a note by id. */
  const res = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
    method: "DELETE",
  });
  return parseJsonOrThrow(res);
}
