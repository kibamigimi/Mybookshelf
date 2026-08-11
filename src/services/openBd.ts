import type { BookSearchResult } from '../types/book'
import { normalizeCoverUrl } from '../utils/url'

interface OpenBdSummary {
  isbn?: string
  title?: string
  author?: string
  publisher?: string
  pubdate?: string
  cover?: string
}

interface OpenBdTextContent {
  Text?: string
  TextType?: string
}

interface OpenBdBook {
  summary?: OpenBdSummary
  onix?: {
    CollateralDetail?: {
      TextContent?: OpenBdTextContent[]
    }
  }
}

const OPENBD_TIMEOUT_MS = 4500

const normalizeIsbn = (value: string): string => value.replace(/[^0-9X]/gi, '')

const formatOpenBdDate = (value?: string): string => {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length >= 8) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
  if (digits.length >= 6) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}`
  return digits.slice(0, 4)
}

const parseOpenBdAuthors = (value?: string): string[] => {
  if (!value) return []
  const cataloguedName = value.split(',')
  if (cataloguedName.length >= 2 && cataloguedName.slice(2).every((part) => !part || /^\d{4}/.test(part.trim()))) {
    return [`${cataloguedName[0]}${cataloguedName[1]}`.trim()]
  }
  return value
    .split(/[、;]/)
    .map((author) => author.replace(/[／/]\s*(著|編|訳|監修|原作|絵).*$/, '').trim())
    .filter(Boolean)
}

const toPlainText = (value?: string): string => {
  if (!value) return ''
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const getDescription = (book: OpenBdBook): string => {
  const contents = book.onix?.CollateralDetail?.TextContent ?? []
  const preferred = contents.find((content) => content.TextType === '03' && content.Text)
    ?? contents.find((content) => content.Text)
  return toPlainText(preferred?.Text)
}

const fetchOpenBdBooks = async (isbns: string[], signal?: AbortSignal): Promise<Map<string, OpenBdBook>> => {
  if (isbns.length === 0) return new Map()
  const controller = new AbortController()
  const abortFromParent = () => controller.abort()
  signal?.addEventListener('abort', abortFromParent, { once: true })
  const timeout = globalThis.setTimeout(() => controller.abort(), OPENBD_TIMEOUT_MS)

  try {
    const endpoint = new URL('https://api.openbd.jp/v1/get')
    endpoint.searchParams.set('isbn', isbns.join(','))
    const response = await fetch(endpoint, {
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    })
    if (!response.ok) return new Map()
    const data = (await response.json()) as Array<OpenBdBook | null>
    const byIsbn = new Map<string, OpenBdBook>()
    data.forEach((book, index) => {
      if (!book) return
      const isbn = normalizeIsbn(book.summary?.isbn ?? isbns[index] ?? '')
      if (isbn.length === 13) byIsbn.set(isbn, book)
    })
    return byIsbn
  } catch (error) {
    if (signal?.aborted) throw error
    return new Map()
  } finally {
    globalThis.clearTimeout(timeout)
    signal?.removeEventListener('abort', abortFromParent)
  }
}

export const enrichBooksWithOpenBd = async (
  books: BookSearchResult[],
  signal?: AbortSignal,
): Promise<BookSearchResult[]> => {
  const isbns = [...new Set(books
    .map((book) => normalizeIsbn(book.isbn))
    .filter((isbn) => /^\d{13}$/.test(isbn)))]
  const openBdBooks = await fetchOpenBdBooks(isbns, signal)
  if (openBdBooks.size === 0) return books

  return books.map((book) => {
    const isbn = normalizeIsbn(book.isbn)
    const openBdBook = openBdBooks.get(isbn)
    if (!openBdBook) return book
    const summary = openBdBook.summary ?? {}
    const authors = parseOpenBdAuthors(summary.author)
    const description = getDescription(openBdBook)
    return {
      ...book,
      title: summary.title?.trim() || book.title,
      authors: authors.length > 0 ? authors : book.authors,
      publisher: summary.publisher?.trim() || book.publisher,
      publishedDate: formatOpenBdDate(summary.pubdate) || book.publishedDate,
      coverUrl: normalizeCoverUrl(summary.cover ?? '') || book.coverUrl,
      description: description || book.description,
      enrichedByOpenBd: true,
    }
  })
}
