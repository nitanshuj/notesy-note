import { useState, useEffect } from 'react'
import { Plus, Search, Sun, Moon, FolderOpen } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { noteCreate, folderCreate, foldersList, getDatabasePath, setDatabasePath, notesList, tagsList } from '../../lib/tauri'
import { FolderTree } from './FolderTree'
import { TagList } from './TagList'
import { NoteList } from './NoteList'
import { open } from '@tauri-apps/plugin-dialog'

export const Sidebar = () => {
  const { 
    isSidebarCollapsed, sidebarWidth, isDarkMode, 
    toggleDarkMode, toggleSearch, activeFolderId,
    setFolders, setNotes, setTags, setActiveNote
  } = useAppStore()

  const [dbPath, setDbPath] = useState<string>('')

  useEffect(() => {
    getDatabasePath().then(setDbPath).catch(console.error)
  }, [])

  if (isSidebarCollapsed) return null

  const handleNewNote = async () => {
    try {
      const note = await noteCreate('Untitled', activeFolderId || undefined)
      useAppStore.getState().setActiveNote(note.id)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreateFolder = async () => {
    const name = window.prompt('Enter folder name:')
    if (!name || name.trim() === '') return
    try {
      let parentId: string | undefined = undefined
      if (activeFolderId) {
        const createSub = window.confirm('Create as a subfolder of the selected folder?')
        if (createSub) {
          parentId = activeFolderId
        }
      }
      await folderCreate(name.trim(), parentId)
      const updated = await foldersList()
      setFolders(updated)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSelectStorageDir = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Noetesy Notes Storage Folder',
      })
      if (selected && typeof selected === 'string') {
        await setDatabasePath(selected)
        setDbPath(selected)

        // Clear current active note selection and reload data from new SQLite database connection
        setActiveNote(null)
        const newFolders = await foldersList()
        setFolders(newFolders)
        const newNotes = await notesList(undefined)
        setNotes(newNotes)
        const newTags = await tagsList()
        setTags(newTags)
      }
    } catch (e) {
      console.error('Failed to change database path:', e)
    }
  }

  return (
    <div 
      className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800"
      style={{ width: sidebarWidth, minWidth: 180 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="font-bold text-zinc-800 dark:text-zinc-100 truncate">Noetesy Notes</h1>
        <button onClick={toggleDarkMode} className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <button 
          onClick={handleNewNote}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New Note
        </button>
        <button 
          onClick={toggleSearch}
          className="w-full flex items-center justify-between py-1.5 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-2"><Search size={16} /> Search</div>
          <kbd className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-zinc-400">Ctrl+K</kbd>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Note List (filtered by active folder/tags, but initially shows all or active folder) */}
        <div className="px-3">
          <NoteList />
        </div>

        {/* Folders */}
        <div className="mt-4 px-3">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-2 flex justify-between items-center">
            <span>Folders</span>
            <button onClick={handleCreateFolder} className="hover:text-zinc-600 dark:hover:text-zinc-300">
              <Plus size={14} />
            </button>
          </div>
          <FolderTree />
        </div>

        {/* Tags */}
        <div className="mt-6 px-3 pb-4">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-2">Tags</div>
          <TagList />
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 flex flex-col gap-2">
        <button 
          onClick={handleSelectStorageDir}
          className="flex items-center gap-1.5 hover:text-zinc-800 dark:hover:text-zinc-200 text-left transition-colors truncate w-full"
          title={dbPath}
        >
          <FolderOpen size={14} className="flex-shrink-0" />
          <span className="truncate">Storage: {dbPath ? dbPath.split(/[\\/]/).pop() || dbPath : 'Loading...'}</span>
        </button>
      </div>
    </div>
  )
}