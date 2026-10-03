import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Each request is stateless, so the model falls back on the same favorite moves every time.
// Picking a random combination per request forces the rewrites to vary while staying on brand.
const OPENINGS = [
  'Open with the single most surprising fact or number from the article, stated plainly.',
  'Open with a short, concrete scenario a real reader might find themselves in.',
  'Open by getting straight to the news in one crisp sentence — no warm-up.',
  'Open with a brief, specific detail or quote from the story, then zoom out.',
  'Open with a bold but defensible one-line take on why this story matters.',
  'Open by naming the problem or tension the story is really about.',
]

const FLAVORS = [
  'Keep humor very light this time: one dry, understated aside at most, and no pop culture references.',
  'Use one well-chosen pop culture reference that fits the topic naturally (avoid the obvious picks).',
  'Lean on one clever analogy from everyday life (cooking, home repair, travel, sports, weather, etc.) instead of pop culture.',
  'Let the wit come from sharp phrasing and wordplay rather than references or jokes.',
  'Play it mostly straight and clear; let warmth and plain-spoken confidence carry the voice instead of jokes.',
]

const STRUCTURES = [
  'Use a few short subheadings to break the piece into sections.',
  'Write it as flowing paragraphs with no subheadings.',
  'Include one short bulleted list where it genuinely helps the reader scan key points.',
  'Build the piece around a clear "what happened / why it matters / what comes next" flow, without labeling those sections literally.',
]

const CLOSINGS = [
  'End on a practical takeaway the reader can act on.',
  'End by looking ahead to what to watch for next.',
  'End on a crisp, confident final line — not a question, not a pun.',
  'End by bringing it back to the reader and what this means for them.',
]

const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)]

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const prompt = `You are an expert content writer tasked with rewriting articles while maintaining their core information and message.

BRAND VOICE — THIS IS HOW YOU MUST WRITE:
Casual and quick-witted, yet professional. Think of yourself as a smart, well-read friend explaining something interesting over coffee. Specifically:
- Keep the tone conversational and approachable — no corporate stiffness or buzzword soup
- Use wit sparingly and only where it fits — a witty aside, pop culture nod, or clever analogy is optional, not required
- Stay professional — humor should land naturally, never forced or cringy
- Use active voice and short, punchy sentences mixed with longer ones for rhythm
- Avoid jargon unless you explain it in plain English right after
- Be confident but not preachy — inform and entertain, don't lecture
- Write like a real person, not a press release
- Focus on practical, actionable insights — always put the reader's needs first

KEEP IT FRESH — AVOID REPETITIVE PATTERNS:
These rewrites are published side by side on the same site, so readers will notice if every article sounds the same. Stay on brand, but avoid these overused moves:
- Openers like "Picture this," "Imagine," "Let's be honest," "Here's the thing," "Buckle up," or opening with a rhetorical question
- Stock phrases like "plot twist," "spoiler alert," "game-changer," "the bottom line," "in today's fast-paced world," "let's dive in," "it's no secret," or "but wait, there's more"
- Go-to references like Taylor Swift, Marvel, Star Wars, Friends, The Office, Netflix binge-watching, or "Swiss Army knife"
- Ending with a pun, a rhetorical question, or a "So, what's the takeaway?" wrap-up
- The "It's not just X — it's Y" construction, or stacking three adjectives in a row
- More than one pop culture reference in a single article (zero is fine)
Let the specifics of THIS story drive the voice. An anecdote or analogy should feel like it could only belong to this article.

STYLE DIRECTION FOR THIS ARTICLE:
- ${pick(OPENINGS)}
- ${pick(FLAVORS)}
- ${pick(STRUCTURES)}
- ${pick(CLOSINGS)}

ORIGINAL ARTICLE:
Title: ${title}
Content: ${content}

INSTRUCTIONS:
1. Rewrite BOTH the title and the article content completely in the brand voice described above
2. The new title should be engaging, SEO-friendly, and match the brand voice — make it catchy
3. Maintain all key facts, statistics, and important information in the content
4. Make the content engaging and well-structured with proper paragraphs
5. Keep the same general length as the original
6. Use HTML formatting (p tags, headings, lists) for the article content
7. Make sure the rewrite is original and not just minor word changes — this should feel like a completely different writer covered the same story
8. Output your response in the following format EXACTLY:

TITLE: [Your rewritten title here]

CONTENT:
[Your rewritten HTML content here]

Do NOT use markdown code fences. Start with "TITLE:" and then provide the rewritten title on the same line. Then on a new line put "CONTENT:" followed by the HTML content.`

    const message = await client.beta.messages.create({
      model: 'claude-sonnet-5-5',
      // Thinking counts toward max_tokens, so leave room beyond the article itself
      max_tokens: 16000,
      output_config: { effort: 'low' },
      // If Sonnet 5.5's safety filters decline a request, retry it on a fallback model
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    if (message.stop_reason === 'refusal') {
      return NextResponse.json(
        { error: 'The model declined to rewrite this article. Try editing the content and resubmitting.' },
        { status: 422 }
      )
    }

    // The response can start with a thinking block, so find the text block by type
    let response = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')

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
