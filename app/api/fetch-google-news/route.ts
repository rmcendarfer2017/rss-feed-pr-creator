import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'

const parser = new Parser({
  customFields: {
    item: ['source']
  }
})

export async function POST(request: NextRequest) {
  try {
    const { keywords = [], sources = [] } = await request.json()

    // Build search query dynamically
    let queryParts = []

    // Add keywords (OR logic - match any keyword)
    if (keywords.length > 0) {
      const keywordQuery = keywords.map((k: string) => `"${k}"`).join(' OR ')
      queryParts.push(`(${keywordQuery})`)
    }

    // Add sources (OR logic - match any source)
    if (sources.length > 0) {
      const sourceQuery = sources.map((s: string) => `source:"${s}"`).join(' OR ')
      queryParts.push(`(${sourceQuery})`)
    }

    // If no keywords or sources, use a default
    if (queryParts.length === 0) {
      queryParts.push('"news"')
    }

    const searchQuery = encodeURIComponent(queryParts.join(' '))
    const feedUrl = `https://news.google.com/rss/search?q=${searchQuery}&hl=en-US&gl=US&ceid=US:en`

    console.log('Fetching Google News RSS:', feedUrl)

    const feed = await parser.parseURL(feedUrl)
    console.log(`Google News feed parsed. Items found: ${feed.items?.length || 0}`)

    if (!feed.items || feed.items.length === 0) {
      console.warn('No items found in Google News feed')
      return NextResponse.json({ articles: [] })
    }

    const articles = feed.items.map(item => {
      // Try to extract the actual article URL from the item
      // Google News often includes it in the guid or other fields
      let actualLink = item.link || ''

      // Check if there's a guid that looks like a real URL
      if (item.guid && !item.guid.includes('google.com')) {
        actualLink = item.guid
      }

      // Some RSS items have the actual URL in different fields
      const alternateLink = (item as any)['feedburner:origLink'] ||
                           (item as any).origLink ||
                           (item as any)['atom:link']

      if (alternateLink && !alternateLink.includes('google.com')) {
        actualLink = alternateLink
      }

      console.log('Article link:', {
        title: item.title?.substring(0, 50),
        link: item.link,
        guid: item.guid,
        actualLink
      })

      return {
        title: item.title || 'Untitled',
        link: actualLink,
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        content: item.content || item.contentSnippet || '',
        contentSnippet: item.contentSnippet || item.content?.substring(0, 200) || '',
        creator: (item as any).creator || (item as any).author || '',
        feedSource: item.source?.['_'] || 'Google News',
      }
    })

    console.log(`Processed ${articles.length} articles from Google News`)

    // Sort by date (newest first)
    articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

    return NextResponse.json({
      articles,
      debug: {
        totalArticles: articles.length,
        feedUrl,
        keywords,
        sources,
      }
    })
  } catch (error) {
    console.error('Error fetching Google News:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Google News: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
