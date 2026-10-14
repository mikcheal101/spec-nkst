import { useState, useRef, useEffect } from 'react'

interface Option {
  id: number
  label: string
}

interface SearchableSelectProps {
  options: Option[]
  value: number | null
  onChange: (id: number | null) => void
  placeholder?: string
  excludeIds?: Set<number>
}

export default function SearchableSelect({ options, value, onChange, placeholder, excludeIds }: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.id === value)

  const filtered = options.filter((o) => {
    if (excludeIds?.has(o.id)) return false
    if (!search) return true
    return o.label.toLowerCase().includes(search.toLowerCase())
  })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(id: number | null) {
    onChange(id)
    setSearch('')
    setOpen(false)
    inputRef.current?.blur()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
    if (e.key === 'Enter' && filtered.length > 0) {
      handleSelect(filtered[0].id)
    }
  }

  return (
    <div className="searchable-select" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        className="searchable-select-input"
        value={open ? search : (selected?.label || '')}
        onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
        onFocus={() => { setSearch(''); setOpen(true) }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Search...'}
        autoComplete="off"
      />
      {value && !open && (
        <button
          type="button"
          className="searchable-select-clear"
          onClick={() => handleSelect(null)}
          tabIndex={-1}
        >
          ×
        </button>
      )}
      {open && (
        <div className="searchable-select-dropdown">
          {filtered.length === 0 && (
            <div className="searchable-select-empty">No results</div>
          )}
          {filtered.map((opt) => (
            <div
              key={opt.id}
              className={`searchable-select-option${opt.id === value ? ' selected' : ''}`}
              onClick={() => handleSelect(opt.id)}
              onMouseDown={(e) => e.preventDefault()}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
