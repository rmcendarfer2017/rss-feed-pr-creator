import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const brandVoice = process.env.BRAND_VOICE || 'Professional and engaging'

    const prompt = `You are an expert content writer tasked with rewriting articles while maintaining their core information and message.

BRAND VOICE:
${brandVoice}

ORIGINAL ARTICLE:
Title: ${title}
Content: ${content}

INSTRUCTIONS:
1. Rewrite BOTH the title and the article content completely in the brand voice described above
2. The new title should be engaging, SEO-friendly, and match the brand voice
3. Maintain all key facts, statistics, and important information in the content
4. Make the content engaging and well-structured with proper paragraphs
5. Keep the same general length as the original
6. Use HTML formatting (p tags, headings, lists) for the article content
7. Make sure the rewrite is original and not just minor word changes
8. Output your response in the following format EXACTLY:

TITLE: [Your rewritten title here]

CONTENT:
[Your rewritten HTML content here]

Do NOT use markdown code fences. Start with "TITLE:" and then provide the rewritten title on the same line. Then on a new line put "CONTENT:" followed by the HTML content.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    let response = message.content[0].type === 'text'
      ? message.content[0].text
      : ''

    // Remove markdown code fences if present
    response = response
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    // Parse the response to extract title and content
    const titleMatch = response.match(/TITLE:\s*(.+?)(?:\n|$)/i)
    const contentMatch = response.match(/CONTENT:\s*([\s\S]+?)$/i)

    if (!titleMatch || !contentMatch) {
      // Fallback: if format not followed, use original title and full response as content
      return NextResponse.json({
        rewrittenTitle: title,
        rewrittenContent: response,
      })
    }

    const rewrittenTitle = titleMatch[1].trim()
    let rewrittenContent = contentMatch[1].trim()

    // Clean up any remaining code fences
    rewrittenContent = rewrittenContent
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    return NextResponse.json({
      rewrittenTitle,
      rewrittenContent,
    })
  } catch (error) {
    console.error('Error rewriting article:', error)
    return NextResponse.json(
      { error: 'Failed to rewrite article: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
