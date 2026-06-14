import { useState, useEffect, useRef } from 'react'
import { Search, X, FileText } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { fullTextSearch } from '../../lib/tauri'
import type { SearchResult } from '../../types'

export const SearchModal = () => {
  const { isSearchOpen, toggleSearch, setActiveNote, notes } = useAppStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isSearchOpen])

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const data = await fullTextSearch(query)
        setResults(data)
        setSelectedIndex(0)
      } catch (e) {
        console.error(e)
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      toggleSearch()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, (query ? results.length : Math.min(5, notes.length)) - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (query && results[selectedIndex]) {
        setActiveNote(results[selectedIndex].id)
        toggleSearch()
      } else if (!query && notes[selectedIndex]) {
        setActiveNote(notes[selectedIndex].id)
        toggleSearch()
      }
    }
  }

  if (!isSearchOpen) return null

  // If no query, show recent 5 notes
  const displayItems = query ? results : notes.slice(0, 5).map(n => ({ id: n.id, title: n.title, snippet: 'Recently edited', updated_at: n.updated_at }))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm px-4">
      {/* Background click listener */}
      <div className="absolute inset-0" onClick={toggleSearch} />
      
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[70vh]"
        role="dialog"
      >
        <div className="flex items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <Search size={20} className="text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-3 bg-transparent outline-none text-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
            placeholder="Search notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={toggleSearch} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {query && results.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <Search size={32} className="mx-auto mb-3 opacity-20" />
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="space-y-1">
              {!query && notes.length > 0 && <div className="px-3 pt-2 pb-1 text-xs font-semibold text-zinc-400 uppercase">Recent Notes</div>}
              {displayItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => { setActiveNote(item.id); toggleSearch(); }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-4 py-3 rounded-lg cursor-pointer flex flex-col gap-1 ${index === selectedIndex ? 'bg-teal-50 dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} className={index === selectedIndex ? 'text-teal-600' : 'text-zinc-400'} />
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.title}</span>
                  </div>
                  {/* use dangerouslySetInnerHTML to render FTS5 <mark> tags */}
                  <div 
                    className="text-sm text-zinc-600 dark:text-zinc-400 pl-6 line-clamp-2 prose-marks"
                    dangerouslySetInnerHTML={{ __html: item.snippet }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-500 flex items-center gap-4">
          <span className="flex items-center gap-1"><kbd className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">↑↓</kbd> to navigate</span>
          <span className="flex items-center gap-1"><kbd className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Enter</kbd> to open</span>
          <span className="flex items-center gap-1"><kbd className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  )
}