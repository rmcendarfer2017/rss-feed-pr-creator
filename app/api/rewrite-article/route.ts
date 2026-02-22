import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { title, content, link } = await request.json()

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
URL: ${link}
Content: ${content}

INSTRUCTIONS:
1. Rewrite this article completely in the brand voice described above
2. Maintain all key facts, statistics, and important information
3. Make the content engaging and well-structured with proper paragraphs
4. Keep the same general length as the original
5. Use HTML formatting (p tags, headings, lists) for the final output
6. Do NOT include the title in your response - only the article body content
7. Make sure the rewrite is original and not just minor word changes
8. Output ONLY the HTML content - do NOT wrap it in markdown code fences or any other formatting

Your response should start directly with HTML tags (like <p> or <h2>) and contain no other text before or after.`

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

    let rewrittenContent = message.content[0].type === 'text'
      ? message.content[0].text
      : ''

    // Remove markdown code fences if present
    rewrittenContent = rewrittenContent
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    return NextResponse.json({ rewrittenContent })
  } catch (error) {
    console.error('Error rewriting article:', error)
    return NextResponse.json(
      { error: 'Failed to rewrite article: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
