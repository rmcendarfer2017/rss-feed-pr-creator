import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { dateFilter = 'all', count = 50 } = await request.json()

    const apiKey = process.env.BRAVE_SEARCH_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'BRAVE_SEARCH_API_KEY not configured in environment variables' },
        { status: 500 }
      )
    }

    // Search query for credit union news from specific sources
    const searchQuery = '"credit union" (source:"PR Newswire" OR source:"Business Wire" OR source:"GlobeNewswire")'

    // Map date filter to Brave's freshness parameter
    let freshness = undefined
    switch (dateFilter) {
      case 'today':
        freshness = 'pd' // past day
        break
      case 'yesterday':
        freshness = 'pd' // past day (we'll filter on client)
        break
      case 'week':
        freshness = 'pw' // past week
        break
      case 'month':
        freshness = 'pm' // past month
        break
      default:
        freshness = undefined // all time
    }

    const params = new URLSearchParams({
      q: searchQuery,
      count: count.toString(),
      ...(freshness && { freshness }),
    })

    console.log('Brave Search query:', searchQuery)
    console.log('Freshness filter:', freshness)

    const response = await fetch(
      `https://api.search.brave.com/res/v1/news/search?${params}`,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Brave API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Brave API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Brave API response:', data.results?.length || 0, 'results')

    // Transform Brave results to our article format
    const articles = (data.results || []).map((result: any) => ({
      title: result.title || 'Untitled',
      link: result.url || '',
      pubDate: result.age || new Date().toISOString(),
      content: result.description || '',
      contentSnippet: result.description || '',
      creator: result.meta_url?.hostname || '',
      feedSource: result.meta_url?.hostname || 'Brave Search',
      thumbnail: result.thumbnail?.src || result.thumbnail || '',
    }))

    return NextResponse.json({
      articles,
      debug: {
        totalResults: articles.length,
        query: searchQuery,
        freshness,
      }
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
