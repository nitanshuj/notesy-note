use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn open(app_data_dir: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        if !app_data_dir.exists() {
            std::fs::create_dir_all(&app_data_dir)?;
        }

        let db_path = app_data_dir.join("noetesy-notes.sqlite");
        let conn = Connection::open(db_path)?;

        conn.execute_batch(
            "PRAGMA journal_mode=WAL;
             PRAGMA foreign_keys=ON;",
        )?;

        let init_sql = include_str!("migrations/001_init.sql");
        conn.execute_batch(init_sql)?;

        let m2_sql = include_str!("migrations/002_performance_and_cascades.sql");
        conn.execute_batch(m2_sql)?;

        Ok(Database {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    pub fn change_path(&self, new_dir: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
        if !new_dir.exists() {
            std::fs::create_dir_all(&new_dir)?;
        }

        let db_path = new_dir.join("noetesy-notes.sqlite");
        let new_conn = Connection::open(db_path)?;

        new_conn.execute_batch(
            "PRAGMA journal_mode=WAL;
             PRAGMA foreign_keys=ON;",
        )?;

        let init_sql = include_str!("migrations/001_init.sql");
        new_conn.execute_batch(init_sql)?;

        let m2_sql = include_str!("migrations/002_performance_and_cascades.sql");
        new_conn.execute_batch(m2_sql)?;

        let mut conn = self.conn.lock().unwrap();
        *conn = new_conn;
        Ok(())
    }

    pub fn get_conn(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.conn.lock().unwrap()
    }

    pub fn run_maintenance(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let conn = self.conn.lock().unwrap();

        // 1. Thin out note_history
        // Delete anything older than 30 days
        let thirty_days_ms = 30i64 * 24 * 60 * 60 * 1000;
        let now_ms = chrono::Utc::now().timestamp_millis();
        conn.execute(
            "DELETE FROM note_history WHERE saved_at < ?1",
            [now_ms - thirty_days_ms],
        )?;

        // Keep 1 per day for notes older than 24 hours
        // SQLite window functions to keep the latest snapshot per day
        conn.execute(
            "WITH daily_snapshots AS (
                SELECT id, row_number() OVER (
                    PARTITION BY note_id, date(saved_at/1000, 'unixepoch') 
                    ORDER BY saved_at DESC
                ) as rn
                FROM note_history
                WHERE saved_at < (strftime('%s', 'now') - 24 * 60 * 60) * 1000
            )
            DELETE FROM note_history WHERE id IN (SELECT id FROM daily_snapshots WHERE rn > 1);",
            [],
        )?;

        // 2. Asset Garbage Collection
        let mut stmt = conn.prepare("SELECT id, note_id FROM assets")?;
        let assets: Vec<(String, String)> = stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })?.filter_map(|r| r.ok()).collect();
        drop(stmt);

        for (asset_id, note_id) in assets {
            // Check if it exists in the note
            let in_use: bool = conn.query_row(
                "SELECT content_json FROM notes WHERE id = ?1",
                [&note_id],
                |row| {
                    let content: String = row.get(0)?;
                    Ok(content.contains(&asset_id))
                },
            ).unwrap_or(false);

            if !in_use {
                // If not in use in current note, we should also check history before deleting?
                // For safety, we only delete if not in history either, or as the prompt says: 
                // "parses the content_json of all active notes for valid asset:// URIs and executes a DELETE"
                // Let's delete it.
                conn.execute("DELETE FROM assets WHERE id = ?1", [&asset_id])?;
            }
        }

        Ok(())
    }
}