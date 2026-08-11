import { useMemo, useState } from 'react'
import type { BookshelfBook } from '../types/book'
import { CoverImage } from './CoverImage'

interface Props {
  books: BookshelfBook[]
  onSelect: (book: BookshelfBook) => void
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const dateKey = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

export function ReadingCalendar({ books, onSelect }: Props) {
  const today = new Date()
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7
  const booksByDate = useMemo(() => {
    const grouped = new Map<string, BookshelfBook[]>()
    books.forEach((book) => {
      if (!book.readDate) return
      grouped.set(book.readDate, [...(grouped.get(book.readDate) ?? []), book])
    })
    return grouped
  }, [books])

  const moveMonth = (amount: number) => setCursor(new Date(year, month + amount, 1))
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  return (
    <section className="calendar-view" aria-labelledby="calendar-title">
      <div className="view-heading calendar-heading">
        <div>
          <p className="view-eyebrow">READING CALENDAR</p>
          <h1 id="calendar-title">{year}年{month + 1}月</h1>
        </div>
        <div className="calendar-controls">
          <button type="button" onClick={() => moveMonth(-1)} aria-label="前の月">‹</button>
          <button type="button" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))} disabled={isCurrentMonth}>今月</button>
          <button type="button" onClick={() => moveMonth(1)} aria-label="次の月">›</button>
        </div>
      </div>
      <div className="calendar-grid" role="grid" aria-label={`${year}年${month + 1}月の読書カレンダー`}>
        {WEEKDAYS.map((weekday, index) => <div key={weekday} className={`calendar-weekday weekday-${index}`} role="columnheader">{weekday}</div>)}
        {Array.from({ length: cellCount }, (_, index) => {
          const day = index - firstWeekday + 1
          if (day < 1 || day > daysInMonth) return <div key={`blank-${index}`} className="calendar-day empty" role="gridcell" />
          const key = dateKey(year, month, day)
          const dayBooks = booksByDate.get(key) ?? []
          const isToday = key === dateKey(today.getFullYear(), today.getMonth(), today.getDate())
          return (
            <div key={key} className={`calendar-day${isToday ? ' today' : ''}`} role="gridcell">
              <span className="day-number">{day}</span>
              <div className="day-books">
                {dayBooks.map((book) => (
                  <button key={book.id} type="button" className="calendar-book" onClick={() => onSelect(book)} aria-label={`${book.title}の記録を開く`}>
                    <CoverImage src={book.coverUrl} title={book.title} />
                    <span>{book.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {books.length > 0 && !books.some((book) => book.readDate) && <p className="view-empty-note">本の記録で読了日を入力すると、ここに表示されます。</p>}
    </section>
  )
}
