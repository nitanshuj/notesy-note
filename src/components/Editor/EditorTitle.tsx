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
      
      // Refresh the notes list in the sidebar
      const refreshedNotes = await notesList(activeFolderId || undefined)
      setNotes(refreshedNotes)
    } catch(err) {
      console.error('Failed to move note:', err)
    }
  }


  return (
    <div className="px-8 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <input
        type="text"
        value={activeNote.title}
        onChange={handleTitleChange}
        placeholder="Note Title"
        className="flex-1 text-3xl font-bold bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600"
      />
      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span>Folder:</span>
          <select
            value={activeNote.folder_id || 'none'}
            onChange={handleFolderChange}
            className="border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-950 px-2 py-1 outline-none text-zinc-700 dark:text-zinc-300"
          >
            <option value="none">No Folder</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span>Font:</span>
          <select
            value={editorFont}
            onChange={(e) => setEditorFont(e.target.value as any)}
            className="border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-950 px-2 py-1 outline-none text-zinc-700 dark:text-zinc-300"
          >
            <option value="sans">Default (Geist)</option>
            <option value="calibri">Calibri</option>
            <option value="comicsans">Comic Sans</option>
            <option value="helvetica">Helvetica</option>
            <option value="times">Times New Roman</option>
            <option value="aptos">Aptos</option>
          </select>
        </div>
      </div>
    </div>
  )
}
