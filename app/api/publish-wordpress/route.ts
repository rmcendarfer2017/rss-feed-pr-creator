import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const { title, content, imageUrl } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const wpSiteUrl = process.env.WORDPRESS_SITE_URL
    const wpUsername = process.env.WORDPRESS_USERNAME
    const wpAppPassword = process.env.WORDPRESS_APP_PASSWORD

    if (!wpSiteUrl || !wpUsername || !wpAppPassword) {
      return NextResponse.json(
        { error: 'WordPress credentials not configured in environment variables' },
        { status: 500 }
      )
    }

    // Create Basic Auth header
    const authHeader = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString('base64')

    let featuredMediaId: number | undefined

    // If image URL is provided, upload it to WordPress media library
    if (imageUrl) {
      try {
        // Download the image
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        })

        const imageBuffer = Buffer.from(imageResponse.data)
        const contentType = imageResponse.headers['content-type'] || 'image/jpeg'

        // Extract filename from URL or generate one
        const urlParts = imageUrl.split('/')
        const filename = urlParts[urlParts.length - 1].split('?')[0] || 'featured-image.jpg'

        // Upload to WordPress media library
        const mediaUrl = `${wpSiteUrl}/wp-json/wp/v2/media`
        const mediaResponse = await axios.post(
          mediaUrl,
          imageBuffer,
          {
            headers: {
              'Authorization': `Basic ${authHeader}`,
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          }
        )

        featuredMediaId = mediaResponse.data.id
      } catch (imageError) {
        console.error('Error uploading featured image:', imageError)
        // Continue without featured image if upload fails
      }
    }

    // WordPress REST API endpoint for creating posts
    const apiUrl = `${wpSiteUrl}/wp-json/wp/v2/posts`

    const postData: any = {
      title: title,
      content: content,
      status: 'draft', // Save as draft
    }

    // Add featured image if successfully uploaded
    if (featuredMediaId) {
      postData.featured_media = featuredMediaId
    }

    const response = await axios.post(
      apiUrl,
      postData,
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json({
      success: true,
      postId: response.data.id,
      postUrl: response.data.link,
      featuredImageUploaded: !!featuredMediaId,
    })
  } catch (error) {
    console.error('Error publishing to WordPress:', error)

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          error: 'Failed to publish to WordPress: ' +
            (error.response?.data?.message || error.message)
        },
        { status: error.response?.status || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to publish to WordPress: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
