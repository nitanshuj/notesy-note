CREATE INDEX IF NOT EXISTS idx_note_history_note_id ON note_history(note_id, saved_at DESC);

CREATE TRIGGER IF NOT EXISTS folders_bd_trash_notes
BEFORE DELETE ON folders
BEGIN
    UPDATE notes SET is_deleted = 1, updated_at = cast(strftime('%s', 'now') as integer) WHERE folder_id = old.id;
END;
