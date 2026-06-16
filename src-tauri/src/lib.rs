pub mod db;
pub mod commands;

use tauri::Manager;
use commands::notes::*;
use commands::folders::*;
use commands::tags::*;
use commands::search::*;
use commands::export::*;
use commands::assets::*;
use db::Database;
use std::path::PathBuf;
use std::fs;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default)]
struct AppConfig {
    database_dir: Option<String>,
}

fn get_config_path(app: &tauri::AppHandle) -> Option<PathBuf> {
    app.path().app_config_dir().ok().map(|p| p.join("config.json"))
}

fn load_config(app: &tauri::AppHandle) -> AppConfig {
    if let Some(config_path) = get_config_path(app) {
        if config_path.exists() {
            if let Ok(content) = fs::read_to_string(config_path) {
                if let Ok(config) = serde_json::from_str::<AppConfig>(&content) {
                    return config;
                }
            }
        }
    }
    AppConfig::default()
}

fn save_config(app: &tauri::AppHandle, config: &AppConfig) -> Result<(), String> {
    let config_path = get_config_path(app).ok_or("Failed to get config path")?;
    if let Some(parent) = config_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(config_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_database_path(app: tauri::AppHandle) -> Result<String, String> {
    let config = load_config(&app);
    if let Some(ref path) = config.database_dir {
        Ok(path.clone())
    } else {
        let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
        Ok(app_data_dir.to_string_lossy().to_string())
    }
}

#[tauri::command]
fn set_database_path(
    new_path: String,
    app: tauri::AppHandle,
    state: tauri::State<Database>,
) -> Result<(), String> {
    let new_path_buf = PathBuf::from(&new_path);
    state.change_path(new_path_buf).map_err(|e| e.to_string())?;

    let mut config = load_config(&app);
    config.database_dir = Some(new_path);
    save_config(&app, &config)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_handle = app.handle();
            let config = load_config(app_handle);
            let app_data_dir = if let Some(ref path) = config.database_dir {
                PathBuf::from(path)
            } else {
                app.path().app_data_dir().expect("Failed to get app data dir")
            };
            let db = Database::open(app_data_dir).expect("Failed to initialize database");
            
            // Spawn background maintenance thread
            let bg_db = db.clone();
            std::thread::spawn(move || {
                loop {
                    // Sleep for 1 hour
                    std::thread::sleep(std::time::Duration::from_secs(3600));
                    if let Err(e) = bg_db.run_maintenance() {
                        eprintln!("Maintenance error: {}", e);
                    }
                }
            });

            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Database path commands
            get_database_path,
            set_database_path,
            // Notes
            note_create,
            note_update,
            note_get,
            notes_list,
            note_delete,
            note_restore,
            note_toggle_favorite,
            note_move_to_folder,
            // Folders
            folders_list,
            folder_create,
            folder_rename,
            folder_delete,
            // Tags
            tags_list,
            tag_create,
            tag_assign,
            tag_remove,
            note_tags_get,
            // Search
            full_text_search,
            // Export / Assets
            export_markdown,
            export_json_backup,
            asset_save,
            asset_get
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

