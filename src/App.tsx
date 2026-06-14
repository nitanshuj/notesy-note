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
  const { setActiveNote: setEditorActiveNote } = useEditorStore()

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
        const today = new Date().toISOString().split('T')[0]
        try {
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
    <div
      className="flex h-screen w-screen overflow-hidden font-sans theme-transition"
      style={{
        backgroundColor: 'var(--color-canvas)',
        color: 'var(--color-type-primary)',
      }}
    >
      <Sidebar />
      <main className="flex-1 flex flex-col relative min-w-0">
        {activeNoteId ? (
          <Editor />
        ) : (
          <div
            className="flex-1 flex flex-col items-center justify-center theme-transition"
            style={{ backgroundColor: 'var(--color-canvas)' }}
          >
            <div
              className="flex flex-col items-center gap-5 p-10 rounded-2xl"
              style={{ backgroundColor: 'var(--color-highlight)', border: '1px solid var(--color-border)' }}
            >
              <FileEdit
                size={44}
                style={{ color: 'var(--color-accent)', opacity: 0.7 }}
              />
              <h2
                className="text-xl font-semibold"
                style={{ color: 'var(--color-type-primary)' }}
              >
                Select a note or create a new one
              </h2>
              <button
                onClick={async () => {
                  const note = await noteCreate('Untitled', activeFolderId || undefined)
                  setActiveNote(note.id)
                }}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: 'var(--color-accent)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
              >
                + New Note
              </button>
              <div
                className="text-xs flex items-center gap-5 mt-1"
                style={{ color: 'var(--color-type-secondary)' }}
              >
                <span>
                  <kbd
                    className="px-1.5 py-0.5 rounded text-[11px] mr-1"
                    style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-type-secondary)' }}
                  >
                    Ctrl+N
                  </kbd>
                  New note
                </span>
                <span>
                  <kbd
                    className="px-1.5 py-0.5 rounded text-[11px] mr-1"
                    style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-type-secondary)' }}
                  >
                    Ctrl+K
                  </kbd>
                  Search
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      <SearchModal />
    </div>
  )
}

export default App
