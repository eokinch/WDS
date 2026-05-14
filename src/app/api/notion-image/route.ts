import { Client } from '@notionhq/client'
import { NextRequest } from 'next/server'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

const BLOCK_ID_RE = /^[a-f0-9-]{32,36}$/i

export async function GET(request: NextRequest) {
  const blockId = request.nextUrl.searchParams.get('blockId') ?? ''

  if (!BLOCK_ID_RE.test(blockId)) {
    return Response.json({ error: 'Invalid blockId' }, { status: 400 })
  }

  const blocksResponse = await notion.blocks.children.list({
    block_id: blockId,
  })

  const imageBlock = blocksResponse.results.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (block: any) => block.type === 'image'
  ) as any | undefined // eslint-disable-line @typescript-eslint/no-explicit-any

  if (!imageBlock) {
    return Response.json({ error: 'Image not found' }, { status: 404 })
  }

  const imageUrl: string =
    imageBlock.image.type === 'file'
      ? imageBlock.image.file.url
      : imageBlock.image.external.url

  const upstream = await fetch(imageUrl)
  const contentType = upstream.headers.get('Content-Type') ?? 'image/jpeg'

  return new Response(upstream.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3300, stale-while-revalidate=600',
    },
  })
}
