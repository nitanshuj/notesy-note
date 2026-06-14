use crate::db::Database;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use rusqlite::OptionalExtension;

#[derive(Serialize, Deserialize, Clone)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content_json: String,
    pub content_text: String,
    pub folder_id: Option<String>,
    pub is_favorite: bool,
    pub is_deleted: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct NoteListItem {
    pub id: String,
    pub title: String,
    pub folder_id: Option<String>,
    pub is_favorite: bool,
    pub is_deleted: bool,
    pub updated_at: i64,
}

#[tauri::command]
pub fn note_create(
    title: String,
    folder_id: Option<String>,
    state: tauri::State<Database>,
) -> Result<Note, String> {
    let conn = state.get_conn();
    let id = uuid::Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();
    let content_json = "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\"}]}".to_string();
    let content_text = "".to_string();

    conn.execute(
        "INSERT INTO notes (id, title, content_json, content_text, folder_id, is_favorite, is_deleted, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, 0, 0, ?6, ?7)",
        (
            &id,
            &title,
            &content_json,
            &content_text,
            &folder_id,
            &now,
            &now,
        ),
    )
    .map_err(|e| e.to_string())?;

    Ok(Note {
        id,
        title,
        content_json,
        content_text,
        folder_id,
        is_favorite: false,
        is_deleted: false,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub fn note_update(
    id: String,
    title: String,
    content_json: String,
    content_text: String,
    state: tauri::State<Database>,
) -> Result<(), String> {
    let conn = state.get_conn();
    let now = Utc::now().timestamp_millis();

    conn.execute(
        "UPDATE notes SET title = ?1, content_json = ?2, content_text = ?3, updated_at = ?4 WHERE id = ?5",
        (&title, &content_json, &content_text, &now, &id),
    )
    .map_err(|e| e.to_string())?;

    // Create a snapshot for history conditionally. For simplicity, just insert every time, or implement a 10-minute check.
    let last_snapshot_time: Option<i64> = conn.query_row(
        "SELECT saved_at FROM note_history WHERE note_id = ?1 ORDER BY saved_at DESC LIMIT 1",
        [&id],
        |row| row.get(0),
    ).optional().unwrap_or(None).flatten();

    let take_snapshot = match last_snapshot_time {
        Some(t) => now - t > 600_000, // 10 minutes
        None => true,
    };

    if take_snapshot {
        let history_id = uuid::Uuid::new_v4().to_string();
        let _ = conn.execute(
            "INSERT INTO note_history (id, note_id, content_json, saved_at) VALUES (?1, ?2, ?3, ?4)",
            (&history_id, &id, &content_json, &now),
        );
    }

    Ok(())
}

#[tauri::command]
pub fn note_get(id: String, state: tauri::State<Database>) -> Result<Note, String> {
    let conn = state.get_conn();
    
    let mut stmt = conn
        .prepare("SELECT id, title, content_json, content_text, folder_id, is_favorite, is_deleted, created_at, updated_at FROM notes WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let note = stmt
        .query_row([&id], |row| {
            let is_fav: i32 = row.get(5)?;
            let is_del: i32 = row.get(6)?;
            Ok(Note {
                id: row.get(0)?,
                title: row.get(1)?,
                content_json: row.get(2)?,
                content_text: row.get(3)?,
                folder_id: row.get(4)?,
                is_favorite: is_fav != 0,
                is_deleted: is_del != 0,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    Ok(note)
}

#[tauri::command]
pub fn notes_list(folder_id: Option<String>, state: tauri::State<Database>) -> Result<Vec<NoteListItem>, String> {
    let conn = state.get_conn();
    
    let query = match &folder_id {
        Some(_) => "SELECT id, title, folder_id, is_favorite, is_deleted, updated_at FROM notes WHERE is_deleted = 0 AND folder_id = ?1 ORDER BY updated_at DESC",
        None => "SELECT id, title, folder_id, is_favorite, is_deleted, updated_at FROM notes WHERE is_deleted = 0 AND folder_id IS NULL ORDER BY updated_at DESC",
    };

    let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;

    fn map_row(row: &rusqlite::Row) -> rusqlite::Result<NoteListItem> {
        let is_fav: i32 = row.get(3)?;
        let is_del: i32 = row.get(4)?;
        Ok(NoteListItem {
            id: row.get(0)?,
            title: row.get(1)?,
            folder_id: row.get(2)?,
            is_favorite: is_fav != 0,
            is_deleted: is_del != 0,
            updated_at: row.get(5)?,
        })
    }

    let rows = if let Some(fid) = folder_id {
        stmt.query_map([fid], map_row).map_err(|e| e.to_string())?
    } else {
        stmt.query_map([], map_row).map_err(|e| e.to_string())?
    };

    let mut notes = Vec::new();
    for row in rows {
        notes.push(row.map_err(|e| e.to_string())?);
    }
    Ok(notes)
}

#[tauri::command]
pub fn note_delete(id: String, state: tauri::State<Database>) -> Result<(), String> {
    let conn = state.get_conn();
    conn.execute("UPDATE notes SET is_deleted = 1 WHERE id = ?1", [&id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn note_restore(id: String, state: tauri::State<Database>) -> Result<(), String> {
    let conn = state.get_conn();
    conn.execute("UPDATE notes SET is_deleted = 0 WHERE id = ?1", [&id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn note_toggle_favorite(id: String, state: tauri::State<Database>) -> Result<bool, String> {
    let conn = state.get_conn();
    let current: i32 = conn.query_row("SELECT is_favorite FROM notes WHERE id = ?1", [&id], |row| row.get(0)).map_err(|e| e.to_string())?;
    let new_val = if current == 0 { 1 } else { 0 };
    conn.execute("UPDATE notes SET is_favorite = ?1 WHERE id = ?2", rusqlite::params![new_val, id]).map_err(|e| e.to_string())?;
    Ok(new_val != 0)
}

#[tauri::command]
pub fn note_move_to_folder(
    id: String,
    folder_id: Option<String>,
    state: tauri::State<Database>,
) -> Result<(), String> {
    let conn = state.get_conn();
    let now = Utc::now().timestamp_millis();
    conn.execute(
        "UPDATE notes SET folder_id = ?1, updated_at = ?2 WHERE id = ?3",
        (&folder_id, &now, &id),
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}