'use client'

import { useState } from 'react'

interface SearchSettingsProps {
  keywords: string[]
  sources: string[]
  onAddKeyword: (keyword: string) => void
  onRemoveKeyword: (keyword: string) => void
  onAddSource: (source: string) => void
  onRemoveSource: (source: string) => void
}

export default function SearchSettings({
  keywords,
  sources,
  onAddKeyword,
  onRemoveKeyword,
  onAddSource,
  onRemoveSource,
}: SearchSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const [newSource, setNewSource] = useState('')

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault()
    if (newKeyword.trim()) {
      onAddKeyword(newKeyword.trim())
      setNewKeyword('')
    }
  }

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSource.trim()) {
      onAddSource(newSource.trim())
      setNewSource('')
    }
  }

  return (
    <div className="mb-4 border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-between transition"
      >
        <span className="font-semibold text-gray-700">⚙️ Search Settings</span>
        <span className="text-gray-500 text-sm">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4 bg-white">
          {/* Keywords Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Keywords/Topics ({keywords.length})
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              Articles must contain at least one of these keywords
            </p>

            <form onSubmit={handleAddKeyword} className="flex gap-2 mb-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add keyword (e.g., credit union)"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
              >
                Add
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {keywords.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No keywords added yet</p>
              ) : (
                keywords.map((keyword, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    <span>"{keyword}"</span>
                    <button
                      onClick={() => onRemoveKeyword(keyword)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                      title="Remove keyword"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sources Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              News Sources ({sources.length})
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              Filter articles from specific news sources
            </p>

            <form onSubmit={handleAddSource} className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="Add source (e.g., PR Newswire)"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition"
              >
                Add
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {sources.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No sources added - showing all sources</p>
              ) : (
                sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    <span>{source}</span>
                    <button
                      onClick={() => onRemoveSource(source)}
                      className="text-green-600 hover:text-green-800 font-bold"
                      title="Remove source"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Current Query Preview */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Search Query Preview:</h3>
            <div className="p-3 bg-gray-50 rounded text-xs font-mono text-gray-700 break-words">
              {keywords.length > 0 ? (
                <>
                  ({keywords.map(k => `"${k}"`).join(' OR ')})
                  {sources.length > 0 && (
                    <> (source:{sources.map(s => `"${s}"`).join(' OR source:')})</>
                  )}
                </>
              ) : (
                <span className="text-gray-400">Add keywords to build your search query</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
