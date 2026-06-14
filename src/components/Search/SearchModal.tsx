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

  const displayItems = query
    ? results
    : notes.slice(0, 5).map(n => ({ id: n.id, title: n.title, snippet: 'Recently edited', updated_at: n.updated_at }))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" style={{ backgroundColor: 'rgba(42,36,33,0.4)', backdropFilter: 'blur(6px)' }}>
      {/* Background click listener */}
      <div className="absolute inset-0" onClick={toggleSearch} />

      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col theme-transition"
        style={{
          backgroundColor: 'var(--color-canvas)',
          border: '1px solid var(--color-border)',
          maxHeight: '70vh',
        }}
        role="dialog"
      >
        {/* Search Input */}
        <div
          className="flex items-center px-5 py-3.5"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <Search size={18} style={{ color: 'var(--color-type-secondary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-3 bg-transparent outline-none text-lg"
            placeholder="Search notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ color: 'var(--color-type-primary)' }}
          />
          <button
            onClick={toggleSearch}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--color-type-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-type-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-type-secondary)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 p-2">
          {query && results.length === 0 ? (
            <div
              className="py-12 text-center"
              style={{ color: 'var(--color-type-secondary)' }}
            >
              <Search size={30} className="mx-auto mb-3 opacity-20" />
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="space-y-1">
              {!query && notes.length > 0 && (
                <div
                  className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-type-secondary)' }}
                >
                  Recent Notes
                </div>
              )}
              {displayItems.map((item, index) => {
                const isSelected = index === selectedIndex
                return (
                  <div
                    key={item.id}
                    onClick={() => { setActiveNote(item.id); toggleSearch() }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className="px-4 py-3 rounded-xl cursor-pointer flex flex-col gap-1 transition-all duration-100"
                    style={{
                      backgroundColor: isSelected ? 'var(--color-highlight-mid)' : 'transparent',
                      borderLeft: isSelected ? '2px solid var(--color-accent)' : '2px solid transparent',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <FileText
                        size={15}
                        style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-type-secondary)', flexShrink: 0 }}
                      />
                      <span
                        className="font-medium text-sm"
                        style={{ color: 'var(--color-type-primary)' }}
                      >
                        {item.title}
                      </span>
                    </div>
                    <div
                      className="text-xs pl-6 line-clamp-2 prose-marks"
                      style={{ color: 'var(--color-type-secondary)' }}
                      dangerouslySetInnerHTML={{ __html: item.snippet }}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer keyboard hints */}
        <div
          className="px-5 py-2 flex items-center gap-4 text-[11px] theme-transition"
          style={{
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-highlight)',
            color: 'var(--color-type-secondary)',
          }}
        >
          {[['↑↓', 'navigate'], ['Enter', 'open'], ['Esc', 'close']].map(([key, hint]) => (
            <span key={key} className="flex items-center gap-1">
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-type-secondary)' }}
              >
                {key}
              </kbd>
              {hint}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}