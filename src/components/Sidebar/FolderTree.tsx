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
      if (activeFolderId === folder.id) setActiveFolder(null)
      const updatedFolders = await foldersList()
      useAppStore.getState().setFolders(updatedFolders)
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
        className="group flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer text-sm transition-all duration-150 theme-transition"
        style={{
          paddingLeft: `${(depth * 12) + 8}px`,
          backgroundColor: isActive ? 'var(--color-highlight)' : 'transparent',
          color: isActive ? 'var(--color-accent)' : 'var(--color-type-secondary)',
          boxShadow: isActive ? '0 1px 3px rgba(169,112,94,0.08)' : 'none',
        }}
        onMouseEnter={e => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-highlight-mid)'
        }}
        onMouseLeave={e => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
        }}
        onClick={() => setActiveFolder(folder.id)}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <button
            className={`p-0.5 rounded-sm opacity-50 hover:opacity-100 ${children.length === 0 ? 'invisible' : ''}`}
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
          <FolderIcon size={13} className="opacity-70 flex-shrink-0" />
          <span className="truncate text-[13px]">{folder.name}</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 flex-shrink-0 transition-opacity">
          <button
            onClick={handleRename}
            className="p-0.5 rounded transition-colors"
            title="Rename Folder"
            style={{ color: 'var(--color-type-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-type-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-type-secondary)')}
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={handleDelete}
            className="p-0.5 rounded transition-colors"
            title="Delete Folder"
            style={{ color: 'var(--color-type-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c0392b')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-type-secondary)')}
          >
            <Trash2 size={11} />
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
  const isAllActive = activeFolderId === null

  return (
    <div className="space-y-0.5">
      <div
        className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer text-[13px] transition-all duration-150 theme-transition"
        style={{
          backgroundColor: isAllActive ? 'var(--color-highlight)' : 'transparent',
          color: isAllActive ? 'var(--color-accent)' : 'var(--color-type-secondary)',
        }}
        onMouseEnter={e => {
          if (!isAllActive) e.currentTarget.style.backgroundColor = 'var(--color-highlight-mid)'
        }}
        onMouseLeave={e => {
          if (!isAllActive) e.currentTarget.style.backgroundColor = 'transparent'
        }}
        onClick={() => setActiveFolder(null)}
      >
        <div className="w-[18px]" />
        <Inbox size={13} className="opacity-70" />
        <span>All Notes</span>
      </div>
      {rootFolders.map(folder => (
        <FolderItem key={folder.id} folder={folder} folders={folders} />
      ))}
    </div>
  )
}