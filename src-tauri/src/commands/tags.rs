use crate::db::Database;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: String,
}

#[tauri::command]
pub fn tags_list(state: tauri::State<Database>) -> Result<Vec<Tag>, String> {
    let conn = state.get_conn();
    let mut stmt = conn.prepare("SELECT id, name, color FROM tags ORDER BY name ASC").map_err(|e| e.to_string())?;
    
    let rows = stmt.query_map([], |row| {
        Ok(Tag {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut tags = Vec::new();
    for row in rows {
        tags.push(row.map_err(|e| e.to_string())?);
    }
    
    Ok(tags)
}

#[tauri::command]
pub fn tag_create(name: String, color: Option<String>, state: tauri::State<Database>) -> Result<Tag, String> {
    let conn = state.get_conn();
    let id = uuid::Uuid::new_v4().to_string();
    let c = color.unwrap_or_else(|| "#6b7280".to_string());
    
    conn.execute(
        "INSERT INTO tags (id, name, color) VALUES (?1, ?2, ?3)",
        (&id, &name, &c)
    ).map_err(|e| e.to_string())?;

    Ok(Tag {
        id,
        name,
        color: c,
    })
}

#[tauri::command]
pub fn tag_assign(note_id: String, tag_id: String, state: tauri::State<Database>) -> Result<(), String> {
    let conn = state.get_conn();
    conn.execute("INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?1, ?2)", (&note_id, &tag_id)).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn tag_remove(note_id: String, tag_id: String, state: tauri::State<Database>) -> Result<(), String> {
    let conn = state.get_conn();
    conn.execute("DELETE FROM note_tags WHERE note_id = ?1 AND tag_id = ?2", (&note_id, &tag_id)).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn note_tags_get(note_id: String, state: tauri::State<Database>) -> Result<Vec<Tag>, String> {
    let conn = state.get_conn();
    let mut stmt = conn.prepare("
        SELECT t.id, t.name, t.color 
        FROM tags t 
        JOIN note_tags nt ON t.id = nt.tag_id 
        WHERE nt.note_id = ?1
        ORDER BY t.name ASC
    ").map_err(|e| e.to_string())?;

    let rows = stmt.query_map([&note_id], |row| {
        Ok(Tag {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut tags = Vec::new();
    for row in rows {
        tags.push(row.map_err(|e| e.to_string())?);
    }
    
    Ok(tags)
}