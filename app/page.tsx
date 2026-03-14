'use client'

import { useState } from 'react'
import ManualEntry from './components/ManualEntry'

interface RewriteStatus {
  status: 'idle' | 'extracting' | 'rewriting' | 'success' | 'error'
  message?: string
}

export default function Home() {
  const [rewriteStatus, setRewriteStatus] = useState<RewriteStatus>({ status: 'idle' })
  const [manualRewrittenData, setManualRewrittenData] = useState<{
    title: string
    content: string
  } | null>(null)

  const handleManualRewrite = async (data: { title: string; content: string }) => {
    setRewriteStatus({ status: 'rewriting', message: 'AI is rewriting the article and title...' })

    try {
      const response = await fetch('/api/rewrite-manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
        }),
      })

      const result = await response.json()

      if (result.error) {
        setRewriteStatus({ status: 'error', message: result.error })
        return
      }

      setManualRewrittenData({
        title: result.rewrittenTitle,
        content: result.rewrittenContent,
      })
      setRewriteStatus({
        status: 'success',
        message: 'Article and title rewritten successfully!'
      })
    } catch (error) {
      setRewriteStatus({
        status: 'error',
        message: 'Failed to rewrite: ' + error
      })
    }
  }

  const handleManualPublish = async () => {
    if (!manualRewrittenData) return

    setRewriteStatus({ status: 'rewriting', message: 'Publishing to WordPress...' })

    try {
      const response = await fetch('/api/publish-wordpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: manualRewrittenData.title,
          content: manualRewrittenData.content,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setRewriteStatus({ status: 'error', message: data.error })
        return
      }

      setRewriteStatus({
        status: 'success',
        message: `Article published as draft! WordPress Post ID: ${data.postId}`
      })
    } catch (error) {
      setRewriteStatus({
        status: 'error',
        message: 'Failed to publish to WordPress: ' + error
      })
    }
  }

  const handleManualRewriteAgain = () => {
    setManualRewrittenData(null)
    setRewriteStatus({ status: 'idle' })
  }

  const handleAddAnother = () => {
    setManualRewrittenData(null)
    setRewriteStatus({ status: 'idle' })
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-800 mb-6">Article Rewriter</h1>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-slate-700 mb-4">
              Manual Article Entry
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Paste your article title and content. The AI will rewrite both, then you can publish to WordPress as a draft.
            </p>
            <ManualEntry
              onRewrite={handleManualRewrite}
              rewriteStatus={rewriteStatus}
              rewrittenData={manualRewrittenData}
              onPublish={handleManualPublish}
              onRewriteAgain={handleManualRewriteAgain}
              onAddAnother={handleAddAnother}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
