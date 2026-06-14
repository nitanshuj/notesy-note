import { useState, useEffect } from 'react'
import { Plus, Search, Sun, Moon, FolderOpen, ChevronDown, ChevronRight, Star, Tag } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { noteCreate, folderCreate, foldersList, getDatabasePath, setDatabasePath, notesList, tagsList } from '../../lib/tauri'
import { FolderTree } from './FolderTree'
import { TagList } from './TagList'
import { NoteList } from './NoteList'
import { open } from '@tauri-apps/plugin-dialog'

// Reusable accordion section header
const AccordionSection = ({
  icon,
  label,
  open,
  onToggle,
  action,
}: {
  icon: React.ReactNode
  label: string
  open: boolean
  onToggle: () => void
  action?: React.ReactNode
}) => (
  <div
    className="flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer select-none group theme-transition"
    onClick={onToggle}
    style={{ color: 'var(--color-type-secondary)' }}
    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-highlight-mid)')}
    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest">
      {icon}
      <span>{label}</span>
    </div>
    <div className="flex items-center gap-1">
      {action}
      {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
    </div>
  </div>
)

export const Sidebar = () => {
  const {
    isSidebarCollapsed, sidebarWidth, isDarkMode,
    toggleDarkMode, toggleSearch, activeFolderId,
    setFolders, setNotes, setTags, setActiveNote
  } = useAppStore()

  const [dbPath, setDbPath] = useState<string>('')
  const [favOpen, setFavOpen] = useState(true)
  const [foldersOpen, setFoldersOpen] = useState(true)
  const [tagsOpen, setTagsOpen] = useState(true)
  const [notesOpen, setNotesOpen] = useState(true)

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
        if (createSub) parentId = activeFolderId
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
        title: 'Select Notesy Notes Storage Folder',
      })
      if (selected && typeof selected === 'string') {
        await setDatabasePath(selected)
        setDbPath(selected)
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
      className="flex flex-col h-full theme-transition"
      style={{
        width: sidebarWidth,
        minWidth: 200,
        backgroundColor: 'var(--color-sidebar)',
        borderRight: '1px solid var(--color-sidebar-edge)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <h1
          className="font-bold text-base truncate"
          style={{ color: 'var(--color-type-primary)' }}
        >
          Notesy Notes
        </h1>
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-lg transition-all duration-150"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ color: 'var(--color-type-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-highlight-mid)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      {/* Actions: New Note + Search */}
      <div className="px-3 pt-3 pb-2 flex flex-col gap-2">
        <button
          onClick={handleNewNote}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold text-white transition-all duration-150 hover:scale-[1.01] active:scale-[0.99]"
          style={{ backgroundColor: 'var(--color-accent)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
        >
          <Plus size={16} strokeWidth={2.5} /> New Note
        </button>
        <button
          onClick={toggleSearch}
          className="w-full flex items-center justify-between py-1.5 px-3 rounded-xl text-sm transition-all duration-150"
          style={{
            backgroundColor: 'var(--color-highlight)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-type-secondary)',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-highlight-mid)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-highlight)')}
        >
          <div className="flex items-center gap-2">
            <Search size={14} />
            <span>Search</span>
          </div>
          <kbd
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-type-secondary)' }}
          >
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4 space-y-1">

        {/* ⭐ Favorites Section */}
        <div className="mt-1">
          <AccordionSection
            icon={<Star size={12} />}
            label="Favorites"
            open={favOpen}
            onToggle={() => setFavOpen(o => !o)}
          />
          {favOpen && (
            <div
              className="mx-1 mb-1 px-3 py-2 rounded-lg text-xs italic"
              style={{ color: 'var(--color-type-secondary)' }}
            >
              No pinned notes yet.
            </div>
          )}
        </div>

        {/* 📂 Folders Section */}
        <div>
          <AccordionSection
            icon={<FolderOpen size={12} />}
            label="Folders"
            open={foldersOpen}
            onToggle={() => setFoldersOpen(o => !o)}
            action={
              <button
                onClick={e => { e.stopPropagation(); handleCreateFolder() }}
                className="p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
                title="New Folder"
              >
                <Plus size={12} />
              </button>
            }
          />
          {foldersOpen && (
            <div className="mt-0.5 mx-1">
              <FolderTree />
            </div>
          )}
        </div>

        {/* 📝 Notes Section */}
        <div>
          <AccordionSection
            icon={<Search size={12} />}
            label="Notes"
            open={notesOpen}
            onToggle={() => setNotesOpen(o => !o)}
          />
          {notesOpen && (
            <div className="mt-0.5 mx-1">
              <NoteList />
            </div>
          )}
        </div>

        {/* 🏷️ Tags Section */}
        <div>
          <AccordionSection
            icon={<Tag size={12} />}
            label="Tags"
            open={tagsOpen}
            onToggle={() => setTagsOpen(o => !o)}
          />
          {tagsOpen && (
            <div className="mt-0.5 mx-1 pb-2">
              <TagList />
            </div>
          )}
        </div>
      </div>

      {/* Footer: Storage Path */}
      <div
        className="px-3 py-2.5"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <button
          onClick={handleSelectStorageDir}
          className="flex items-center gap-1.5 text-xs transition-colors duration-150 truncate w-full text-left rounded-lg px-2 py-1.5"
          title={dbPath}
          style={{ color: 'var(--color-type-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-highlight-mid)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <FolderOpen size={13} className="flex-shrink-0" />
          <span className="truncate">
            Storage: {dbPath ? dbPath.split(/[\\\/]/).pop() || dbPath : 'Loading...'}
          </span>
        </button>
      </div>
    </div>
  )
}