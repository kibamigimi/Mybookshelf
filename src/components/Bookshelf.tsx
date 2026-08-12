import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { BookshelfBook } from '../types/book'
import { BookItem } from './BookItem'

interface DragState {
  id: string
  pointerId: number
  startX: number
  startY: number
  xPosition: number
  shelfIndex: number
  moved: boolean
}

interface Props {
  books: BookshelfBook[]
  activeBookcase: number
  newestId: string | null
  onBookcaseChange: (index: number) => void
  onMove: (id: string, bookcaseIndex: number, shelfIndex: number, xPosition: number) => void
  onSelect: (book: BookshelfBook) => void
}

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))

export function Bookshelf({ books, activeBookcase, newestId, onBookcaseChange, onMove, onSelect }: Props) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  dragRef.current = drag

  useEffect(() => {
    const onMovePointer = (event: globalThis.PointerEvent) => {
      const current = dragRef.current
      const board = boardRef.current
      if (!current || !board || current.pointerId !== event.pointerId) return
      event.preventDefault()
      const rect = board.getBoundingClientRect()
      const moved = current.moved || Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > 5
      const xPosition = clamp((event.clientX - rect.left - 46) / Math.max(1, rect.width - 92))
      const shelfIndex = Math.round(clamp((event.clientY - rect.top) / rect.height, 0, 0.999) * 3 - 0.5)
      setDrag({ ...current, xPosition, shelfIndex: clamp(shelfIndex, 0, 2), moved })
    }
    const onEndPointer = (event: globalThis.PointerEvent) => {
      const current = dragRef.current
      if (!current || current.pointerId !== event.pointerId) return
      const book = books.find((item) => item.id === current.id)
      if (current.moved) onMove(current.id, activeBookcase, current.shelfIndex, current.xPosition)
      else if (book) onSelect(book)
      setDrag(null)
    }
    window.addEventListener('pointermove', onMovePointer, { passive: false })
    window.addEventListener('pointerup', onEndPointer)
    window.addEventListener('pointercancel', onEndPointer)
    return () => {
      window.removeEventListener('pointermove', onMovePointer)
      window.removeEventListener('pointerup', onEndPointer)
      window.removeEventListener('pointercancel', onEndPointer)
    }
  }, [activeBookcase, books, onMove, onSelect])

  const beginDrag = (event: PointerEvent<HTMLButtonElement>, book: BookshelfBook) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDrag({ id: book.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, xPosition: book.xPosition, shelfIndex: book.shelfIndex, moved: false })
  }

  return (
    <section className="bookshelf-section" aria-label="自分の本棚">
      <div className="bookcase-stage">
        <button type="button" className="bookcase-arrow bookcase-arrow-left" onClick={() => onBookcaseChange(activeBookcase - 1)} disabled={activeBookcase === 0} aria-label="左の本棚へ">‹</button>
        <div className="bookcase" ref={boardRef}>
          <div className="wood-side wood-left" /><div className="wood-side wood-right" />
          {[0, 1, 2].map((index) => <div className="shelf-rail" key={index} style={{ top: `${(index + 1) * (100 / 3) - 3}%` }} />)}
          {books.filter((book) => book.bookcaseIndex === activeBookcase).map((book) => {
            const active = drag?.id === book.id
            return <BookItem key={book.id} book={book} shelfIndex={active ? drag.shelfIndex : book.shelfIndex} xPosition={active ? drag.xPosition : book.xPosition} dragging={active} isNew={book.id === newestId} onPointerDown={beginDrag} />
          })}
        </div>
        <button type="button" className="bookcase-arrow bookcase-arrow-right" onClick={() => onBookcaseChange(activeBookcase + 1)} disabled={activeBookcase === 2} aria-label="右の本棚へ">›</button>
      </div>
      <div className="bookcase-position" aria-live="polite">
        {[0, 1, 2].map((index) => (
          <button key={index} type="button" className={index === activeBookcase ? 'active' : ''} onClick={() => onBookcaseChange(index)} aria-label={`本棚${index + 1}を表示`} aria-current={index === activeBookcase ? 'true' : undefined} />
        ))}
        <span>本棚 {activeBookcase + 1} / 3</span>
      </div>
    </section>
  )
}
