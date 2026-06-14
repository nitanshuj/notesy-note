use crate::db::Database;
use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct Folder {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub sort_order: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[tauri::command]
pub fn folders_list(state: tauri::State<Database>) -> Result<Vec<Folder>, String> {
    let conn = state.get_conn();
    let mut stmt = conn.prepare("SELECT id, name, parent_id, sort_order, created_at, updated_at FROM folders ORDER BY sort_order ASC, name ASC").map_err(|e| e.to_string())?;
    
    let rows = stmt.query_map([], |row| {
        Ok(Folder {
            id: row.get(0)?,
            name: row.get(1)?,
            parent_id: row.get(2)?,
            sort_order: row.get(3)?,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut folders = Vec::new();
    for row in rows {
        folders.push(row.map_err(|e| e.to_string())?);
    }
    
    Ok(folders)
}

#[tauri::command]
pub fn folder_create(name: String, parent_id: Option<String>, state: tauri::State<Database>) -> Result<Folder, String> {
    let conn = state.get_conn();
    let id = uuid::Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();
    
    conn.execute(
        "INSERT INTO folders (id, name, parent_id, sort_order, created_at, updated_at) VALUES (?1, ?2, ?3, 0, ?4, ?5)",
        (&id, &name, &parent_id, &now, &now)
    ).map_err(|e| e.to_string())?;

    Ok(Folder {
        id,
        name,
        parent_id,
        sort_order: 0,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub fn folder_rename(id: String, name: String, state: tauri::State<Database>) -> Result<(), String> {
    let conn = state.get_conn();
    let now = Utc::now().timestamp_millis();
    conn.execute("UPDATE folders SET name = ?1, updated_at = ?2 WHERE id = ?3", (&name, &now, &id)).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn folder_delete(id: String, state: tauri::State<Database>) -> Result<(), String> {
    let conn = state.get_conn();
    conn.execute("DELETE FROM folders WHERE id = ?1", [&id]).map_err(|e| e.to_string())?;
    Ok(())
}