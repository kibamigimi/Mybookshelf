import type { BookSearchMode, BookSearchResult } from '../types/book'
import { normalizeCoverUrl } from '../utils/url'

interface GoogleVolumeInfo {
  title?: string
  authors?: string[]
  publisher?: string
  publishedDate?: string
  industryIdentifiers?: Array<{ type?: string; identifier?: string }>
  imageLinks?: Partial<Record<'smallThumbnail' | 'thumbnail' | 'small' | 'medium' | 'large' | 'extraLarge', string>>
}

interface GoogleBooksResponse {
  items?: Array<{ id?: string; volumeInfo?: GoogleVolumeInfo }>
}

interface OpenLibraryDocument {
  key?: string
  title?: string
  author_name?: string[]
  publisher?: string[]
  first_publish_year?: number
  publish_date?: string[]
  isbn?: string[]
  cover_i?: number
  edition_key?: string[]
}

interface OpenLibraryResponse {
  docs?: OpenLibraryDocument[]
}

const secureCoverUrl = (url?: string): string => {
  if (!url) return ''
  return normalizeCoverUrl(url.replace(/zoom=1(?=&|$)/, 'zoom=2'))
}

const buildQuery = (query: string, mode: BookSearchMode): string => {
  const normalizedIsbn = query.replace(/[\s-]/g, '')
  if (mode === 'title') return `intitle:${query}`
  if (mode === 'author') return `inauthor:${query}`
  if (mode === 'isbn') return `isbn:${normalizedIsbn}`
  return query
}

const buildOpenLibraryQuery = (query: string, mode: BookSearchMode): string => {
  const normalizedIsbn = query.replace(/[\s-]/g, '')
  if (mode === 'title') return `title:${query}`
  if (mode === 'author') return `author:${query}`
  if (mode === 'isbn') return `isbn:${normalizedIsbn}`
  return Array.from(query).length < 3 ? `${query}*` : query
}

const searchOpenLibrary = async (query: string, mode: BookSearchMode, signal?: AbortSignal): Promise<BookSearchResult[]> => {
  const endpoint = new URL('https://openlibrary.org/search.json')
  endpoint.searchParams.set('q', buildOpenLibraryQuery(query, mode))
  endpoint.searchParams.set('lang', 'ja')
  endpoint.searchParams.set('limit', '24')
  endpoint.searchParams.set('fields', 'key,title,author_name,publisher,first_publish_year,publish_date,isbn,cover_i,edition_key')

  const response = await fetch(endpoint, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
  if (!response.ok) throw new Error('書籍情報を取得できませんでした。')
  const data = (await response.json()) as OpenLibraryResponse

  return (data.docs ?? []).flatMap((document, index) => {
    if (!document.title) return []
    const sourceId = document.edition_key?.[0] ?? document.key ?? `result-${index}`
    const publishedDate = document.publish_date?.find((date) => /^\d{4}(-\d{2})?(-\d{2})?$/.test(date))
      ?? (document.first_publish_year ? String(document.first_publish_year) : '')
    return [{
      googleBooksId: `openlibrary:${sourceId}`,
      dataSource: 'open-library' as const,
      title: document.title,
      authors: document.author_name ?? [],
      publisher: document.publisher?.[0] ?? '',
      publishedDate,
      isbn: document.isbn?.find((value) => value.length === 13) ?? document.isbn?.[0] ?? '',
      coverUrl: document.cover_i ? `https://covers.openlibrary.org/b/id/${document.cover_i}-L.jpg` : '',
    }]
  })
}

export const searchGoogleBooks = async (
  query: string,
  mode: BookSearchMode = 'all',
  signal?: AbortSignal,
): Promise<BookSearchResult[]> => {
  const endpoint = new URL('https://www.googleapis.com/books/v1/volumes')
  endpoint.searchParams.set('q', buildQuery(query, mode))
  endpoint.searchParams.set('maxResults', '24')
  endpoint.searchParams.set('printType', 'books')
  endpoint.searchParams.set('langRestrict', 'ja')
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY?.trim()
  if (apiKey) endpoint.searchParams.set('key', apiKey)

  try {
    const response = await fetch(endpoint, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
    if (!response.ok) return searchOpenLibrary(query, mode, signal)

    const data = (await response.json()) as GoogleBooksResponse
    const books = (data.items ?? []).flatMap((item) => {
      const info = item.volumeInfo
      if (!item.id || !info?.title) return []
      const images = info.imageLinks
      const cover = images?.extraLarge ?? images?.large ?? images?.medium ?? images?.small ?? images?.thumbnail ?? images?.smallThumbnail
      const identifiers = info.industryIdentifiers ?? []
      const isbn = identifiers.find((entry) => entry.type === 'ISBN_13')?.identifier
        ?? identifiers.find((entry) => entry.type === 'ISBN_10')?.identifier
        ?? ''
      return [{
        googleBooksId: item.id,
        dataSource: 'google-books' as const,
        title: info.title,
        authors: info.authors ?? [],
        publisher: info.publisher ?? '',
        publishedDate: info.publishedDate ?? '',
        isbn,
        coverUrl: secureCoverUrl(cover),
      }]
    })
    return books.length > 0 ? books : searchOpenLibrary(query, mode, signal)
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    return searchOpenLibrary(query, mode, signal)
  }
}
