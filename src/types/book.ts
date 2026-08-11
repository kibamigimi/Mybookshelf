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
}

export interface BookRecordInput {
  readDate?: string
  rating?: number
  note?: string
}
