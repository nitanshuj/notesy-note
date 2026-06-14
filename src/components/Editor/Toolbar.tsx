import { Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline, Strikethrough, Code,
  Heading1, Heading2, Heading3, Heading4, Type,
  List, ListOrdered, Quote, Minus,
  Image as ImageIcon, Link as LinkIcon, Undo, Redo,
  Highlighter, Eraser
} from 'lucide-react'

export const Toolbar = ({ editor }: { editor: Editor }) => {
  if (!editor) return null

  const handleImageUpload = async () => {
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

  // Build dynamic button style based on active state
  const btnStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '6px',
    borderRadius: '8px',
    transition: 'all 0.12s ease',
    backgroundColor: isActive ? 'var(--color-highlight)' : 'transparent',
    color: isActive ? 'var(--color-accent)' : 'var(--color-type-secondary)',
    border: isActive ? '1px solid var(--color-border)' : '1px solid transparent',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  const dividerStyle: React.CSSProperties = {
    width: '1px',
    height: '20px',
    backgroundColor: 'var(--color-border)',
    margin: '0 4px',
    flexShrink: 0,
  }

  const ToolBtn = ({
    onClick,
    active,
    title,
    children,
    disabled,
  }: {
    onClick: () => void
    active?: boolean
    title: string
    children: React.ReactNode
    disabled?: boolean
  }) => (
    <button
      style={{ ...btnStyle(!!active), opacity: disabled ? 0.35 : 1 }}
      onClick={onClick}
      title={title}
      disabled={disabled}
      onMouseEnter={e => {
        if (!active && !disabled) {
          e.currentTarget.style.backgroundColor = 'var(--color-highlight-mid)'
          e.currentTarget.style.color = 'var(--color-type-primary)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = 'var(--color-type-secondary)'
        }
      }}
    >
      {children}
    </button>
  )

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 px-3 py-2 sticky top-0 z-10 theme-transition"
      style={{
        backgroundColor: 'var(--color-highlight)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Group 1: Headings */}
      <ToolBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><Heading1 size={17} /></ToolBtn>
      <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 size={17} /></ToolBtn>
      <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3"><Heading3 size={17} /></ToolBtn>
      <ToolBtn active={editor.isActive('heading', { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} title="Heading 4"><Heading4 size={17} /></ToolBtn>
      <ToolBtn active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} title="Normal Text"><Type size={17} /></ToolBtn>

      <div style={dividerStyle} />

      {/* Group 2: Inline formatting */}
      <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold size={17} /></ToolBtn>
      <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic size={17} /></ToolBtn>
      <ToolBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><Underline size={17} /></ToolBtn>
      <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><Strikethrough size={17} /></ToolBtn>
      <ToolBtn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline Code"><Code size={17} /></ToolBtn>

      <div style={dividerStyle} />

      {/* Group 3: Color & Highlight */}
      <input
        type="color"
        onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
        className="w-7 h-7 p-0 border-0 rounded-lg cursor-pointer bg-transparent"
        title="Text Color"
        style={{ padding: '2px' }}
      />
      <ToolBtn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight Text">
        <Highlighter size={16} />
      </ToolBtn>
      <input
        type="color"
        onInput={(event) => editor.chain().focus().setHighlight({ color: (event.target as HTMLInputElement).value }).run()}
        className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
        title="Highlight Color"
        defaultValue="#fef08a"
        style={{ padding: '2px' }}
      />
      <ToolBtn active={false} onClick={() => editor.chain().focus().unsetHighlight().run()} title="Clear Highlight">
        <Eraser size={16} />
      </ToolBtn>

      <div style={dividerStyle} />

      {/* Group 4: Code Block Language */}
      <select
        onChange={(e) => editor.chain().focus().setCodeBlock({ language: e.target.value }).run()}
        className="text-[12px] rounded-lg px-2 py-1 outline-none transition-all"
        value={editor.getAttributes('codeBlock').language || 'plaintext'}
        style={{
          backgroundColor: 'var(--color-highlight)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-type-secondary)',
        }}
      >
        <option value="plaintext">Plain</option>
        <option value="javascript">JS</option>
        <option value="typescript">TS</option>
        <option value="python">Python</option>
        <option value="rust">Rust</option>
        <option value="go">Go</option>
        <option value="sql">SQL</option>
        <option value="bash">Bash</option>
        <option value="json">JSON</option>
        <option value="yaml">YAML</option>
        <option value="html">HTML</option>
        <option value="css">CSS</option>
        <option value="markdown">MD</option>
      </select>

      <div style={dividerStyle} />

      {/* Group 5: Lists & Structure */}
      <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List"><List size={17} /></ToolBtn>
      <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List"><ListOrdered size={17} /></ToolBtn>
      <ToolBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote"><Quote size={17} /></ToolBtn>
      <ToolBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus size={17} /></ToolBtn>

      <div style={dividerStyle} />

      {/* Group 6: Insert */}
      <ToolBtn active={false} onClick={handleImageUpload} title="Insert Image"><ImageIcon size={17} /></ToolBtn>
      <ToolBtn active={editor.isActive('link')} onClick={setLink} title="Link"><LinkIcon size={17} /></ToolBtn>

      <div style={dividerStyle} />

      {/* Group 7: History */}
      <ToolBtn active={false} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={17} /></ToolBtn>
      <ToolBtn active={false} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={17} /></ToolBtn>
    </div>
  )
}