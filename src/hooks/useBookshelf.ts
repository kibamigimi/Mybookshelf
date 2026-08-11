import { useCallback, useEffect, useState } from 'react'
import type { BookSearchResult, BookshelfBook, BookUpdate } from '../types/book'
import { loadBooks, saveBooks } from '../utils/storage'

const getAutoPosition = (books: BookshelfBook[]): Pick<BookshelfBook, 'shelfIndex' | 'xPosition'> => {
  const shelfIndex = books.length % 3
  const count = books.filter((book) => book.shelfIndex === shelfIndex).length
  return { shelfIndex, xPosition: Math.min(0.88, 0.04 + (count % 7) * 0.14) }
}

export const useBookshelf = () => {
  const [books, setBooks] = useState<BookshelfBook[]>(loadBooks)

  useEffect(() => saveBooks(books), [books])

  const addBook = useCallback((result: BookSearchResult): BookshelfBook | null => {
    if (books.some((book) => book.googleBooksId === result.googleBooksId)) return null
    const added: BookshelfBook = {
      ...result,
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      ...getAutoPosition(books),
      addedAt: new Date().toISOString(),
    }
    setBooks((current) => current.some((book) => book.googleBooksId === result.googleBooksId)
      ? current
      : [...current, added])
    return added
  }, [books])

  const moveBook = useCallback((id: string, shelfIndex: number, xPosition: number) => {
    setBooks((current) => current.map((book) => book.id === id
      ? { ...book, shelfIndex: Math.max(0, Math.min(2, shelfIndex)), xPosition: Math.max(0, Math.min(1, xPosition)) }
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
