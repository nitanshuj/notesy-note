use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    conn: Mutex<Connection>,
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

        Ok(Database {
            conn: Mutex::new(conn),
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

        let mut conn = self.conn.lock().unwrap();
        *conn = new_conn;
        Ok(())
    }

    pub fn get_conn(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.conn.lock().unwrap()
    }
}