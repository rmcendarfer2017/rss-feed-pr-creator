import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: ['media:content', 'enclosure']
  }
})

export async function POST(request: NextRequest) {
  try {
    const { feedUrls, keywords = [] } = await request.json()

    if (!feedUrls || !Array.isArray(feedUrls) || feedUrls.length === 0) {
      return NextResponse.json(
        { error: 'No RSS feeds provided' },
        { status: 400 }
      )
    }

    // Fetch articles from all feeds
    const allArticles = []
    const errors = []

    for (const feedUrl of feedUrls) {
      try {
        console.log(`Fetching feed: ${feedUrl}`)
        const feed = await parser.parseURL(feedUrl)
        console.log(`Feed parsed successfully. Items found: ${feed.items?.length || 0}`)

        if (!feed.items || feed.items.length === 0) {
          console.warn(`No items found in feed: ${feedUrl}`)
          errors.push(`No items in feed: ${feedUrl}`)
          continue
        }

        const feedHostname = new URL(feedUrl).hostname

        const articles = feed.items.map(item => ({
          title: item.title || 'Untitled',
          link: item.link || '',
          pubDate: item.pubDate || new Date().toISOString(),
          content: item.content || item.contentSnippet || '',
          contentSnippet: item.contentSnippet || '',
          creator: item.creator || item.author || '',
          feedSource: feedHostname,
        }))

        console.log(`Processed ${articles.length} articles from ${feedHostname}`)
        allArticles.push(...articles)
      } catch (feedError) {
        const errorMsg = `Error fetching feed ${feedUrl}: ${(feedError as Error).message}`
        console.error(errorMsg, feedError)
        errors.push(errorMsg)
        // Continue with other feeds even if one fails
      }
    }

    console.log(`Total articles fetched: ${allArticles.length}`)
    if (errors.length > 0) {
      console.error('Feed errors:', errors)
    }

    // Filter by keywords if provided
    let filteredArticles = allArticles
    if (keywords.length > 0) {
      console.log('Filtering by keywords:', keywords)
      filteredArticles = allArticles.filter(article => {
        const searchText = `${article.title} ${article.contentSnippet} ${article.content}`.toLowerCase()
        return keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
      })
      console.log(`Filtered from ${allArticles.length} to ${filteredArticles.length} articles`)
    }

    // Sort by date (newest first)
    filteredArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

    return NextResponse.json({
      articles: filteredArticles,
      errors: errors.length > 0 ? errors : undefined,
      debug: {
        totalFeeds: feedUrls.length,
        totalArticles: allArticles.length,
        filteredArticles: filteredArticles.length,
        keywords,
      }
    })
  } catch (error) {
    console.error('Error fetching RSS feeds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RSS feeds: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
