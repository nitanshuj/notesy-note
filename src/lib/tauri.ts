import { invoke } from '@tauri-apps/api/core'
import type { Note, NoteListItem, Folder, Tag, SearchResult } from '../types'

// Notes
export const noteCreate = (title: string, folderId?: string) =>
  invoke<Note>('note_create', { title, folderId })

export const noteUpdate = (id: string, title: string, contentJson: string, contentText: string) =>
  invoke<void>('note_update', { id, title, contentJson, contentText })

export const noteGet = (id: string) =>
  invoke<Note>('note_get', { id })

export const notesList = (folderId?: string, limit?: number, offset?: number) =>
  invoke<NoteListItem[]>('notes_list', { folderId, limit, offset })

export const noteDelete = (id: string) =>
  invoke<void>('note_delete', { id })

export const noteRestore = (id: string) =>
  invoke<void>('note_restore', { id })

export const noteToggleFavorite = (id: string) =>
  invoke<boolean>('note_toggle_favorite', { id })

export const noteMoveToFolder = (id: string, folderId: string | null) =>
  invoke<void>('note_move_to_folder', { id, folderId })


// Folders
export const foldersList = () =>
  invoke<Folder[]>('folders_list')

export const folderCreate = (name: string, parentId?: string) =>
  invoke<Folder>('folder_create', { name, parentId })

export const folderRename = (id: string, name: string) =>
  invoke<void>('folder_rename', { id, name })

export const folderDelete = (id: string) =>
  invoke<void>('folder_delete', { id })

// Tags
export const tagsList = () =>
  invoke<Tag[]>('tags_list')

export const tagCreate = (name: string, color?: string) =>
  invoke<Tag>('tag_create', { name, color })

export const tagAssign = (noteId: string, tagId: string) =>
  invoke<void>('tag_assign', { noteId, tagId })

export const tagRemove = (noteId: string, tagId: string) =>
  invoke<void>('tag_remove', { noteId, tagId })

export const noteTagsGet = (noteId: string) =>
  invoke<Tag[]>('note_tags_get', { noteId })

// Search
export const fullTextSearch = (query: string) =>
  invoke<SearchResult[]>('full_text_search', { query })

// Export
export const exportMarkdown = (noteId: string) =>
  invoke<string>('export_markdown', { noteId })

export const exportJsonBackup = () =>
  invoke<string>('export_json_backup')

// Assets
export const assetSave = (noteId: string, filename: string, mimeType: string, filePath?: string, data?: number[]) =>
  invoke<string>('asset_save', { noteId, filename, mimeType, filePath, data })

export const assetGet = (id: string) =>
  invoke<number[]>('asset_get', { id })

// Database Path Configuration
export const getDatabasePath = () =>
  invoke<string>('get_database_path')

export const setDatabasePath = (newPath: string) =>
  invoke<void>('set_database_path', { newPath })