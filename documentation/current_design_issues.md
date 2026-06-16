# Notesy Note: Current Design & Architectural Issues

This document provides a highly detailed architectural audit of the current Notesy Note codebase. It outlines critical vulnerabilities, severe performance bottlenecks, data integrity flaws, and architectural anti-patterns that exist across the SQLite database layer, the Tauri IPC communication bridge, and the React frontend state machine.

---

## 1. Database & Storage Layer Flaws

### 1.1. O(N) Full Table Scan on Every Auto-Save (Severity: Critical)
**Location:** `src-tauri/src/commands/notes.rs` & `src-tauri/src/db/migrations/001_init.sql`
**The Flaw:** In the `note_update` command, the auto-snapshotting engine determines if 10 minutes have passed by executing: 
`SELECT saved_at FROM note_history WHERE note_id = ?1 ORDER BY saved_at DESC LIMIT 1`
However, the `001_init.sql` migration does not define an index for the `note_history` table on the `note_id` column.
**The Impact:** The React editor triggers a debounced save every 500ms while the user types. Because there is no index, SQLite is forced to perform a sequential full table scan of the *entire* `note_history` table on almost every keystroke. As a user accumulates thousands of history snapshots, this operation will severely block the database thread, spiking CPU usage and introducing massive typing latency.
**Required Fix:** Deploy a schema migration adding: `CREATE INDEX idx_note_history_note_id ON note_history(note_id, saved_at DESC);`

### 1.2. Unbounded Version History Storage Bloat (Severity: High)
**Location:** `src-tauri/src/commands/notes.rs`
**The Flaw:** The snapshot engine unconditionally stores the complete, raw JSON payload of the Tiptap document into `note_history` every 10 minutes. It does not employ delta-compression (only storing diffs) and enforces zero retention limits.
**The Impact:** A heavily edited note will result in hundreds of duplicate JSON strings being permanently written to disk. This causes the `.sqlite` file size to grow exponentially, eventually degrading total application read/write I/O performance.
**Required Fix:** Implement a chronological thinning algorithm (e.g., retain all snapshots for 24 hours, collapse to daily snapshots for a week, and delete anything older than 30 days) running on a background Rust thread.

### 1.3. Missing Asset Reference Garbage Collection (Severity: Medium)
**Location:** Asset Commands & React Editor
**The Flaw:** When a user drops an image into the editor, it is stored as a BLOB in the `assets` table. If the user later deletes that image from the note, the `asset://` URI is removed from the JSON, but the binary BLOB remains permanently orphaned in the database.
**The Impact:** Permanent and unrecoverable disk space bleed. A user adding and removing 5MB images will quickly bloat the database to gigabytes with zero active references.
**Required Fix:** Implement an asynchronous Rust routine that parses the `content_json` of all active notes for valid `asset://` URIs and executes a `DELETE` on any orphaned records in the `assets` table.

### 1.4. Inconsistent Folder Deletion Cascades (Severity: Low/Medium)
**Location:** `src-tauri/src/db/migrations/001_init.sql`
**The Flaw:** While deleting a folder automatically cascades to child subfolders, the `folder_id` foreign key on the `notes` table is configured with `ON DELETE SET NULL`.
**The Impact:** If a user deletes a folder containing 50 notes, those notes do not get moved to the Trash (`is_deleted = 1`). Instead, they are instantaneously scattered into the root notes list, destroying the user's workspace organization.

---

## 2. Tauri IPC & Interoperability Bottlenecks

### 2.1. Main Thread Freeze on Image Drop (Severity: Critical)
**Location:** `src/components/Editor/Editor.tsx` (`handleDrop`)
**The Flaw:** The drag-and-drop handler reads the dropped file into an `ArrayBuffer`, converts it into a native JavaScript `Uint8Array`, and passes this raw byte array over Tauri's IPC bridge to the `asset_save` command.
**The Impact:** Tauri must serialize this array of numbers into a massive JSON string in the WebView and deserialize it in Rust. A standard 5MB image generates an enormous payload that completely blocks the JavaScript main thread, causing the entire UI to freeze for several seconds during the transfer.
**Required Fix:** The frontend must extract the absolute OS file path of the dropped item and pass *only the string path* to the Rust backend. Rust can then execute `std::fs::read(path)` natively, completely bypassing IPC serialization limits.

### 2.2. Unpaginated IPC Transfers on Large Note Lists (Severity: High)
**Location:** `src-tauri/src/commands/notes.rs`
**The Flaw:** The `notes_list` command executes a raw `SELECT *` query for all notes within a folder and vectors them directly back to the frontend.
**The Impact:** For power users with 10,000+ notes, transferring thousands of structs across the IPC boundary in a single round-trip creates immense memory pressure and serializes/deserializes too slowly.
**Required Fix:** Introduce `LIMIT` and `OFFSET` arguments to the command and implement infinite scrolling or virtualized windowing (e.g., `@tanstack/react-virtual`) in the frontend sidebar.

---

## 3. Application State & Security Vulnerabilities

### 3.1. Floating Promises & Data Loss on Note Switch (Severity: High)
**Location:** `src/components/Editor/Editor.tsx` (Note switching `useEffect`)
**The Flaw:** When the active note ID changes, the editor clears the debounce timer and attempts a synchronous flush by calling `noteUpdate(prevNoteRef.current.id, ...).catch(console.error)`. This is not `await`ed.
**The Impact:** This creates a "floating promise." The database write is fired off into the void while the UI immediately transitions. If the user rapidly switches notes and closes the application, the OS will terminate the Tauri process before the asynchronous database lock resolves, resulting in permanent data loss of the final edits.
**Required Fix:** Block the React UI state transition until the `noteUpdate` promise returns a successful resolution.

### 3.2. FTS5 Query Syntax Crashes (Severity: High)
**Location:** `src-tauri/src/commands/search.rs`
**The Flaw:** The user's input string from the UI is fed directly and raw into the `MATCH ?1` parameter of the `notes_fts` virtual table.
**The Impact:** If the user accidentally types special FTS5 control characters (such as `*`, `AND`, `OR`, `NOT`, `^`, or unbalanced double quotes `"`), the SQLite parser throws a hard syntax error. This breaks the search UI entirely and returns panic-like errors to the frontend.
**Required Fix:** Build a string sanitization utility in Rust that escapes or strips FTS5 control characters before execution.

### 3.3. Search Snippet Blindspots (Severity: Medium)
**Location:** `src-tauri/src/commands/search.rs`
**The Flaw:** The query hardcodes the snippet generation using `snippet(notes_fts, 1, '<mark>', '</mark>', '...', 10)`. The index `1` restricts snippet extraction exclusively to the `content_text` column.
**The Impact:** If a search term matches a word inside the note's `title` (column `0`), the `snippet` function returns empty or irrelevant text, degrading the search experience.
**Required Fix:** Utilize the `highlight()` function or explicitly query snippets for both column 0 and column 1 dynamically.