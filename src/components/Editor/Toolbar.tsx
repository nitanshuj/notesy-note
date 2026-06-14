import { Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline, Strikethrough, Code,
  Heading1, Heading2, Heading3, Heading4, Type,
  List, ListOrdered, Quote, Minus,
  Image as ImageIcon, Link as LinkIcon, Undo, Redo,
  Highlighter, Eraser
} from 'lucide-react'


// Let's implement Toolbar.
export const Toolbar = ({ editor }: { editor: Editor }) => {
  if (!editor) return null

  const handleImageUpload = async () => {
    // Implementing native browser file picker for simplicity since @tauri-apps/plugin-dialog doesn't read files directly without @tauri-apps/plugin-fs
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          editor.chain().focus().setImage({ src: base64 }).run()
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const btnClass = (isActive: boolean) =>
    `p-1.5 rounded transition-colors ${isActive ? 'bg-zinc-200 dark:bg-zinc-800 text-teal-600 dark:text-teal-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 absolute top-0 w-full z-10 sticky">
      {/* Group 1: Headings */}
      <div className="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-700 pr-2 mr-1">
        <button className={btnClass(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><Heading1 size={18} /></button>
        <button className={btnClass(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 size={18} /></button>
        <button className={btnClass(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3"><Heading3 size={18} /></button>
        <button className={btnClass(editor.isActive('heading', { level: 4 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} title="Heading 4"><Heading4 size={18} /></button>
        <button className={btnClass(editor.isActive('paragraph'))} onClick={() => editor.chain().focus().setParagraph().run()} title="Normal Text"><Type size={18} /></button>
      </div>

      {/* Group 2: Inline formatting */}
      <div className="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-700 pr-2 mr-1">
        <button className={btnClass(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold size={18} /></button>
        <button className={btnClass(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic size={18} /></button>
        <button className={btnClass(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><Underline size={18} /></button>
        <button className={btnClass(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><Strikethrough size={18} /></button>
        <button className={btnClass(editor.isActive('code'))} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline Code"><Code size={18} /></button>
      </div>

      {/* Group 3: Color, Highlight, & Clear */}
      <div className="flex items-center gap-2 border-r border-zinc-300 dark:border-zinc-700 pr-2 mr-1">
        <input 
          type="color" 
          onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()} 
          className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent" 
          title="Text Color" 
        />
        <div className="flex items-center gap-1">
          <button 
            className={btnClass(editor.isActive('highlight'))} 
            onClick={() => editor.chain().focus().toggleHighlight().run()} 
            title="Highlight Text"
          >
            <Highlighter size={16} />
          </button>
          <input 
            type="color" 
            onInput={(event) => editor.chain().focus().setHighlight({ color: (event.target as HTMLInputElement).value }).run()} 
            className="w-5 h-5 p-0 border-0 rounded cursor-pointer bg-transparent" 
            title="Choose Highlight Color" 
            defaultValue="#fef08a" 
          />
        </div>
        <button 
          className={btnClass(false)} 
          onClick={() => editor.chain().focus().unsetHighlight().run()} 
          title="Remove Highlight"
        >
          <Eraser size={16} />
        </button>
      </div>


      {/* Group 4: Code Block */}
      <div className="flex items-center border-r border-zinc-300 dark:border-zinc-700 pr-2 mr-1">
        <select 
          onChange={(e) => editor.chain().focus().setCodeBlock({ language: e.target.value }).run()}
          className="text-sm border border-zinc-300 dark:border-zinc-700 bg-transparent rounded p-1 dark:text-zinc-200"
          value={editor.getAttributes('codeBlock').language || 'plaintext'}
        >
          <option value="plaintext">Plain Text</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="rust">Rust</option>
          <option value="go">Go</option>
          <option value="sql">SQL</option>
          <option value="bash">Bash</option>
          <option value="json">JSON</option>
          <option value="yaml">YAML</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="markdown">Markdown</option>
        </select>
      </div>

      {/* Group 5: Lists & structure */}
      <div className="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-700 pr-2 mr-1">
        <button className={btnClass(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List"><List size={18} /></button>
        <button className={btnClass(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List"><ListOrdered size={18} /></button>
        <button className={btnClass(editor.isActive('blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote"><Quote size={18} /></button>

        <button className={btnClass(false)} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus size={18} /></button>
      </div>

      {/* Group 6: Insert */}
      <div className="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-700 pr-2 mr-1">
        <button className={btnClass(false)} onClick={handleImageUpload} title="Insert Image"><ImageIcon size={18} /></button>
        <button className={btnClass(editor.isActive('link'))} onClick={setLink} title="Link"><LinkIcon size={18} /></button>
      </div>

      {/* Group 7: History */}
      <div className="flex items-center gap-1">
        <button className={btnClass(false)} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={18} /></button>
        <button className={btnClass(false)} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={18} /></button>
      </div>
    </div>
  )
}