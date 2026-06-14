import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { tagsList, tagCreate } from '../../lib/tauri'

export const TagList = () => {
  const { tags, setTags } = useAppStore()

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await tagsList()
        setTags(data)
      } catch(e) {
        console.error(e)
      }
    }
    fetchTags()
  }, [setTags])

  const handleAddTag = async () => {
    const name = window.prompt('Tag name (without #):')
    if (name) {
      const color = '#' + Math.floor(Math.random()*16777215).toString(16).padEnd(6, '0')
      await tagCreate(name, color)
      const data = await tagsList()
      setTags(data)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1.5 px-1">
        {tags.map(tag => (
          <button
            key={tag.id}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150"
            style={{
              backgroundColor: 'var(--color-highlight)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-type-secondary)',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-highlight-mid)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-highlight)')}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
            {tag.name}
          </button>
        ))}
        <button
          onClick={handleAddTag}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150"
          style={{
            border: '1px dashed var(--color-border)',
            color: 'var(--color-type-secondary)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-type-secondary)')}
        >
          <Plus size={11} /> Add
        </button>
      </div>
    </div>
  )
}