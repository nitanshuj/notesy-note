import { create } from 'zustand'
import type { Note, Tag } from '../types'

interface EditorState {
  activeNote: Note | null
  noteTags: Tag[]
  isSaving: boolean
  lastSavedAt: number | null
  wordCount: number
  setActiveNote: (note: Note | null) => void
  setNoteTags: (tags: Tag[]) => void
  setIsSaving: (v: boolean) => void
  setLastSaved: (ts: number) => void
  setWordCount: (n: number) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  activeNote: null,
  noteTags: [],
  isSaving: false,
  lastSavedAt: null,
  wordCount: 0,
  setActiveNote: (note) => set({ activeNote: note }),
  setNoteTags: (tags) => set({ noteTags: tags }),
  setIsSaving: (v) => set({ isSaving: v }),
  setLastSaved: (ts) => set({ lastSavedAt: ts }),
  setWordCount: (n) => set({ wordCount: n }),
}))