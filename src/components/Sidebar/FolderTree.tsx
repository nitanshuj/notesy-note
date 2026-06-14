import { useEffect, useState } from 'react'
import { ChevronRight, ChevronDown, Folder as FolderIcon, Inbox, Pencil, Trash2 } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { foldersList, folderDelete, folderRename, notesList } from '../../lib/tauri'
import type { Folder } from '../../types'

const FolderItem = ({ folder, folders, depth = 0 }: { folder: Folder, folders: Folder[], depth?: number }) => {
  const { activeFolderId, setActiveFolder } = useAppStore()
  const [expanded, setExpanded] = useState(false)
  const children = folders.filter(f => f.parent_id === folder.id)
  const isActive = activeFolderId === folder.id

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmDelete = window.confirm(`Are you sure you want to delete the folder "${folder.name}"? This will NOT delete any notes inside this folder.`)
    if (!confirmDelete) return
    try {
      await folderDelete(folder.id)
      if (activeFolderId === folder.id) {
        setActiveFolder(null)
      }
      const updatedFolders = await foldersList()
      useAppStore.getState().setFolders(updatedFolders)

      // Refresh notes list (notes in this folder are now orphaned and should show up in "All Notes" list)
      const updatedNotes = await notesList(activeFolderId === folder.id ? undefined : activeFolderId || undefined)
      useAppStore.getState().setNotes(updatedNotes)
    } catch(err) {
      console.error('Failed to delete folder:', err)
    }
  }

  const handleRename = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const newName = window.prompt('New folder name:', folder.name)
    if (!newName || newName.trim() === '') return
    try {
      await folderRename(folder.id, newName.trim())
      const updated = await foldersList()
      useAppStore.getState().setFolders(updated)
    } catch(err) {
      console.error('Failed to rename folder:', err)
    }
  }

  return (
    <div>
      <div 
        className={`group flex items-center justify-between py-1 px-2 rounded-md cursor-pointer text-sm transition-colors ${isActive ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
        style={{ paddingLeft: `${(depth * 12) + 8}px` }}
        onClick={() => setActiveFolder(folder.id)}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <button 
            className={`p-0.5 rounded-sm opacity-50 hover:opacity-100 ${children.length === 0 ? 'invisible' : ''}`}
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <FolderIcon size={14} className="opacity-70 flex-shrink-0" />
          <span className="truncate">{folder.name}</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleRename}
            className="p-0.5 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors"
            title="Rename Folder"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="p-0.5 hover:bg-red-100 dark:hover:bg-red-950/50 text-zinc-400 hover:text-red-600 rounded transition-colors"
            title="Delete Folder"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {expanded && children.map(child => (
        <FolderItem key={child.id} folder={child} folders={folders} depth={depth + 1} />
      ))}
    </div>
  )
}

export const FolderTree = () => {
  const { folders, setFolders, setActiveFolder, activeFolderId } = useAppStore()

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const data = await foldersList()
        setFolders(data)
      } catch(e) {
        console.error(e)
      }
    }
    fetchFolders()
  }, [setFolders])

  const rootFolders = folders.filter(f => !f.parent_id)

  return (
    <div className="space-y-0.5">
      <div 
        className={`flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer text-sm transition-colors ${activeFolderId === null ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
        onClick={() => setActiveFolder(null)}
      >
        <div className="w-[18px]"></div> {/* spacer for alignment without chevron */}
        <Inbox size={14} className="opacity-70" />
        <span>All Notes</span>
      </div>
      {rootFolders.map(folder => (
        <FolderItem key={folder.id} folder={folder} folders={folders} />
      ))}
    </div>
  )
}