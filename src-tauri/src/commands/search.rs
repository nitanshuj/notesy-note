use crate::db::Database;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub snippet: String,
    pub updated_at: i64,
}

#[tauri::command]
pub fn full_text_search(query: String, state: tauri::State<Database>) -> Result<Vec<SearchResult>, String> {
    let sanitized_query: String = query.chars()
        .filter(|c| !matches!(c, '*' | '"' | '\'' | '-' | '^' | '(' | ')' | '[' | ']' | '{' | '}'))
        .collect();

    let conn = state.get_conn();
    let mut stmt = conn.prepare("
        SELECT n.id, n.title, 
            CASE 
                WHEN highlight(notes_fts, 0, '<mark>', '</mark>') LIKE '%<mark>%' 
                THEN highlight(notes_fts, 0, '<mark>', '</mark>') || ' ... ' || snippet(notes_fts, 1, '<mark>', '</mark>', '...', 5)
                ELSE snippet(notes_fts, 1, '<mark>', '</mark>', '...', 10)
            END as snippet, 
            n.updated_at
        FROM notes_fts fts
        JOIN notes n ON n.rowid = fts.rowid
        WHERE notes_fts MATCH ?1 AND n.is_deleted = 0
        ORDER BY rank LIMIT 20
    ").map_err(|e| e.to_string())?;

    let rows = stmt.query_map([&sanitized_query], |row| {
        Ok(SearchResult {
            id: row.get(0)?,
            title: row.get(1)?,
            snippet: row.get(2)?,
            updated_at: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }
    
    Ok(results)
}