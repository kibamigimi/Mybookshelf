import type { PointerEvent } from 'react'
import type { BookshelfBook } from '../types/book'
import { CoverImage } from './CoverImage'

interface Props {
  book: BookshelfBook
  shelfIndex: number
  xPosition: number
  dragging: boolean
  isNew: boolean
  onPointerDown: (event: PointerEvent<HTMLButtonElement>, book: BookshelfBook) => void
}

export function BookItem({ book, shelfIndex, xPosition, dragging, isNew, onPointerDown }: Props) {
  return (
    <button
      className={`shelf-book ${dragging ? 'dragging' : ''} ${isNew ? 'new-book' : ''}`}
      style={{ left: `calc(${xPosition * 100}% - ${xPosition * 92}px)`, top: `calc(${shelfIndex * (100 / 3)}% + 16px)` }}
      onPointerDown={(event) => onPointerDown(event, book)}
      aria-label={`${book.title}。ドラッグして移動、左右端で別の本棚へ移動、タップして詳細を開く`}
    >
      <CoverImage src={book.coverUrl} title={book.title} />
      <span className="book-shadow" />
    </button>
  )
}
