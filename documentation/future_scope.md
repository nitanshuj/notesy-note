# List of issues with the current code

1. **SQLite FTS5 Query Syntax Vulnerability**
   - In [search.rs](file:///c:/Products-Projects/Noetesy%20Note/notesy-note/src-tauri/src/commands/search.rs), the `full_text_search` query string is fed directly into the `notes_fts MATCH ?1` parameter. If a user inputs special FTS5 operators (such as mismatched parentheses, unbalanced double quotes, or naked boolean operators like `AND`, `OR`, `NOT`, `*`), SQLite's parser will throw a syntax error. This causes the search query to fail, returns a Rust error to the frontend, and may break the search UI interface.

2. **Unbounded Version History Bloat**
   - The auto-snapshotting engine in `note_update` ([notes.rs](file:///c:/Products-Projects/Noetesy%20Note/notesy-note/src-tauri/src/commands/notes.rs)) appends a full JSON snapshot of the note to the `note_history` table if 10 minutes have elapsed since the last save. There is no retention policy, maximum revision count, or delta-compression implemented. Over time, large notes edited frequently will cause the SQLite database size to grow exponentially.

3. **Inconsistent Folder Deletion Cascade Behavior**
   - In the database schema ([001_init.sql](file:///c:/Products-Projects/Noetesy%20Note/notesy-note/src-tauri/src/db/migrations/001_init.sql)), deleting a folder cascades deletion to all child subfolders. However, notes referencing those folders have their `folder_id` set to `NULL` (`ON DELETE SET NULL`). This causes notes inside a deleted folder to be scattered to the root note-list rather than being moved to the Trash (`is_deleted = 1`) or deleted alongside the folder, leading to messy, unorganized data.

4. **Missing Asset Reference Garbage Collection**
   - When users remove images or files from a note editor, the binary data remains stored in the `assets` table ([001_init.sql](file:///c:/Products-Projects/Noetesy%20Note/notesy-note/src-tauri/src/db/migrations/001_init.sql)). The application lacks an asset garbage collector to trace active note content and prune orphaned records, leading to permanent database storage bloat.

5. **Lack of Pagination on Large Note Lists**
   - The `notes_list` command ([notes.rs](file:///c:/Products-Projects/Noetesy%20Note/notesy-note/src-tauri/src/commands/notes.rs)) queries and transfers all notes under the selected folder in a single database round-trip and IPC transfer. For users with thousands of notes, this design will lead to significant latency during Tauri IPC serialization and UI thread bottlenecks.

6. **Race Conditions during Debounced Saves on Note Switch**
   - If a user switches from Note A to Note B while an auto-save operation is pending or debouncing, the saving mechanism could write the modified buffer of Note A into Note B, or overwrite the contents of Note A with an empty state depending on state race timings in the frontend.

---

# Future modifications requried to the application

1. **FTS5 Search Input Sanitization**
   - Implement a query sanitization function in the Rust backend to strip or escape special FTS5 control characters (e.g., matching double quotes, escaping wildcard characters, removing naked operators) before passing the string to the database `MATCH` operator.

2. **Snapshot Retention Policy and Pruning**
   - Introduce a revision cleanup task that runs in the background. It should enforce a maximum number of historical snapshots per note (e.g., keep the last 50 edits) or implement a thinning algorithm (e.g., keep hourly edits for the last 24 hours, daily edits for the last week, and weekly edits thereafter).

3. **Orphaned Asset Pruning**
   - Write a database maintenance routine to scan the plain-text/JSON contents of notes for embedded asset URI references. Clean up rows from the `assets` table whose asset IDs are no longer referenced anywhere in active notes.

4. **Paginated and Virtualized Note Lists**
   - Add `limit` and `offset` parameters to the `notes_list` Tauri command and implement virtualized windowing lists in the React sidebar components to ensure the UI can handle thousands of notes smoothly.

5. **Safe Note-Switching Save Flush**
   - Modify the frontend state machine to explicitly trigger a synchronous, block-saving flush of any dirty editor changes immediately before updating `activeNoteId`. Ensure the editor component is completely unmounted or locked during this transition.

6. **Bi-directional Linking Visualization**
   - Implement a visual graph view using the `note_links` table to display how notes connect to each other via internal wiki-links, allowing users to navigate and explore their knowledge base contextually.