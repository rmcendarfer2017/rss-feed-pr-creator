import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RSS Article Rewriter',
  description: 'Rewrite RSS feed articles with AI and publish to WordPress',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  )
}
