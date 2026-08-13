export interface BookSearchResult {
  googleBooksId: string
  dataSource?: 'google-books' | 'open-library' | 'manual'
  title: string
  authors: string[]
  publisher: string
  publishedDate: string
  isbn: string
  coverUrl: string
  description?: string
  enrichedByOpenBd?: boolean
}

export type BookSearchMode = 'all' | 'title' | 'author' | 'isbn'

export interface BookshelfBook extends BookSearchResult {
  id: string
  bookcaseIndex: number
  shelfIndex: number
  xPosition: number
  addedAt: string
  readDate?: string
  rating?: number
  note?: string
}

export interface BookUpdate {
  readDate?: string
  rating?: number
  note?: string
  coverUrl: string
  bookcaseIndex: number
  shelfIndex: number
}

export interface BookRecordInput {
  readDate?: string
  rating?: number
  note?: string
}

export type BookcaseNames = [string, string, string]

export interface BookshelfBackup {
  version: 1
  exportedAt: string
  bookcaseNames: BookcaseNames
  books: BookshelfBook[]
}

export interface SharedBookshelf {
  bookcaseNames: BookcaseNames
  books: BookshelfBook[]
}
