import type { BookcaseNames, BookshelfBackup, BookshelfBook } from '../types/book'
import { normalizeCoverUrl } from './url'

const STORAGE_KEY = 'my-bookshelf:v1'
const BOOKCASE_NAMES_KEY = 'my-bookshelf:bookcase-names:v1'
export const DEFAULT_BOOKCASE_NAMES: BookcaseNames = ['本棚 1', '本棚 2', '本棚 3']

const isBook = (value: unknown): value is BookshelfBook => {
  if (!value || typeof value !== 'object') return false
  const book = value as Partial<BookshelfBook>
  const optionalString = (field: unknown) => field === undefined || typeof field === 'string'
  return (
    typeof book.id === 'string' &&
    typeof book.googleBooksId === 'string' &&
    typeof book.title === 'string' &&
    Array.isArray(book.authors) &&
    book.authors.every((author) => typeof author === 'string') &&
    typeof book.publisher === 'string' &&
    typeof book.publishedDate === 'string' &&
    typeof book.isbn === 'string' &&
    typeof book.coverUrl === 'string' &&
    typeof book.addedAt === 'string' &&
    optionalString(book.readDate) &&
    optionalString(book.note) &&
    optionalString(book.description) &&
    (book.rating === undefined || (Number.isInteger(book.rating) && book.rating >= 1 && book.rating <= 5)) &&
    typeof book.shelfIndex === 'number' &&
    Number.isFinite(book.shelfIndex) &&
    book.shelfIndex >= 0 &&
    book.shelfIndex <= 2 &&
    typeof book.xPosition === 'number' &&
    Number.isFinite(book.xPosition)
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

const normalizeBookcaseNames = (value: unknown): BookcaseNames => {
  if (!Array.isArray(value) || value.length !== 3) return [...DEFAULT_BOOKCASE_NAMES]
  return value.map((name, index) => {
    if (typeof name !== 'string') return DEFAULT_BOOKCASE_NAMES[index]
    return name.trim().slice(0, 30) || DEFAULT_BOOKCASE_NAMES[index]
  }) as BookcaseNames
}

export const loadBookcaseNames = (): BookcaseNames => {
  try {
    const raw = localStorage.getItem(BOOKCASE_NAMES_KEY)
    return raw ? normalizeBookcaseNames(JSON.parse(raw)) : [...DEFAULT_BOOKCASE_NAMES]
  } catch {
    return [...DEFAULT_BOOKCASE_NAMES]
  }
}

export const saveBookcaseNames = (names: BookcaseNames): void => {
  try {
    localStorage.setItem(BOOKCASE_NAMES_KEY, JSON.stringify(normalizeBookcaseNames(names)))
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export const createBackup = (books: BookshelfBook[], bookcaseNames: BookcaseNames): BookshelfBackup => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  bookcaseNames: normalizeBookcaseNames(bookcaseNames),
  books,
})

export const parseBackup = (text: string): BookshelfBackup => {
  if (text.length > 5_000_000) throw new Error('バックアップファイルが大きすぎます。')
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('JSONファイルを読み取れませんでした。')
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('バックアップ形式が正しくありません。')
  const candidate = parsed as Partial<BookshelfBackup>
  if (candidate.version !== 1 || !Array.isArray(candidate.books)) throw new Error('対応していないバックアップ形式です。')
  if (candidate.books.length > 5000 || !candidate.books.every(isBook)) throw new Error('本のデータが正しくありません。')
  const uniqueBooks = [...new Map(candidate.books.map((book) => [book.id, book])).values()].map((book) => ({
    ...book,
    bookcaseIndex: typeof book.bookcaseIndex === 'number' ? Math.max(0, Math.min(2, Math.round(book.bookcaseIndex))) : 0,
    shelfIndex: Math.max(0, Math.min(2, Math.round(book.shelfIndex))),
    xPosition: Math.max(0, Math.min(1, book.xPosition)),
    coverUrl: normalizeCoverUrl(book.coverUrl ?? ''),
  }))
  return {
    version: 1,
    exportedAt: typeof candidate.exportedAt === 'string' ? candidate.exportedAt : new Date().toISOString(),
    bookcaseNames: normalizeBookcaseNames(candidate.bookcaseNames),
    books: uniqueBooks,
  }
}

export const saveBooks = (books: BookshelfBook[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}
