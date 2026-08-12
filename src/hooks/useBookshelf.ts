import { useCallback, useEffect, useState } from 'react'
import type { BookRecordInput, BookSearchResult, BookshelfBook, BookUpdate } from '../types/book'
import { loadBooks, saveBooks } from '../utils/storage'

const getAutoPosition = (books: BookshelfBook[], bookcaseIndex: number): Pick<BookshelfBook, 'shelfIndex' | 'xPosition'> => {
  const booksInBookcase = books.filter((book) => book.bookcaseIndex === bookcaseIndex)
  const shelfIndex = booksInBookcase.length % 3
  const count = booksInBookcase.filter((book) => book.shelfIndex === shelfIndex).length
  return { shelfIndex, xPosition: Math.min(0.88, 0.04 + (count % 7) * 0.14) }
}

export const useBookshelf = () => {
  const [books, setBooks] = useState<BookshelfBook[]>(loadBooks)

  useEffect(() => saveBooks(books), [books])

  const addBook = useCallback((result: BookSearchResult, record: BookRecordInput = {}, bookcaseIndex = 0): BookshelfBook | null => {
    if (books.some((book) => book.googleBooksId === result.googleBooksId)) return null
    const added: BookshelfBook = {
      ...result,
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      bookcaseIndex: Math.max(0, Math.min(2, bookcaseIndex)),
      ...getAutoPosition(books, bookcaseIndex),
      addedAt: new Date().toISOString(),
      ...record,
    }
    setBooks((current) => current.some((book) => book.googleBooksId === result.googleBooksId)
      ? current
      : [...current, added])
    return added
  }, [books])

  const moveBook = useCallback((id: string, bookcaseIndex: number, shelfIndex: number, xPosition: number) => {
    setBooks((current) => current.map((book) => book.id === id
      ? {
        ...book,
        bookcaseIndex: Math.max(0, Math.min(2, bookcaseIndex)),
        shelfIndex: Math.max(0, Math.min(2, shelfIndex)),
        xPosition: Math.max(0, Math.min(1, xPosition)),
      }
      : book))
  }, [])

  const updateBook = useCallback((id: string, update: BookUpdate) => {
    setBooks((current) => current.map((book) => book.id === id ? { ...book, ...update } : book))
  }, [])

  const removeBook = useCallback((id: string) => {
    setBooks((current) => current.filter((book) => book.id !== id))
  }, [])

  return { books, addBook, moveBook, updateBook, removeBook }
}
