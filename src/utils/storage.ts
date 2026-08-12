import type { BookshelfBook } from '../types/book'
import { normalizeCoverUrl } from './url'

const STORAGE_KEY = 'my-bookshelf:v1'

const isBook = (value: unknown): value is BookshelfBook => {
  if (!value || typeof value !== 'object') return false
  const book = value as Partial<BookshelfBook>
  return (
    typeof book.id === 'string' &&
    typeof book.googleBooksId === 'string' &&
    typeof book.title === 'string' &&
    Array.isArray(book.authors) &&
    book.authors.every((author) => typeof author === 'string') &&
    typeof book.shelfIndex === 'number' &&
    book.shelfIndex >= 0 &&
    book.shelfIndex <= 2 &&
    typeof book.xPosition === 'number'
  )
}

export const loadBooks = (): BookshelfBook[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isBook).map((book) => ({
      ...book,
      bookcaseIndex: typeof book.bookcaseIndex === 'number'
        ? Math.max(0, Math.min(2, Math.round(book.bookcaseIndex)))
        : 0,
      xPosition: Math.max(0, Math.min(1, book.xPosition)),
      shelfIndex: Math.max(0, Math.min(2, Math.round(book.shelfIndex))),
      coverUrl: normalizeCoverUrl(book.coverUrl ?? ''),
      description: typeof book.description === 'string' ? book.description : undefined,
      enrichedByOpenBd: book.enrichedByOpenBd === true || undefined,
    }))
  } catch {
    return []
  }
}

export const saveBooks = (books: BookshelfBook[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}
