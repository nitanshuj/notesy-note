export interface Note {
  id: string
  title: string
  content_json: string
  content_text: string
  folder_id: string | null
  is_favorite: boolean
  is_deleted: boolean
  created_at: number
  updated_at: number
}

export interface NoteListItem {
  id: string
  title: string
  folder_id: string | null
  is_favorite: boolean
  is_deleted: boolean
  updated_at: number
}

export interface Folder {
  id: string
  name: string
  parent_id: string | null
  sort_order: number
  created_at: number
  updated_at: number
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface SearchResult {
  id: string
  title: string
  snippet: string
  updated_at: number
}