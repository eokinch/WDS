import type { Metadata } from 'next'
import { Playfair_Display, Libre_Baskerville } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const baskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-baskerville',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Williams Design Studio',
  description: 'Portfolio and studio information for Williams Design Studio.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${baskerville.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
