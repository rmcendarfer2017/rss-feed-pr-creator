'use client'

import { useState } from 'react'

interface ManualEntryProps {
  onRewrite: (data: { title: string; content: string }) => void
  rewriteStatus: {
    status: 'idle' | 'extracting' | 'rewriting' | 'success' | 'error'
    message?: string
  }
  rewrittenData: {
    title: string
    content: string
  } | null
  onPublish: () => void
  onRewriteAgain: () => void
  onAddAnother: () => void
}

export default function ManualEntry({
  onRewrite,
  rewriteStatus,
  rewrittenData,
  onPublish,
  onRewriteAgain,
  onAddAnother,
}: ManualEntryProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      alert('Please provide at least a title and content')
      return
    }
    onRewrite({ title, content })
  }

  const handleAddAnother = () => {
    setTitle('')
    setContent('')
    onAddAnother()
  }

  const isFormValid = title.trim() && content.trim()

  return (
    <div className="space-y-6">
      {!rewrittenData ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
              Article Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter the article title..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={rewriteStatus.status === 'rewriting'}
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-semibold text-slate-700 mb-2">
              Article Content *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the article content here..."
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              disabled={rewriteStatus.status === 'rewriting'}
            />
          </div>

          <button
            type="submit"
            disabled={!isFormValid || rewriteStatus.status === 'rewriting'}
            className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400 transition"
          >
            {rewriteStatus.status === 'rewriting' ? 'Rewriting with AI...' : 'Rewrite with AI'}
          </button>

          {rewriteStatus.message && rewriteStatus.status === 'error' && (
            <div className="p-3 rounded bg-red-100 text-red-700">
              {rewriteStatus.message}
            </div>
          )}
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Original</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-blue-700 font-medium">Title:</p>
                <p className="text-sm text-gray-800">{title}</p>
              </div>
              <div>
                <p className="text-xs text-blue-700 font-medium">Content Preview:</p>
                <p className="text-sm text-gray-800 line-clamp-3">{content}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded border border-green-200">
            <h3 className="text-sm font-semibold text-green-900 mb-3">
              AI Rewritten ✓
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-green-700 font-medium mb-1">New Title:</p>
                <p className="text-base font-semibold text-gray-900">{rewrittenData.title}</p>
              </div>
              <div>
                <p className="text-xs text-green-700 font-medium mb-1">New Content:</p>
                <div className="bg-white p-3 rounded max-h-96 overflow-y-auto border border-green-300">
                  <div
                    className="article-content text-gray-800"
                    dangerouslySetInnerHTML={{ __html: rewrittenData.content }}
                  />
                </div>
              </div>
            </div>
          </div>

          {rewriteStatus.status === 'success' && rewriteStatus.message?.includes('published') ? (
            // Show "Add Another" button after successful publish
            <div className="space-y-3">
              <button
                onClick={handleAddAnother}
                className="w-full py-4 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition shadow-lg"
              >
                ➕ Add Another Article
              </button>
              <p className="text-center text-sm text-gray-600">
                Article successfully published! Ready to add another?
              </p>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onPublish}
                disabled={rewriteStatus.status === 'rewriting'}
                className="flex-1 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 disabled:bg-gray-400 transition"
              >
                {rewriteStatus.status === 'rewriting' && rewriteStatus.message?.includes('Publishing')
                  ? 'Publishing...'
                  : 'Publish to WordPress'}
              </button>
              <button
                onClick={onRewriteAgain}
                disabled={rewriteStatus.status === 'rewriting'}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 disabled:bg-gray-400 transition"
              >
                Start Over
              </button>
            </div>
          )}

          {rewriteStatus.message && (
            <div
              className={`p-3 rounded ${
                rewriteStatus.status === 'error'
                  ? 'bg-red-100 text-red-700'
                  : rewriteStatus.status === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {rewriteStatus.message}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
