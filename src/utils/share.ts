import type { BookcaseNames, BookshelfBook, SharedBookshelf } from '../types/book'
import { normalizeCoverUrl } from './url'

interface CompactSharePayload {
  v: 1
  n: BookcaseNames
  b: Array<[string, string[], string, number, number, number]>
}

const MAX_SHARED_BOOKS = 300
const MAX_PAYLOAD_LENGTH = 100_000

const bytesToBase64Url = (bytes: Uint8Array): string => {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 8192) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const base64UrlToBytes = (value: string): Uint8Array => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

const streamToBytes = async (stream: ReadableStream<Uint8Array>): Promise<Uint8Array> => {
  const chunks: Uint8Array[] = []
  let length = 0
  const reader = stream.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    length += value.length
  }
  const result = new Uint8Array(length)
  let offset = 0
  chunks.forEach((chunk) => { result.set(chunk, offset); offset += chunk.length })
  return result
}

const compress = async (text: string): Promise<string> => {
  const bytes = new TextEncoder().encode(text)
  if (typeof CompressionStream === 'undefined') return `j.${bytesToBase64Url(bytes)}`
  const compressed = await streamToBytes(new Blob([bytes.slice().buffer]).stream().pipeThrough(new CompressionStream('gzip')))
  return `g.${bytesToBase64Url(compressed)}`
}

const decompress = async (encoded: string): Promise<string> => {
  if (encoded.length > MAX_PAYLOAD_LENGTH) throw new Error('共有リンクが大きすぎます。')
  const [format, data] = [encoded.slice(0, 1), encoded.slice(2)]
  const bytes = base64UrlToBytes(data)
  if (format === 'j') return new TextDecoder().decode(bytes)
  if (format !== 'g' || typeof DecompressionStream === 'undefined') throw new Error('この共有リンクを開けません。')
  const decompressed = await streamToBytes(new Blob([bytes.slice().buffer]).stream().pipeThrough(new DecompressionStream('gzip')))
  return new TextDecoder().decode(decompressed)
}

const normalizeNames = (value: unknown): BookcaseNames => {
  if (!Array.isArray(value) || value.length !== 3) throw new Error('本棚名が正しくありません。')
  return value.map((name, index) => typeof name === 'string' ? name.trim().slice(0, 30) || `本棚 ${index + 1}` : `本棚 ${index + 1}`) as BookcaseNames
}

export const createShareLink = async (books: BookshelfBook[], bookcaseNames: BookcaseNames): Promise<string> => {
  if (books.length > MAX_SHARED_BOOKS) throw new Error(`共有できる本は${MAX_SHARED_BOOKS}冊までです。`)
  const payload: CompactSharePayload = {
    v: 1,
    n: bookcaseNames,
    b: books.map((book) => [
      book.title.slice(0, 300),
      book.authors.slice(0, 10).map((author) => author.slice(0, 150)),
      normalizeCoverUrl(book.coverUrl),
      Math.max(0, Math.min(2, Math.round(book.bookcaseIndex))),
      Math.max(0, Math.min(2, Math.round(book.shelfIndex))),
      Math.round(Math.max(0, Math.min(1, book.xPosition)) * 1000) / 1000,
    ]),
  }
  const encoded = await compress(JSON.stringify(payload))
  if (encoded.length > MAX_PAYLOAD_LENGTH) throw new Error('本棚のデータが大きいため共有リンクを作成できません。表紙画像URLを短くするか、本を減らしてください。')
  const url = new URL(window.location.href)
  url.hash = `share=${encoded}`
  url.search = ''
  return url.toString()
}

export const readSharedBookshelf = async (): Promise<SharedBookshelf | null> => {
  if (!window.location.hash.startsWith('#share=')) return null
  try {
    const parsed = JSON.parse(await decompress(window.location.hash.slice(7))) as Partial<CompactSharePayload>
    if (parsed.v !== 1 || !Array.isArray(parsed.b) || parsed.b.length > MAX_SHARED_BOOKS) throw new Error('共有データが正しくありません。')
    const books = parsed.b.map((entry, index): BookshelfBook => {
      if (!Array.isArray(entry) || entry.length !== 6) throw new Error('本の情報が正しくありません。')
      const [title, authors, coverUrl, bookcaseIndex, shelfIndex, xPosition] = entry
      if (typeof title !== 'string' || !Array.isArray(authors) || !authors.every((author) => typeof author === 'string') || typeof coverUrl !== 'string' || !Number.isFinite(bookcaseIndex) || !Number.isFinite(shelfIndex) || !Number.isFinite(xPosition)) throw new Error('本の情報が正しくありません。')
      return {
        id: `shared-${index}`,
        googleBooksId: `shared-${index}`,
        dataSource: 'manual',
        title: title.slice(0, 300),
        authors: authors.slice(0, 10).map((author) => author.slice(0, 150)),
        publisher: '', publishedDate: '', isbn: '',
        coverUrl: normalizeCoverUrl(coverUrl),
        bookcaseIndex: Math.max(0, Math.min(2, Math.round(bookcaseIndex))),
        shelfIndex: Math.max(0, Math.min(2, Math.round(shelfIndex))),
        xPosition: Math.max(0, Math.min(1, xPosition)),
        addedAt: '',
      }
    })
    return { bookcaseNames: normalizeNames(parsed.n), books }
  } catch {
    throw new Error('共有リンクを読み取れませんでした。リンクが途中で切れていないか確認してください。')
  }
}
