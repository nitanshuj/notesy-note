import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: attributes => {
          if (!attributes.width) {
            return {}
          }
          return {
            style: `width: ${attributes.width}; max-width: 100%; height: auto; display: block; margin: 0 auto; cursor: pointer; transition: width 0.15s ease-in-out;`,
          }
        },
        parseHTML: element => element.style.width || element.getAttribute('width') || '100%',
      },
    }
  },
})

import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { createLowlight, common } from 'lowlight'

const lowlight = createLowlight(common)

export const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4] },
    codeBlock: false,
  }),
  Underline,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  CustomImage.configure({ inline: false, allowBase64: true }),
  CodeBlockLowlight.configure({
    lowlight,
    defaultLanguage: 'plaintext',
    HTMLAttributes: { class: 'code-block' },
  }),
  CharacterCount,
  Placeholder.configure({
    placeholder: 'Start writing… (type / for commands)',
  }),
  Typography,
  Link.configure({ openOnClick: false, autolink: true }),
  Table.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader,
]