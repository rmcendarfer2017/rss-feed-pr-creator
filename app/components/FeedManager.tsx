'use client'

import { useState } from 'react'

interface Feed {
  id: string
  url: string
  name: string
}

interface FeedManagerProps {
  feeds: Feed[]
  onAddFeed: (url: string, name: string) => void
  onRemoveFeed: (id: string) => void
}

export default function FeedManager({ feeds, onAddFeed, onRemoveFeed }: FeedManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [newFeedName, setNewFeedName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFeedUrl.trim()) return

    const name = newFeedName.trim() || new URL(newFeedUrl).hostname
    onAddFeed(newFeedUrl.trim(), name)

    setNewFeedUrl('')
    setNewFeedName('')
    setIsAdding(false)
  }

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-slate-700">RSS Feeds ({feeds.length})</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          {isAdding ? 'Cancel' : '+ Add Feed'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
          <input
            type="url"
            value={newFeedUrl}
            onChange={(e) => setNewFeedUrl(e.target.value)}
            placeholder="RSS Feed URL (required)"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <input
            type="text"
            value={newFeedName}
            onChange={(e) => setNewFeedName(e.target.value)}
            placeholder="Feed Name (optional)"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="w-full py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition"
          >
            Add Feed
          </button>
        </form>
      )}

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {feeds.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4">No feeds added yet</p>
        ) : (
          feeds.map((feed) => (
            <div
              key={feed.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200 hover:border-gray-300 transition"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{feed.name}</p>
                <p className="text-xs text-gray-500 truncate">{feed.url}</p>
              </div>
              <button
                onClick={() => onRemoveFeed(feed.id)}
                className="ml-2 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition"
                title="Remove feed"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
