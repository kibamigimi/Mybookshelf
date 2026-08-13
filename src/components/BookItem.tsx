import type { PointerEvent } from 'react'
import type { BookshelfBook } from '../types/book'
import { CoverImage } from './CoverImage'

interface Props {
  book: BookshelfBook
  shelfIndex: number
  xPosition: number
  dragging: boolean
  isNew: boolean
  readOnly?: boolean
  onPointerDown?: (event: PointerEvent<HTMLButtonElement>, book: BookshelfBook) => void
}

export function BookItem({ book, shelfIndex, xPosition, dragging, isNew, readOnly = false, onPointerDown }: Props) {
  return (
    <button
      className={`shelf-book ${dragging ? 'dragging' : ''} ${isNew ? 'new-book' : ''} ${readOnly ? 'readonly' : ''}`}
      style={{ left: `calc(${xPosition * 100}% - ${xPosition * 92}px)`, top: `calc(${shelfIndex * (100 / 3)}% + 16px)` }}
      onPointerDown={readOnly || !onPointerDown ? undefined : (event) => onPointerDown(event, book)}
      aria-label={readOnly ? `${book.title}${book.authors.length ? `、${book.authors.join('、')}` : ''}` : `${book.title}。ドラッグして移動、左右端で別の本棚へ移動、タップして詳細を開く`}
    >
      <CoverImage src={book.coverUrl} title={book.title} />
      <span className="book-shadow" />
    </button>
  )
}
