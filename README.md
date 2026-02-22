# RSS Article Rewriter

A Next.js web application that fetches articles from an RSS feed, rewrites them using Claude AI with a specific brand voice, and publishes them to WordPress as drafts.

## Features

- 📰 **RSS Feed Mode**: Fetch and display articles from any XML RSS feed
- 📚 **Multiple Feed Management**: Add, save, and manage multiple RSS feeds
- 📅 **Date Filtering**: Filter articles by Today, Yesterday, Last 7 Days, Last 30 Days, or All Time
- 🌐 Automatic full-text extraction from article URLs (handles limited RSS feeds)
- ✍️ **Manual Entry Mode**: Paste article title and content directly
- 🤖 AI-powered article rewriting using Claude API with custom brand voice
- 🎯 Smart title rewriting in manual mode
- 📝 Automatic publishing to WordPress as draft posts
- 🔄 Batch processing with "Add Another Article" button
- 💾 Feed preferences saved in browser localStorage
- 🏷️ Feed source badges on each article
- 🎨 Modern, responsive UI built with Next.js and Tailwind CSS
- ⚡ Real-time article selection and processing

## Prerequisites

Before you begin, make sure you have:

1. **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
2. **Anthropic API Key** - [Get one here](https://console.anthropic.com/)
3. **WordPress Site** with:
   - REST API enabled (enabled by default in modern WordPress)
   - An Application Password for API access

## WordPress Setup

To create an Application Password for WordPress:

1. Log in to your WordPress admin dashboard
2. Go to **Users → Profile**
3. Scroll down to **Application Passwords**
4. Enter a name (e.g., "RSS Rewriter App")
5. Click **Add New Application Password**
6. Copy the generated password (you won't be able to see it again!)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.local.example .env.local
   ```

3. **Configure your `.env.local` file:**
   ```env
   # Anthropic Claude API
   ANTHROPIC_API_KEY=sk-ant-your-api-key-here

   # WordPress Configuration
   WORDPRESS_SITE_URL=https://your-wordpress-site.com
   WORDPRESS_USERNAME=your_wordpress_username
   WORDPRESS_APP_PASSWORD=your_application_password

   # RSS Feed URL
   RSS_FEED_URL=https://example.com/feed.xml

   # Brand Voice
   BRAND_VOICE="Your brand voice description here. Be specific about tone, style, and any guidelines."
   ```

## Usage

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Using the application:**

   **RSS Feed Mode:**
   - Click "+ Add Feed" to add RSS feed URLs (saved automatically)
   - Remove feeds by clicking the ✕ button next to each feed
   - Use the date filter to show articles from specific time periods
   - Articles from all feeds are combined and sorted by date
   - Click on any article to select it
   - The app automatically extracts the full article content from the web page
   - Click "Rewrite with AI" to have Claude rewrite the article with your brand voice
   - Review the rewritten content
   - Click "Publish to WordPress" to save it as a draft on your WordPress site

   **Manual Entry Mode:**
   - Click the "✍️ Manual Entry" tab
   - Paste your article title
   - Paste the article content
   - Click "Rewrite with AI" - Claude will rewrite both title and content
   - Review the rewritten article
   - Click "Publish to WordPress" to save as a draft
   - Click "Add Another Article" to quickly process more articles

## How It Works

### RSS Feed Mode
The application follows a smart workflow to handle multiple RSS feeds:

1. **Feed Management**: Add multiple RSS feed URLs, automatically saved to browser storage
2. **Aggregation**: Fetches articles from all feeds and combines them
3. **Date Filtering**: Filter combined articles by publication date (Today, Last 7 days, etc.)
4. **Content Extraction**: When you select an article, it visits the actual web page and extracts the full article text using Mozilla Readability (removes ads, navigation, etc.)
5. **AI Rewriting**: Claude AI rewrites the complete article using your custom brand voice
6. **WordPress Publishing**: Saves the rewritten content as a draft post

This approach solves the common problem where RSS feeds only contain snippets or summaries instead of full article text, while allowing you to monitor multiple sources.

### Manual Entry Mode
Perfect for when you want to manually curate content:

1. **Paste Content**: Enter title and article content
2. **AI Rewriting**: Claude rewrites both the title and content in your brand voice
3. **WordPress Publishing**: Creates draft post with rewritten content
4. **Batch Processing**: "Add Another Article" button lets you quickly process multiple articles

## Brand Voice Customization

The `BRAND_VOICE` environment variable controls how Claude rewrites your articles. Be specific about:

- Writing style (formal, casual, professional, conversational)
- Tone (confident, friendly, authoritative, helpful)
- Special requirements (avoid jargon, use active voice, etc.)
- Target audience
- Any specific formatting preferences

Example:
```
BRAND_VOICE="We write in a professional yet approachable tone. Our content is clear and concise, avoiding unnecessary jargon. We use active voice and focus on actionable insights. We're confident but never arrogant, and always put the reader's needs first."
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── fetch-rss/         # Multi-feed RSS fetching endpoint
│   │   ├── extract-article/   # Web scraping & content extraction
│   │   ├── rewrite-article/   # Claude AI rewriting (RSS mode)
│   │   ├── rewrite-manual/    # Claude AI rewriting (manual mode with title)
│   │   └── publish-wordpress/ # WordPress publishing with image upload
│   ├── components/
│   │   ├── ManualEntry.tsx    # Manual entry form component
│   │   ├── FeedManager.tsx    # RSS feed management component
│   │   └── DateFilter.tsx     # Date filtering component
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main application UI with tabs
│   └── globals.css            # Global styles
├── .env.local.example         # Environment variables template
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Troubleshooting

### RSS Feed Not Loading
- Verify the RSS feed URL is correct and accessible
- Check if the feed is valid XML
- Some feeds may require CORS configuration

### Content Extraction Fails
- Some websites may block automated content extraction
- Try opening the article URL in your browser to verify it's accessible
- Certain paywalled or login-required sites won't work
- Some sites may have anti-scraping measures

### Claude API Errors
- Verify your API key is correct
- Check your Anthropic account has sufficient credits
- Ensure you're not hitting rate limits

### WordPress Publishing Fails
- Verify your WordPress site URL doesn't have a trailing slash
- Confirm the Application Password is correct (copy-paste carefully)
- Check that your WordPress user has permission to create posts
- Ensure WordPress REST API is accessible (visit `your-site.com/wp-json/wp/v2`)

## Building for Production

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Yes |
| `WORDPRESS_SITE_URL` | Your WordPress site URL (no trailing slash) | Yes |
| `WORDPRESS_USERNAME` | WordPress username | Yes |
| `WORDPRESS_APP_PASSWORD` | WordPress application password | Yes |
| `RSS_FEED_URL` | RSS feed URL to fetch articles from | Yes |
| `BRAND_VOICE` | Description of your brand voice for AI rewriting | Yes |

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Anthropic Claude API** - AI article rewriting with custom brand voice
- **WordPress REST API** - Content publishing
- **rss-parser** - RSS feed parsing
- **@mozilla/readability** - Article content extraction from web pages
- **jsdom** - HTML parsing for content extraction

## License

MIT

## Support

For issues or questions, please create an issue in the GitHub repository.
