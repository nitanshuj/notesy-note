import { useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { useEditorStore } from '../../stores/editorStore'
import { useAppStore } from '../../stores/appStore'
import { noteUpdate, assetSave } from '../../lib/tauri'
import { editorExtensions } from './extensions'
import { EditorTitle } from './EditorTitle'
import { Toolbar } from './Toolbar'

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
  const { activeNote, setIsSaving, setLastSaved, setWordCount } = useEditorStore()
  const { editorFont } = useAppStore()

  const editor = useEditor({
    extensions: editorExtensions,
    content: activeNote ? JSON.parse(activeNote.content_json) : { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: {
        class: `tiptap prose dark:prose-invert prose-zinc max-w-none focus:outline-none min-h-[500px] px-8 py-6 ${getFontClass(editorFont)}`,
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
    onUpdate: ({ editor }) => {
      setWordCount(editor.storage.characterCount.words())
      debouncedSave(editor)
    },
  })

  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            class: `tiptap prose dark:prose-invert prose-zinc max-w-none focus:outline-none min-h-[500px] px-8 py-6 ${getFontClass(editorFont)}`,
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




  useEffect(() => {
    if (editor && activeNote) {
      if (editor.getText() !== activeNote.content_text) {
        editor.commands.setContent(JSON.parse(activeNote.content_json))
        setWordCount(editor.storage.characterCount.words())
      }
    }
  }, [activeNote?.id])


  const debouncedSave = useCallback(
    debounce(async (editorInstance) => {
      if (!activeNote) return
      setIsSaving(true)
      const contentJson = JSON.stringify(editorInstance.getJSON())
      const contentText = editorInstance.getText()
      
      await noteUpdate(activeNote.id, activeNote.title, contentJson, contentText)
      
      setIsSaving(false)
      setLastSaved(Date.now())
    }, 500),
    [activeNote]
  )

  const handleDrop = async (e: React.DragEvent) => {
    if (!activeNote || !editor) return
    e.preventDefault()
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (!file.type.startsWith('image/')) return

      const arrayBuffer = await file.arrayBuffer()
      const data = Array.from(new Uint8Array(arrayBuffer))
      
      const assetId = await assetSave(activeNote.id, file.name, file.type, data)
      editor.chain().focus().setImage({ src: `asset://${assetId}` }).run()
    }
  }

  if (!editor || !activeNote) return null

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      <Toolbar editor={editor} />
      <div className="flex-1 overflow-y-auto" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
        <div className="max-w-4xl mx-auto w-full">
          <EditorTitle />
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => resolve(func(...args)), waitFor)
    })
}