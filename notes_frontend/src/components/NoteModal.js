import React, { useEffect, useMemo, useRef, useState } from "react";
import "./NoteModal.css";

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {{id?: (number|string), title: string, content: string} | null} props.initialNote
 * @param {boolean} props.saving
 * @param {string | null} props.error
 * @param {() => void} props.onClose
 * @param {(payload: {title: string, content: string}) => void} props.onSave
 * @param {boolean} props.isEditing
 */
// PUBLIC_INTERFACE
export default function NoteModal({
  open,
  initialNote,
  saving,
  error,
  onClose,
  onSave,
  isEditing,
}) {
  /** Modal dialog for creating/editing a note. Uses controlled inputs. */
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const titleInputRef = useRef(null);

  const modalTitle = useMemo(
    () => (isEditing ? "Edit note" : "New note"),
    [isEditing]
  );

  useEffect(() => {
    if (!open) return;

    setTitle(initialNote?.title ?? "");
    setContent(initialNote?.content ?? "");

    // Focus first field when opened (no direct DOM querying).
    const t = setTimeout(() => titleInputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open, initialNote]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const canSave = title.trim().length > 0 && content.trim().length > 0 && !saving;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({ title: title.trim(), content: content.trim() });
  };

  return (
    <div className="modalOverlay" role="presentation" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={modalTitle}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <h2 className="modalTitle">{modalTitle}</h2>
          <button
            className="iconButton"
            onClick={onClose}
            aria-label="Close"
            type="button"
            disabled={saving}
          >
            ✕
          </button>
        </div>

        <form className="modalBody" onSubmit={handleSubmit}>
          <label className="field">
            <span className="label">Title</span>
            <input
              ref={titleInputRef}
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Meeting notes"
              maxLength={120}
              disabled={saving}
              required
            />
          </label>

          <label className="field">
            <span className="label">Content</span>
            <textarea
              className="textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note..."
              rows={8}
              disabled={saving}
              required
            />
          </label>

          {error ? (
            <div className="formError" role="alert">
              {error}
            </div>
          ) : null}

          <div className="modalFooter">
            <button
              className="btn btnSecondary"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button className="btn btnPrimary" type="submit" disabled={!canSave}>
              {saving ? "Saving..." : isEditing ? "Save changes" : "Create note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
