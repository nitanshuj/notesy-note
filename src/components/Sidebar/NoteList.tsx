import { useEffect, useState, useRef } from 'react'
import { FileText, Star, Trash2 } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { notesList, noteDelete } from '../../lib/tauri'

export const NoteList = () => {
  const { notes, setNotes, activeFolderId, activeNoteId, setActiveNote } = useAppStore()
  const offsetRef = useRef(0)
  const hasMoreRef = useRef(true)
  const isLoadingRef = useRef(false)
  const [, setForceRender] = useState(0)
  const limit = 50

  // Reset pagination state when active folder changes
  useEffect(() => {
    offsetRef.current = 0
    hasMoreRef.current = true
    isLoadingRef.current = false
    setNotes([])
  }, [activeFolderId, setNotes])

  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadMore = async () => {
      if (isLoadingRef.current || !hasMoreRef.current) return
      
      isLoadingRef.current = true
      setForceRender(prev => prev + 1)
      
      try {
        const currentOffset = offsetRef.current
        const data = await notesList(activeFolderId || undefined, limit, currentOffset)
        
        const currentNotes = useAppStore.getState().notes
        if (currentOffset > 0) {
          setNotes([...currentNotes, ...data])
        } else {
          setNotes(data)
        }
        
        offsetRef.current = currentOffset + data.length
        hasMoreRef.current = data.length === limit
      } catch (e) {
        console.error(e)
      } finally {
        isLoadingRef.current = false
        setForceRender(prev => prev + 1)
      }
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [activeFolderId, setNotes])

  // The early return was preventing the observer from rendering

  const handleDeleteNote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const confirmDelete = window.confirm("Are you sure you want to delete this note?")
    if (!confirmDelete) return
    try {
      await noteDelete(id)
      if (activeNoteId === id) setActiveNote(null)
      // refresh current page up to current offset
      const data = await notesList(activeFolderId || undefined, offsetRef.current || limit, 0)
      setNotes(data)
    } catch (err) {
      console.error("Failed to delete note:", err)
    }
  }

  return (
    <div className="space-y-0.5">
      {notes.map(note => {
        const isActive = activeNoteId === note.id
        return (
          <div
            key={note.id}
            onClick={() => setActiveNote(note.id)}
            className="group relative w-full text-left flex flex-col p-2 rounded-lg transition-all duration-150 cursor-pointer theme-transition"
            style={{
              backgroundColor: isActive ? 'var(--color-highlight)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-highlight-mid)'
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="font-medium text-[13px] truncate pr-2 flex items-center gap-1.5"
                style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-type-primary)' }}
              >
                <FileText size={13} style={{ color: 'var(--color-type-secondary)', opacity: 0.6, flexShrink: 0 }} />
                {note.title || 'Untitled'}
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {note.is_favorite && <Star size={11} style={{ color: '#c9a227', fill: '#c9a227' }} />}
                <button
                  onClick={(e) => handleDeleteNote(e, note.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
                  title="Delete Note"
                  style={{ color: 'var(--color-type-secondary)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#c0392b')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-type-secondary)')}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <span
              className="text-[11px] pl-5 truncate mt-0.5"
              style={{ color: 'var(--color-type-secondary)', opacity: 0.7 }}
            >
              {new Date(note.updated_at).toLocaleDateString()}
            </span>
          </div>
        )
      })}
      
      {notes.length === 0 && !hasMoreRef.current && !isLoadingRef.current && (
        <div
          className="text-[12px] px-2 py-3 italic"
          style={{ color: 'var(--color-type-secondary)' }}
        >
          No notes found.
        </div>
      )}

      <div ref={observerTarget} className="h-4 w-full flex items-center justify-center">
        {isLoadingRef.current && hasMoreRef.current && (
          <span className="text-[10px]" style={{ color: 'var(--color-type-secondary)' }}>Loading...</span>
        )}
      </div>
    </div>
  )
}