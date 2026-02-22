import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    console.log('Extracting from URL:', url)

    let actualUrl = url

    // Check if this is a Google News URL and extract the real article URL
    if (url.includes('news.google.com')) {
      console.log('Detected Google News URL, extracting real article URL...')

      try {
        // Fetch the Google News page
        const gnResponse = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 10000,
          maxRedirects: 0, // Don't follow redirects automatically
          validateStatus: (status) => status < 500, // Accept redirects
        })

        // Parse the HTML to find the actual article link
        const gnDom = new JSDOM(gnResponse.data)
        const document = gnDom.window.document

        // Try to find the article link in various ways
        // Method 1: Look for c-wiz data-n-a-sg attribute or similar
        const articleLink = document.querySelector('a[href^="http"]')?.getAttribute('href') ||
                          document.querySelector('a[rel="nofollow"]')?.getAttribute('href') ||
                          document.querySelector('[data-n-a-sg] a')?.getAttribute('href')

        if (articleLink && !articleLink.includes('google.com')) {
          actualUrl = articleLink
          console.log('Found actual article URL:', actualUrl)
        } else {
          // Method 2: Try to decode from the URL itself
          // Google News URLs sometimes have the actual URL encoded
          const match = url.match(/articles\/([^?]+)/)
          if (match) {
            console.log('Could not extract article URL from Google News page')
            return NextResponse.json(
              { error: 'This is a Google News redirect URL. Please try another article or source.' },
              { status: 500 }
            )
          }
        }
      } catch (gnError) {
        console.error('Error extracting from Google News:', gnError)
        // Continue with the original URL
      }
    }

    // Now fetch the actual article
    const response = await axios.get(actualUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 15000,
      maxRedirects: 10,
      validateStatus: (status) => status < 400,
    })

    const finalUrl = response.request?.res?.responseUrl || actualUrl
    console.log('Final URL:', finalUrl)
    console.log('Response status:', response.status)
    console.log('Content length:', response.data?.length)

    // Parse the HTML
    const dom = new JSDOM(response.data, { url: finalUrl })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()

    if (!article || !article.textContent) {
      console.error('Readability failed to extract content')
      console.log('Page title from DOM:', dom.window.document.title)
      console.log('Body text length:', dom.window.document.body?.textContent?.length)

      return NextResponse.json(
        {
          error: 'Could not extract article content from the page. The page may be behind a paywall or have anti-scraping protection.',
          finalUrl
        },
        { status: 500 }
      )
    }

    console.log('Successfully extracted article:', article.title)

    return NextResponse.json({
      title: article.title,
      content: article.textContent,
      excerpt: article.excerpt,
      htmlContent: article.content,
      finalUrl,
    })
  } catch (error) {
    console.error('Error extracting article:', error)

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: 'Failed to fetch the article page: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to extract article: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
