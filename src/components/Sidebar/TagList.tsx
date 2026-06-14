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
      // Pick a random hex color
      const color = '#' + Math.floor(Math.random()*16777215).toString(16).padEnd(6, '0')
      await tagCreate(name, color)
      const data = await tagsList()
      setTags(data)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <button 
            key={tag.id}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }}></span>
            {tag.name}
          </button>
        ))}
        <button 
          onClick={handleAddTag}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  )
}