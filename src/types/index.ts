export type ContentType = 'event' | 'news'

export interface PortfolioItem {
  id: string
  slug: string
  title: string
  medium: string
  year: number
  category: string
  imageBlockId: string
  notionPageId: string
}

export interface ContentCard {
  id: string
  slug: string
  title: string
  type: ContentType
  date: string          // ISO 8601
  descriptor: string    // ≤120 chars, truncated server-side
  url?: string
}

export interface FeaturedItem {
  id: string
  title: string
  type: ContentType
  url: string
}
