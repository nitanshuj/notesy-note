use crate::db::Database;
use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct Asset {
    pub id: String,
    pub note_id: String,
    pub filename: String,
    pub mime_type: String,
    // data is omitted from JSON serialization for the UI explicitly here
    pub created_at: i64,
}

#[tauri::command]
pub fn asset_save(
    note_id: String,
    filename: String,
    mime_type: String,
    data: Vec<u8>,
    state: tauri::State<Database>,
) -> Result<String, String> {
    let conn = state.get_conn();
    let id = uuid::Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();
    
    conn.execute(
        "INSERT INTO assets (id, note_id, filename, mime_type, data, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![id, note_id, filename, mime_type, data, now]
    ).map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub fn asset_get(id: String, state: tauri::State<Database>) -> Result<Vec<u8>, String> {
    let conn = state.get_conn();
    let data: Vec<u8> = conn.query_row("SELECT data FROM assets WHERE id = ?1", [&id], |row| row.get(0)).map_err(|e| e.to_string())?;
    Ok(data)
}