import { useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { useEditorStore } from '../../stores/editorStore'
import { useAppStore } from '../../stores/appStore'
import { noteUpdate, assetSave } from '../../lib/tauri'
import { editorExtensions } from './extensions'
import { EditorTitle } from './EditorTitle'
import { Toolbar } from './Toolbar'
import { RefreshCw, Trash2 } from 'lucide-react'

const getFontClass = (font: string) => {
  switch (font) {
    case 'calibri': return 'font-calibri'
    case 'comicsans': return 'font-comicsans'
    case 'helvetica': return 'font-helvetica'
    case 'times': return 'font-times'
    case 'aptos': return 'font-aptos'
    default: return 'font-sans'
  }
}

export const Editor = () => {
  const { activeNote, setIsSaving, setLastSaved, setWordCount, wordCount, isSaving } = useEditorStore()
  const { editorFont } = useAppStore()

  const readingTime = Math.max(1, Math.round(wordCount / 200))

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSettingContentRef = useRef(false)
  const prevNoteRef = useRef<typeof activeNote>(null)

  const editor = useEditor({
    extensions: editorExtensions,
    content: activeNote ? JSON.parse(activeNote.content_json) : { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: {
        class: `tiptap prose prose-zinc max-w-none focus:outline-none min-h-[500px] px-10 py-8 ${getFontClass(editorFont)}`,
        style: 'color: var(--color-type-primary);',
      },
      handleDOMEvents: {
        mousedown: (_view, event) => {
          const target = event.target as HTMLElement
          if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
            event.stopPropagation()
          }
          return false
        }
      }
    },
  })

  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: `tiptap prose prose-zinc max-w-none focus:outline-none min-h-[500px] px-10 py-8 ${getFontClass(editorFont)}`,
            style: 'color: var(--color-type-primary);',
          },
          handleDOMEvents: {
            mousedown: (_view, event) => {
              const target = event.target as HTMLElement
              if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
                event.stopPropagation()
              }
              return false
            }
          }
        },
      })
    }
  }, [editorFont, editor])

  const saveNoteContent = useCallback(async (noteId: string, title: string, json: string, text: string) => {
    setIsSaving(true)
    await noteUpdate(noteId, title, json, text)
    setIsSaving(false)
    setLastSaved(Date.now())
  }, [setIsSaving, setLastSaved])

  const triggerSave = useCallback((editorInstance: any, noteId: string, title: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(async () => {
      const contentJson = JSON.stringify(editorInstance.getJSON())
      const contentText = editorInstance.getText()
      await saveNoteContent(noteId, title, contentJson, contentText)
      saveTimeoutRef.current = null
    }, 500)
  }, [saveNoteContent])

  useEffect(() => {
    if (!editor || !activeNote) return
    const handleUpdate = () => {
      if (isSettingContentRef.current) return
      setWordCount(editor.storage.characterCount.words())
      triggerSave(editor, activeNote.id, activeNote.title)
    }
    editor.on('update', handleUpdate)
    return () => {
      editor.off('update', handleUpdate)
    }
  }, [editor, activeNote?.id, activeNote?.title, setWordCount, triggerSave])

  useEffect(() => {
    if (!editor || !activeNote) return

    if (activeNote.id !== prevNoteRef.current?.id) {
      const switchNote = async () => {
        if (saveTimeoutRef.current && prevNoteRef.current) {
          clearTimeout(saveTimeoutRef.current)
          saveTimeoutRef.current = null
          const contentJson = JSON.stringify(editor.getJSON())
          const contentText = editor.getText()
          try {
            setIsSaving(true)
            await noteUpdate(prevNoteRef.current.id, prevNoteRef.current.title, contentJson, contentText)
            setIsSaving(false)
          } catch(e) { console.error(e) }
        }

        isSettingContentRef.current = true
        editor.commands.setContent(JSON.parse(activeNote.content_json))
        setWordCount(editor.storage.characterCount.words())
        isSettingContentRef.current = false

        prevNoteRef.current = activeNote
      }
      switchNote()
    }
  }, [activeNote, editor, setWordCount, setIsSaving])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleDrop = async (e: React.DragEvent) => {
    if (!activeNote || !editor) return
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0] as any
      if (!file.type.startsWith('image/')) return
      
      let assetId: string
      if (file.path) {
        assetId = await assetSave(activeNote.id, file.name, file.type, file.path, undefined)
      } else {
        const arrayBuffer = await file.arrayBuffer()
        const data = Array.from(new Uint8Array(arrayBuffer))
        assetId = await assetSave(activeNote.id, file.name, file.type, undefined, data)
      }
      editor.chain().focus().setImage({ src: `asset://${assetId}` }).run()
    }
  }

  if (!editor || !activeNote) return null

  return (
    <div
      className="flex flex-col h-full theme-transition"
      style={{ backgroundColor: 'var(--color-canvas)' }}
    >
      <Toolbar editor={editor} />

      {/* Editor Title & Metadata */}
      <EditorTitle />

      {/* Editor Content */}
      <div
        className="flex-1 overflow-y-auto"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{ backgroundColor: 'var(--color-canvas)' }}
      >
        <div className="max-w-4xl mx-auto w-full relative">
          {editor && (
            <BubbleMenu
              editor={editor}
              shouldShow={() => editor.isActive('image')}
            >
              <div
                className="flex items-center gap-1.5 p-1.5 rounded-lg border theme-transition"
                style={{
                  backgroundColor: 'var(--color-sidebar)',
                  borderColor: 'var(--color-border)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider px-2" style={{ color: 'var(--color-type-secondary)' }}>Size</span>
                <button
                  onClick={() => editor.chain().focus().updateAttributes('image', { width: '30%' }).run()}
                  className="px-2.5 py-1 text-xs rounded hover:bg-highlight theme-transition font-medium"
                  style={{
                    color: editor.getAttributes('image').width === '30%' ? 'var(--color-accent)' : 'var(--color-type-secondary)',
                    backgroundColor: editor.getAttributes('image').width === '30%' ? 'var(--color-highlight)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Small
                </button>
                <button
                  onClick={() => editor.chain().focus().updateAttributes('image', { width: '60%' }).run()}
                  className="px-2.5 py-1 text-xs rounded hover:bg-highlight theme-transition font-medium"
                  style={{
                    color: editor.getAttributes('image').width === '60%' ? 'var(--color-accent)' : 'var(--color-type-secondary)',
                    backgroundColor: editor.getAttributes('image').width === '60%' ? 'var(--color-highlight)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Medium
                </button>
                <button
                  onClick={() => editor.chain().focus().updateAttributes('image', { width: '100%' }).run()}
                  className="px-2.5 py-1 text-xs rounded hover:bg-highlight theme-transition font-medium"
                  style={{
                    color: (!editor.getAttributes('image').width || editor.getAttributes('image').width === '100%') ? 'var(--color-accent)' : 'var(--color-type-secondary)',
                    backgroundColor: (!editor.getAttributes('image').width || editor.getAttributes('image').width === '100%') ? 'var(--color-highlight)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Full
                </button>
                
                <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--color-border)', margin: '0 2px' }} />
                
                <button
                  onClick={() => editor.chain().focus().deleteSelection().run()}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded hover:bg-highlight theme-transition font-medium"
                  style={{
                    color: '#ef4444',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              </div>
            </BubbleMenu>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Status Bar */}
      <div
        className="flex items-center justify-between px-6 py-1.5 text-[11px] font-light theme-transition"
        style={{
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-sidebar)',
          color: 'var(--color-status-text)',
        }}
      >
        <div className="flex items-center gap-4">
          <span>Words: <strong style={{ color: 'var(--color-status-text)', fontWeight: 600 }}>{wordCount}</strong></span>
          <span>Reading Time: <strong style={{ color: 'var(--color-status-text)', fontWeight: 600 }}>{readingTime} min</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <RefreshCw
            size={11}
            className={isSaving ? 'animate-spin' : ''}
            style={{ color: isSaving ? 'var(--color-accent)' : 'var(--color-status-text)' }}
          />
          <span>{isSaving ? 'Saving...' : '✓ Synced'}</span>
        </div>
      </div>
    </div>
  )
}