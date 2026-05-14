import { Client, isFullPage } from '@notionhq/client'
import { unstable_cache } from 'next/cache'
import type { PortfolioItem, ContentCard, FeaturedItem, ContentType } from '@/types'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

// Type assertions are necessary at the Notion SDK boundary — all access is
// via these typed helper functions, so `any` is isolated to this file only.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = Record<string, any>

function getRichText(props: Props, key: string): string {
  const p = props[key]
  return p?.type === 'rich_text' ? (p.rich_text?.[0]?.plain_text ?? '') : ''
}

function getTitle(props: Props, key: string): string {
  const p = props[key]
  return p?.type === 'title' ? (p.title?.[0]?.plain_text ?? '') : ''
}

function getNumber(props: Props, key: string): number {
  const p = props[key]
  return p?.type === 'number' ? (p.number ?? 0) : 0
}

function getSelect(props: Props, key: string): string {
  const p = props[key]
  return p?.type === 'select' ? (p.select?.name ?? '') : ''
}

function getDate(props: Props, key: string): string {
  const p = props[key]
  return p?.type === 'date' ? (p.date?.start ?? '') : ''
}

function getUrl(props: Props, key: string): string | undefined {
  const p = props[key]
  return p?.type === 'url' ? (p.url ?? undefined) : undefined
}

function getCheckbox(props: Props, key: string): boolean {
  const p = props[key]
  return p?.type === 'checkbox' ? (p.checkbox ?? false) : false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapNotionToPortfolioItem(page: any): PortfolioItem {
  const props: Props = page.properties
  return {
    id: page.id,
    slug: getRichText(props, 'slug'),
    title: getTitle(props, 'title'),
    medium: getRichText(props, 'medium'),
    year: getNumber(props, 'year'),
    category: getSelect(props, 'category'),
    // imageBlockId = page ID; the proxy (Story 1.5) fetches a fresh image URL
    // via notion.blocks.children.list({ block_id }) — S3 URLs never stored here
    imageBlockId: page.id,
    notionPageId: page.id,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapNotionToContentCard(page: any): ContentCard {
  const props: Props = page.properties
  const rawDescriptor = getRichText(props, 'descriptor')
  const descriptor =
    rawDescriptor.length > 120 ? rawDescriptor.slice(0, 120) + '…' : rawDescriptor
  const rawType = getSelect(props, 'type')
  const type: ContentType = rawType === 'news' ? 'news' : 'event'

  return {
    id: page.id,
    // Content DB has no slug property; page ID is a stable UUID used as key
    slug: page.id,
    title: getTitle(props, 'title'),
    type,
    date: getDate(props, 'date'),
    descriptor,
    url: getUrl(props, 'url'),
  }
}

export const getPortfolioItems = unstable_cache(
  async (): Promise<PortfolioItem[]> => {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DB_PORTFOLIO!,
      filter: { property: 'published', checkbox: { equals: true } },
    })
    return response.results.filter(isFullPage).map(mapNotionToPortfolioItem)
  },
  ['portfolio-items'],
  { tags: ['portfolio'] }
)

export async function getPortfolioItemBySlug(
  slug: string
): Promise<PortfolioItem | null> {
  return unstable_cache(
    async () => {
      const response = await notion.databases.query({
        database_id: process.env.NOTION_DB_PORTFOLIO!,
        filter: {
          and: [
            { property: 'published', checkbox: { equals: true } },
            { property: 'slug', rich_text: { equals: slug } },
          ],
        },
      })
      const page = response.results.find(isFullPage)
      return page ? mapNotionToPortfolioItem(page) : null
    },
    [`portfolio-item-${slug}`],
    { tags: ['portfolio'] }
  )()
}

export const getContentItems = unstable_cache(
  async (): Promise<ContentCard[]> => {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DB_CONTENT!,
      filter: { property: 'published', checkbox: { equals: true } },
      sorts: [{ property: 'date', direction: 'ascending' }],
    })
    return response.results.filter(isFullPage).map(mapNotionToContentCard)
  },
  ['content-items'],
  { tags: ['content'] }
)

export const getFeaturedItem = unstable_cache(
  async (): Promise<FeaturedItem | null> => {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DB_CONTENT!,
      filter: {
        and: [
          { property: 'published', checkbox: { equals: true } },
          { property: 'featured', checkbox: { equals: true } },
        ],
      },
      page_size: 1,
    })
    const page = response.results.find(isFullPage)
    if (!page) return null
    const props: Props = page.properties
    const rawType = getSelect(props, 'type')
    const type: ContentType = rawType === 'news' ? 'news' : 'event'
    return {
      id: page.id,
      title: getTitle(props, 'title'),
      type,
      url: getUrl(props, 'url') ?? '',
    }
  },
  ['featured-item'],
  { tags: ['featured'] }
)
