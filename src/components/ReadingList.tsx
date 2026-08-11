import { useMemo } from 'react'
import type { BookshelfBook } from '../types/book'
import { CoverImage } from './CoverImage'

interface Props {
  books: BookshelfBook[]
  onSelect: (book: BookshelfBook) => void
}

const formatReadDate = (value?: string) => {
  if (!value) return '読了日未設定'
  const [year, month, day] = value.split('-')
  return `${year}年${Number(month)}月${Number(day)}日`
}

export function ReadingList({ books, onSelect }: Props) {
  const sortedBooks = useMemo(() => [...books].sort((a, b) => {
    const dateCompare = (b.readDate ?? '').localeCompare(a.readDate ?? '')
    return dateCompare || b.addedAt.localeCompare(a.addedAt)
  }), [books])

  return (
    <section className="records-view" aria-labelledby="records-title">
      <div className="view-heading records-heading">
        <div>
          <p className="view-eyebrow">READING RECORDS</p>
          <h1 id="records-title">読んだ本の記録</h1>
        </div>
        <p className="record-count">{books.length}冊</p>
      </div>
      {sortedBooks.length === 0 ? (
        <div className="records-empty">本棚に追加した本が、ここに一覧で表示されます。</div>
      ) : (
        <div className="record-list">
          {sortedBooks.map((book) => (
            <article className="record-row" key={book.id}>
              <div className="record-cover"><CoverImage src={book.coverUrl} title={book.title} /></div>
              <div className="record-book-info">
                <h2>{book.title}</h2>
                <p>{book.authors.join('、') || '著者不明'}</p>
                <span>{book.publisher || '出版社不明'}</span>
              </div>
              <div className="record-date"><span>読了日</span><strong>{formatReadDate(book.readDate)}</strong></div>
              <div className="record-rating" aria-label={book.rating ? `評価${book.rating}` : '評価未設定'}>
                <span>評価</span>
                <strong>{book.rating ? `${'★'.repeat(book.rating)}${'☆'.repeat(5 - book.rating)}` : '未設定'}</strong>
              </div>
              <p className={`record-note${book.note ? '' : ' muted'}`}>{book.note || '感想はまだありません。'}</p>
              <button type="button" className="record-open-button" onClick={() => onSelect(book)} aria-label={`${book.title}の記録を開く`}>記録を見る</button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
