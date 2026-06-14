import { useEffect } from 'react'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Editor } from './components/Editor/Editor'
import { SearchModal } from './components/Search/SearchModal'
import { useAppStore } from './stores/appStore'
import { useEditorStore } from './stores/editorStore'
import { noteCreate, noteGet } from './lib/tauri'
import { FileEdit } from 'lucide-react'

function App() {
  const { toggleSearch, isDarkMode, activeNoteId, activeFolderId, setActiveNote } = useAppStore()
  const { isSaving, wordCount, activeNote, setActiveNote: setEditorActiveNote } = useEditorStore()

  useEffect(() => {
    // Apply dark mode immediately on mount based on store
    if (isDarkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [isDarkMode])

  useEffect(() => {
    if (activeNoteId) {
      noteGet(activeNoteId).then(setEditorActiveNote).catch(console.error)
    } else {
      setEditorActiveNote(null)
    }
  }, [activeNoteId, setEditorActiveNote])

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        toggleSearch()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        try {
          const note = await noteCreate('Untitled', activeFolderId || undefined)
          setActiveNote(note.id)
        } catch(e) {
          console.error(e)
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        // Simple implementation of daily note logic. Search for today's date first, else create.
        const today = new Date().toISOString().split('T')[0]
        try {
          // just create for now in MVP
          const note = await noteCreate(today, activeFolderId || undefined)
          setActiveNote(note.id)
        } catch(e) {
          console.error(e)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSearch, activeFolderId, setActiveNote])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-teal-200 dark:selection:bg-teal-900/50">
      <Sidebar />
      <main className="flex-1 flex flex-col relative min-w-0">
        {activeNoteId ? (
          <Editor />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 bg-white dark:bg-zinc-950">
            <FileEdit size={48} className="mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">Select a note or create a new one</h2>
            <button 
              onClick={async () => {
                const note = await noteCreate('Untitled', activeFolderId || undefined)
                setActiveNote(note.id)
              }}
              className="mt-6 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-medium transition-colors"
            >
              + New Note
            </button>
            <div className="mt-8 text-sm flex items-center gap-4 opacity-60">
              <span><kbd className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded mr-1">Ctrl+N</kbd> New note</span>
              <span><kbd className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded mr-1">Ctrl+K</kbd> Search</span>
            </div>
          </div>
        )}
        
        {/* Status bar */}
        {activeNoteId && (
          <div className="h-7 px-4 flex flex-row items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <div className="flex items-center gap-4">
              <span>{wordCount} words</span>
              {isSaving ? <span>Saving...</span> : <span>Saved</span>}
            </div>
            <div className="flex items-center gap-4">
              {activeNote && <span>Created: {new Date(activeNote.created_at).toLocaleDateString()}</span>}
            </div>
          </div>
        )}
      </main>
      
      <SearchModal />
    </div>
  )
}

export default App
