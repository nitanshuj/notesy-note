import { useEffect } from 'react'
import { FileText, Star, Trash2 } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { notesList, noteDelete } from '../../lib/tauri'

export const NoteList = () => {
  const { notes, setNotes, activeFolderId, activeNoteId, setActiveNote } = useAppStore()

  const fetchNotes = async () => {
    try {
      const data = await notesList(activeFolderId || undefined)
      setNotes(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [activeFolderId, setNotes])

  if (notes.length === 0) {
    return <div className="text-sm text-zinc-500 px-2 py-4 italic">No notes found.</div>
  }

  const handleDeleteNote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const confirmDelete = window.confirm("Are you sure you want to delete this note?")
    if (!confirmDelete) return
    try {
      await noteDelete(id)
      if (activeNoteId === id) {
        setActiveNote(null)
      }
      await fetchNotes()
    } catch (err) {
      console.error("Failed to delete note:", err)
    }
  }

  return (
    <div className="space-y-1">
      {notes.map(note => (
        <div
          key={note.id}
          onClick={() => setActiveNote(note.id)}
          className={`group relative w-full text-left flex flex-col p-2 rounded-md transition-colors cursor-pointer ${activeNoteId === note.id ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-900 dark:text-teal-100' : 'hover:bg-zinc-200/50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm truncate pr-2 flex items-center gap-1.5">
              <FileText size={14} className="opacity-50 flex-shrink-0" />
              {note.title || 'Untitled'}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {note.is_favorite && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
              <button
                onClick={(e) => handleDeleteNote(e, note.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 dark:hover:bg-red-950/50 text-zinc-400 hover:text-red-600 rounded transition-opacity"
                title="Delete Note"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          <span className="text-xs opacity-60 pl-5 truncate">
            {new Date(note.updated_at).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  )
}