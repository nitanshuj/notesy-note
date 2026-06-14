use crate::db::Database;
use serde_json::Value;

// Simple walker implementation since full conversion is complex to handroll perfectly in MVP
fn tip_tap_node_to_markdown(node: &Value) -> String {
    if let Value::Object(map) = node {
        let node_type = map.get("type").and_then(|v| v.as_str()).unwrap_or("");
        
        match node_type {
            "doc" | "paragraph" => {
                let mut content = String::new();
                if let Some(Value::Array(children)) = map.get("content") {
                    for child in children {
                        content.push_str(&tip_tap_node_to_markdown(child));
                    }
                }
                if node_type == "paragraph" {
                    content.push_str("\n\n");
                }
                content
            },
            "text" => {
                let mut text = map.get("text").and_then(|v| v.as_str()).unwrap_or("").to_string();
                if let Some(Value::Array(marks)) = map.get("marks") {
                    for mark in marks {
                        if let Some(m_type) = mark.get("type").and_then(|v| v.as_str()) {
                            match m_type {
                                "bold" => text = format!("**{}**", text),
                                "italic" => text = format!("*{}*", text),
                                "strike" => text = format!("~~{}~~", text),
                                "code" => text = format!("`{}`", text),
                                _ => {}
                            }
                        }
                    }
                }
                text
            },
            "heading" => {
                let level = map.get("attrs")
                    .and_then(|a| a.get("level"))
                    .and_then(|l| l.as_u64())
                    .unwrap_or(1);
                
                let mut content = String::new();
                if let Some(Value::Array(children)) = map.get("content") {
                    for child in children {
                        content.push_str(&tip_tap_node_to_markdown(child));
                    }
                }
                format!("{} {}\n\n", "#".repeat(level as usize), content)
            },
            _ => String::new()
        }
    } else {
        String::new()
    }
}

#[tauri::command]
pub fn export_markdown(note_id: String, state: tauri::State<Database>) -> Result<String, String> {
    let conn = state.get_conn();
    let json_str: String = conn.query_row("SELECT content_json FROM notes WHERE id = ?1", [&note_id], |row| row.get(0)).map_err(|e| e.to_string())?;
    
    let root: Value = serde_json::from_str(&json_str).map_err(|e| e.to_string())?;
    Ok(tip_tap_node_to_markdown(&root).trim().to_string())
}

#[tauri::command]
pub fn export_json_backup(state: tauri::State<Database>) -> Result<String, String> {
    let conn = state.get_conn();
    let mut stmt = conn.prepare("SELECT id, title, content_json, content_text, folder_id, is_favorite, is_deleted, created_at, updated_at FROM notes WHERE is_deleted = 0").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        let note = crate::commands::notes::Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content_json: row.get(2)?,
            content_text: row.get(3)?,
            folder_id: row.get(4)?,
            is_favorite: { let f: i32 = row.get(5)?; f != 0 },
            is_deleted: { let d: i32 = row.get(6)?; d != 0 },
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        };
        Ok(note)
    }).map_err(|e| e.to_string())?;

    let mut notes = Vec::new();
    for row in rows {
        notes.push(row.map_err(|e| e.to_string())?);
    }
    
    serde_json::to_string(&notes).map_err(|e| e.to_string())
}