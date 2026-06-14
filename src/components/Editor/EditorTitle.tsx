import { useEditorStore } from '../../stores/editorStore'
import { useAppStore } from '../../stores/appStore'
import { noteUpdate, noteMoveToFolder, notesList } from '../../lib/tauri'

export const EditorTitle = () => {
  const { activeNote, setActiveNote, setIsSaving, setLastSaved } = useEditorStore()
  const { folders, setNotes, activeFolderId, editorFont, setEditorFont } = useAppStore()

  if (!activeNote) return null

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setActiveNote({ ...activeNote, title: newTitle })
    setIsSaving(true)
    await noteUpdate(activeNote.id, newTitle, activeNote.content_json, activeNote.content_text)
    setIsSaving(false)
    setLastSaved(Date.now())
  }

  const handleFolderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const folderId = val === 'none' ? null : val
    try {
      await noteMoveToFolder(activeNote.id, folderId)
      setActiveNote({ ...activeNote, folder_id: folderId })
      const refreshedNotes = await notesList(activeFolderId || undefined)
      setNotes(refreshedNotes)
    } catch(err) {
      console.error('Failed to move note:', err)
    }
  }

  const createdDate = new Date(activeNote.created_at).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  })

  const selectStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-highlight)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    color: 'var(--color-type-secondary)',
    padding: '3px 8px',
    fontSize: '11px',
    outline: 'none',
  }

  return (
    <div
      className="flex flex-col gap-3 px-10 pt-8 pb-2 theme-transition"
      style={{ backgroundColor: 'var(--color-canvas)' }}
    >
      {/* Unobtrusive metadata row */}
      <div
        className="flex flex-wrap items-center gap-3 text-[11px]"
        style={{ color: 'var(--color-type-secondary)' }}
      >
        {/* Folder picker */}
        <div className="flex items-center gap-1.5">
          <span>📂</span>
          <select value={activeNote.folder_id || 'none'} onChange={handleFolderChange} style={selectStyle}>
            <option value="none">No Folder</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Divider dot */}
        <span style={{ opacity: 0.3 }}>·</span>

        {/* Created date */}
        <span>Created {createdDate}</span>

        {/* Divider dot */}
        <span style={{ opacity: 0.3 }}>·</span>

        {/* Font picker */}
        <div className="flex items-center gap-1.5">
          <span>Aa</span>
          <select value={editorFont} onChange={(e) => setEditorFont(e.target.value as any)} style={selectStyle}>
            <option value="sans">Geist</option>
            <option value="calibri">Calibri</option>
            <option value="comicsans">Comic Sans</option>
            <option value="helvetica">Helvetica</option>
            <option value="times">Times New Roman</option>
            <option value="aptos">Aptos</option>
          </select>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={activeNote.title}
        onChange={handleTitleChange}
        placeholder="Untitled"
        className="w-full text-3xl font-bold bg-transparent outline-none placeholder-opacity-30"
        style={{
          color: 'var(--color-type-primary)',
          caretColor: 'var(--color-accent)',
        }}
      />

      {/* Thin separator line */}
      <div style={{ height: '1px', backgroundColor: 'var(--color-border)', marginTop: '4px' }} />
    </div>
  )
}