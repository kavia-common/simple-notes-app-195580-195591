import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import NoteModal from "./components/NoteModal";
import {
  createNote,
  deleteNote,
  getApiBaseUrl,
  listNotes,
  updateNote,
} from "./api/notesApi";

/**
 * @typedef {Object} Note
 * @property {number|string} id
 * @property {string} title
 * @property {string} content
 */

// PUBLIC_INTERFACE
export default function App() {
  /** Notes app main screen: list + actions, backed by FastAPI on :3001. */
  const [notes, setNotes] = useState(/** @type {Note[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [refreshError, setRefreshError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [selectedNote, setSelectedNote] = useState(/** @type {Note|null} */ (null));

  const isEditing = useMemo(() => Boolean(selectedNote?.id), [selectedNote]);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setRefreshError("");
    try {
      const data = await listNotes();
      setNotes(Array.isArray(data) ? data : []);
    } catch (e) {
      setRefreshError(e instanceof Error ? e.message : "Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Development-only startup log to help debug preview environment routing/CORS.
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[notes_frontend] API base URL:", getApiBaseUrl());
    }

    loadNotes();
  }, [loadNotes]);

  const openCreate = () => {
    setModalError("");
    setSelectedNote({ title: "", content: "" });
    setModalOpen(true);
  };

  const openEdit = (note) => {
    setModalError("");
    setSelectedNote(note);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (modalSaving) return;
    setModalOpen(false);
    setModalError("");
    setSelectedNote(null);
  };

  const handleSave = async (payload) => {
    setModalSaving(true);
    setModalError("");
    try {
      if (selectedNote?.id != null) {
        const updated = await updateNote(selectedNote.id, payload);
        setNotes((prev) =>
          prev.map((n) => (n.id === selectedNote.id ? updated : n))
        );
      } else {
        const created = await createNote(payload);
        setNotes((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setSelectedNote(null);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setModalSaving(false);
    }
  };

  const handleDelete = async (note) => {
    const ok = window.confirm(`Delete "${note.title}"?`);
    if (!ok) return;

    // Optimistic-ish: disable refresh error and remove item after successful delete.
    try {
      await deleteNote(note.id);
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
    } catch (e) {
      setRefreshError(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  return (
    <div className="appShell">
      <header className="topBar">
        <div className="brand">
          <div className="brandMark" aria-hidden="true" />
          <div className="brandText">
            <h1 className="title">Notes</h1>
            <p className="subtitle">Create, edit, and organize your thoughts.</p>
          </div>
        </div>

        <div className="topBarActions">
          <button className="btn btnPrimary" onClick={openCreate} type="button">
            + New note
          </button>
        </div>
      </header>

      <main className="main">
        <div className="panel">
          <div className="panelHeader">
            <h2 className="panelTitle">All notes</h2>
            <button
              className="btn btnSecondary"
              onClick={loadNotes}
              type="button"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {refreshError ? (
            <div className="alert alertError" role="alert">
              {refreshError}
            </div>
          ) : null}

          {loading ? (
            <div className="emptyState">
              <div className="spinner" aria-hidden="true" />
              <p className="muted">Loading notes…</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="emptyState">
              <p className="emptyTitle">No notes yet</p>
              <p className="muted">
                Create your first note to get started.
              </p>
              <button className="btn btnPrimary" onClick={openCreate} type="button">
                + Create a note
              </button>
            </div>
          ) : (
            <ul className="notesList" aria-label="Notes list">
              {notes.map((note) => (
                <li className="noteCard" key={note.id}>
                  <div className="noteCardBody">
                    <div className="noteCardHeader">
                      <h3 className="noteTitle">{note.title}</h3>
                      <span className="badge">Note</span>
                    </div>
                    <p className="noteContent">{note.content}</p>
                  </div>
                  <div className="noteCardActions">
                    <button
                      className="btn btnSecondary"
                      type="button"
                      onClick={() => openEdit(note)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btnDanger"
                      type="button"
                      onClick={() => handleDelete(note)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <NoteModal
        open={modalOpen}
        initialNote={selectedNote}
        saving={modalSaving}
        error={modalError}
        onClose={closeModal}
        onSave={handleSave}
        isEditing={isEditing}
      />
    </div>
  );
}
