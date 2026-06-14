import { create } from 'zustand'
import type { NoteListItem, Folder, Tag } from '../types'

interface AppState {
  // Navigation
  activeNoteId: string | null
  activeFolderId: string | null
  sidebarWidth: number
  isSidebarCollapsed: boolean

  // Data
  notes: NoteListItem[]
  folders: Folder[]
  tags: Tag[]

  // UI state
  isSearchOpen: boolean
  isDarkMode: boolean
  editorFont: 'sans' | 'calibri' | 'comicsans' | 'helvetica' | 'times' | 'aptos'

  // Actions
  setActiveNote: (id: string | null) => void
  setActiveFolder: (id: string | null) => void
  setNotes: (notes: NoteListItem[]) => void
  setFolders: (folders: Folder[]) => void
  setTags: (tags: Tag[]) => void
  toggleSearch: () => void
  toggleDarkMode: () => void
  toggleSidebar: () => void
  setEditorFont: (font: 'sans' | 'calibri' | 'comicsans' | 'helvetica' | 'times' | 'aptos') => void
}

export const useAppStore = create<AppState>((set) => ({
  activeNoteId: null,
  activeFolderId: null,
  sidebarWidth: 260,
  isSidebarCollapsed: false,
  notes: [],
  folders: [],
  tags: [],
  isSearchOpen: false,
  isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  editorFont: (localStorage.getItem('editorFont') as 'sans' | 'calibri' | 'comicsans' | 'helvetica' | 'times' | 'aptos') || 'sans',
  setActiveNote: (id) => set({ activeNoteId: id }),
  setActiveFolder: (id) => set({ activeFolderId: id, activeNoteId: null }),
  setNotes: (notes) => set({ notes }),
  setFolders: (folders) => set({ folders }),
  setTags: (tags) => set({ tags }),
  toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
  toggleDarkMode: () => set((s) => {
    const next = !s.isDarkMode;
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return { isDarkMode: next };
  }),
  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  setEditorFont: (font) => set(() => {
    localStorage.setItem('editorFont', font);
    return { editorFont: font };
  }),
}))