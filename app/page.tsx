'use client'

import { useState, useEffect, useCallback } from 'react'
import ManualEntry from './components/ManualEntry'
import DateFilter from './components/DateFilter'
import SearchSettings from './components/SearchSettings'
import FeedManager from './components/FeedManager'

interface Article {
  title: string
  link: string
  pubDate: string
  content: string
  contentSnippet: string
  creator?: string
  feedSource?: string
}

interface Feed {
  id: string
  url: string
  name: string
}

interface ExtractedContent {
  title: string
  content: string
  excerpt: string
  htmlContent: string
}

interface RewriteStatus {
  status: 'idle' | 'extracting' | 'rewriting' | 'success' | 'error'
  message?: string
  rewrittenContent?: string
}

export default function Home() {
  const [mode, setMode] = useState<'rss' | 'manual'>('rss')
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [rewriteStatus, setRewriteStatus] = useState<RewriteStatus>({ status: 'idle' })
  const [rewrittenContent, setRewrittenContent] = useState('')

  // News Search
  const [dateFilter, setDateFilter] = useState<string>('all')

  // Search settings and feeds
  const [keywords, setKeywords] = useState<string[]>([])
  const [feeds, setFeeds] = useState<Feed[]>([])

  // Manual entry state
  const [manualRewrittenData, setManualRewrittenData] = useState<{
    title: string
    content: string
  } | null>(null)

  // Filter function - defined before useEffects
  const filterArticlesByDate = useCallback((articlesToFilter: Article[], filter: string) => {
    console.log('filterArticlesByDate called with:', {
      articlesCount: articlesToFilter?.length || 0,
      filter,
      sampleDate: articlesToFilter?.[0]?.pubDate
    })

    if (!articlesToFilter || articlesToFilter.length === 0) {
      console.log('No articles to filter')
      setFilteredArticles([])
      return
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    console.log('Today:', today.toISOString())

    let filtered = articlesToFilter

    switch (filter) {
      case 'today':
        filtered = articlesToFilter.filter(article => {
          const articleDate = new Date(article.pubDate)
          const articleDay = new Date(articleDate.getFullYear(), articleDate.getMonth(), articleDate.getDate())
          const matches = articleDay.getTime() === today.getTime()
          if (matches) console.log('Today match:', article.title, articleDate.toISOString())
          return matches
        })
        break

      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        filtered = articlesToFilter.filter(article => {
          const articleDate = new Date(article.pubDate)
          const articleDay = new Date(articleDate.getFullYear(), articleDate.getMonth(), articleDate.getDate())
          return articleDay.getTime() === yesterday.getTime()
        })
        break

      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        console.log('Week ago:', weekAgo.toISOString())
        filtered = articlesToFilter.filter(article => {
          const articleDate = new Date(article.pubDate)
          return articleDate >= weekAgo
        })
        break

      case 'month':
        const monthAgo = new Date(today)
        monthAgo.setDate(monthAgo.getDate() - 30)
        filtered = articlesToFilter.filter(article => {
          const articleDate = new Date(article.pubDate)
          return articleDate >= monthAgo
        })
        break

      default: // 'all'
        filtered = articlesToFilter
    }

    console.log('Filter result:', {
      filter,
      totalArticles: articlesToFilter.length,
      filteredCount: filtered.length,
      firstFiltered: filtered[0]?.title
    })
    setFilteredArticles(filtered)
  }, [])

  // Load news on mount and when filter changes
  // Load search settings and feeds from localStorage on mount
  useEffect(() => {
    const savedKeywords = localStorage.getItem('searchKeywords')
    const savedFeeds = localStorage.getItem('rssFeeds')

    if (savedKeywords) {
      setKeywords(JSON.parse(savedKeywords))
    } else {
      const defaultKeywords = ['credit union', 'NCUA']
      setKeywords(defaultKeywords)
      localStorage.setItem('searchKeywords', JSON.stringify(defaultKeywords))
    }

    if (savedFeeds) {
      setFeeds(JSON.parse(savedFeeds))
    } else {
      const defaultFeeds: Feed[] = [
        {
          id: '1',
          url: 'https://www.einpresswire.com/rss/industry/financial-services',
          name: 'EIN Presswire - Financial Services'
        },
        {
          id: '2',
          url: 'https://www.einpresswire.com/rss',
          name: 'EIN Presswire - All News'
        },
        {
          id: '3',
          url: 'http://www.prlog.org/rss.xml',
          name: 'PRLog - Press Releases'
        }
      ]
      setFeeds(defaultFeeds)
      localStorage.setItem('rssFeeds', JSON.stringify(defaultFeeds))
    }
  }, [])

  // Fetch articles when keywords or feeds change
  useEffect(() => {
    if (feeds.length > 0) {
      fetchArticles()
    }
  }, [keywords, feeds])

  // Apply date filter whenever articles or filter changes
  useEffect(() => {
    console.log('useEffect triggered - articles:', articles.length, 'filter:', dateFilter)
    filterArticlesByDate(articles, dateFilter)
  }, [articles, dateFilter, filterArticlesByDate])

  const fetchArticles = async () => {
    console.log('fetchArticles called with:', { keywords, feedCount: feeds.length })

    if (feeds.length === 0) {
      console.log('No feeds configured')
      return
    }

    setLoading(true)
    try {
      console.log('Fetching from RSS feeds...')

      const feedUrls = feeds.map(f => f.url)
      const response = await fetch('/api/fetch-rss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedUrls, keywords }),
      })
      const data = await response.json()
      console.log('API response:', data)

      if (data.error) {
        console.error('API error:', data.error)
        alert('Error fetching RSS feeds: ' + data.error)
        return
      }

      if (data.errors && data.errors.length > 0) {
        console.warn('Some feeds had errors:', data.errors)
      }

      console.log('Setting articles:', data.articles?.length || 0)
      setArticles(data.articles || [])
    } catch (error) {
      console.error('Fetch error:', error)
      alert('Failed to fetch articles: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddKeyword = (keyword: string) => {
    const updatedKeywords = [...keywords, keyword]
    setKeywords(updatedKeywords)
    localStorage.setItem('searchKeywords', JSON.stringify(updatedKeywords))
  }

  const handleRemoveKeyword = (keyword: string) => {
    const updatedKeywords = keywords.filter(k => k !== keyword)
    setKeywords(updatedKeywords)
    localStorage.setItem('searchKeywords', JSON.stringify(updatedKeywords))
  }

  const handleAddFeed = (url: string, name: string) => {
    const newFeed: Feed = {
      id: Date.now().toString(),
      url,
      name,
    }
    const updatedFeeds = [...feeds, newFeed]
    setFeeds(updatedFeeds)
    localStorage.setItem('rssFeeds', JSON.stringify(updatedFeeds))
  }

  const handleRemoveFeed = (id: string) => {
    const updatedFeeds = feeds.filter(f => f.id !== id)
    setFeeds(updatedFeeds)
    localStorage.setItem('rssFeeds', JSON.stringify(updatedFeeds))
  }

  const handleFilterChange = (newFilter: string) => {
    setDateFilter(newFilter)
    // Fetch will happen via useEffect
  }

  useEffect(() => {
    if (dateFilter) {
      fetchArticles()
    }
  }, [dateFilter])

  const handleSelectArticle = async (article: Article) => {
    console.log('Article selected:', article.title)
    setSelectedArticle(article)
    setRewriteStatus({ status: 'extracting', message: 'Extracting full article content from web page...' })
    setRewrittenContent('')
    setExtractedContent(null)

    try {
      console.log('Fetching article from URL:', article.link)
      const response = await fetch('/api/extract-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: article.link }),
      })

      const data = await response.json()
      console.log('Extract API response:', data)

      if (data.error) {
        console.error('Extract error:', data.error)
        setRewriteStatus({ status: 'error', message: 'Failed to extract article: ' + data.error })
        return
      }

      setExtractedContent(data)
      setRewriteStatus({ status: 'idle' })
      console.log('Article extracted successfully')
    } catch (error) {
      console.error('Extract error:', error)
      setRewriteStatus({
        status: 'error',
        message: 'Failed to extract article content: ' + error
      })
    }
  }

  const handleRewrite = async () => {
    if (!selectedArticle || !extractedContent) return

    setRewriteStatus({ status: 'rewriting', message: 'AI is rewriting the article...' })

    try {
      const response = await fetch('/api/rewrite-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: extractedContent.title || selectedArticle.title,
          content: extractedContent.content,
          link: selectedArticle.link,
        }),
      })

      const data = await response.json()

      if (data.error) {
        setRewriteStatus({ status: 'error', message: data.error })
        return
      }

      setRewrittenContent(data.rewrittenContent)
      setRewriteStatus({
        status: 'success',
        message: 'Article rewritten successfully!',
        rewrittenContent: data.rewrittenContent
      })
    } catch (error) {
      setRewriteStatus({
        status: 'error',
        message: 'Failed to rewrite article: ' + error
      })
    }
  }

  const handlePublishToWordPress = async () => {
    if (!rewrittenContent || !selectedArticle) return

    setRewriteStatus({ status: 'rewriting', message: 'Publishing to WordPress...' })

    try {
      const response = await fetch('/api/publish-wordpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: selectedArticle.title,
          content: rewrittenContent,
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

  // Manual entry handlers
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
        <h1 className="text-4xl font-bold text-slate-800 mb-6">RSS Article Rewriter</h1>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setMode('rss')
              setManualRewrittenData(null)
              setRewriteStatus({ status: 'idle' })
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              mode === 'rss'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            📰 RSS Feed
          </button>
          <button
            onClick={() => {
              setMode('manual')
              setSelectedArticle(null)
              setExtractedContent(null)
              setRewrittenContent('')
              setRewriteStatus({ status: 'idle' })
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              mode === 'manual'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            ✍️ Manual Entry
          </button>
        </div>

        {mode === 'rss' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Articles List */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-slate-700">Credit Union News</h2>
              <button
                onClick={fetchArticles}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 transition"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
              <p className="font-semibold text-green-900 mb-1">📡 Free Press Release Feeds</p>
              <p className="text-green-700">EIN Presswire + PRLog - Free, unlimited access</p>
              <p className="text-xs text-green-600 mt-1">✅ Real article URLs - content extraction works!</p>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Keywords ({keywords.length})</h3>
              <p className="text-xs text-gray-500 mb-2">Filtering articles that contain these keywords:</p>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    <span>"{keyword}"</span>
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const keyword = prompt('Enter keyword to filter by:')
                    if (keyword) handleAddKeyword(keyword)
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600"
                >
                  + Add Keyword
                </button>
              </div>
            </div>

            <FeedManager
              feeds={feeds}
              onAddFeed={handleAddFeed}
              onRemoveFeed={handleRemoveFeed}
            />

            <DateFilter
              selectedFilter={dateFilter}
              onFilterChange={handleFilterChange}
              articleCount={filteredArticles.length}
            />

            <div className="space-y-3 max-h-[400px] overflow-y-auto mt-4">
              {filteredArticles.length === 0 && !loading && (
                <p className="text-gray-500 text-center py-8">
                  {articles.length === 0 ? 'No articles found. Add RSS feeds below.' : 'No articles match the selected date filter.'}
                </p>
              )}

              {filteredArticles.map((article, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectArticle(article)}
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    selectedArticle === article
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow'
                  }`}
                >
                  <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2">{article.title}</h3>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="text-xs text-gray-600">
                      {new Date(article.pubDate).toLocaleDateString()}
                    </p>
                    {article.feedSource && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                        {article.feedSource}
                      </span>
                    )}
                    {selectedArticle === article && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Selected</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {article.contentSnippet || 'Click to extract full content...'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Article & Actions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-slate-700 mb-4">Article Details</h2>

            {!selectedArticle ? (
              <p className="text-gray-500 text-center py-8">Select an article from the list to rewrite it</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{selectedArticle.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Published: {new Date(selectedArticle.pubDate).toLocaleString()}
                  </p>
                  <a
                    href={selectedArticle.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    View Original Article →
                  </a>
                </div>

                {rewriteStatus.status === 'extracting' ? (
                  <div className="border-t pt-4">
                    <div className="bg-blue-50 p-4 rounded flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                      <span className="text-blue-700">Extracting full article content...</span>
                    </div>
                  </div>
                ) : extractedContent ? (
                  <>
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-slate-700 mb-2">
                        Extracted Content Preview:
                        <span className="text-xs text-gray-500 ml-2 font-normal">
                          ({extractedContent.content.length} characters)
                        </span>
                      </h4>
                      <div className="bg-gray-50 p-4 rounded max-h-64 overflow-y-auto border border-gray-200">
                        <div
                          className="article-content text-gray-700"
                          dangerouslySetInnerHTML={{
                            __html: extractedContent.htmlContent
                              ? extractedContent.htmlContent.substring(0, 1500) + (extractedContent.htmlContent.length > 1500 ? '...' : '')
                              : `<p>${extractedContent.content.substring(0, 800)}...</p>`
                          }}
                        />
                      </div>
                    </div>

                    {!rewrittenContent ? (
                      <button
                        onClick={handleRewrite}
                        disabled={rewriteStatus.status === 'rewriting'}
                        className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400 transition"
                      >
                        {rewriteStatus.status === 'rewriting' ? 'Rewriting with AI...' : 'Rewrite with AI'}
                      </button>
                    ) : (
                      <>
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-slate-700">
                              Rewritten Content:
                              <span className="text-xs text-green-600 ml-2 font-normal">
                                ✓ Ready to publish
                              </span>
                            </h4>
                          </div>
                          <div className="bg-green-50 p-4 rounded max-h-96 overflow-y-auto border border-green-200">
                            <div
                              className="article-content text-gray-800"
                              dangerouslySetInnerHTML={{ __html: rewrittenContent }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handlePublishToWordPress}
                            disabled={rewriteStatus.status === 'rewriting'}
                            className="flex-1 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 disabled:bg-gray-400 transition"
                          >
                            {rewriteStatus.status === 'rewriting' && rewriteStatus.message?.includes('Publishing')
                              ? 'Publishing...'
                              : 'Publish to WordPress'}
                          </button>
                          <button
                            onClick={handleRewrite}
                            disabled={rewriteStatus.status === 'rewriting'}
                            className="px-4 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 disabled:bg-gray-400 transition"
                          >
                            Rewrite Again
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : null}

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
        </div>
        ) : (
          // Manual Entry Mode
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
        )}
      </div>
    </main>
  )
}
