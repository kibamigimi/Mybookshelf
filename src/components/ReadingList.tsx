import { useMemo } from 'react'
import type { BookcaseNames, BookshelfBook } from '../types/book'
import { CoverImage } from './CoverImage'

interface Props {
  books: BookshelfBook[]
  bookcaseNames: BookcaseNames
  onSelect: (book: BookshelfBook) => void
}

const formatReadDate = (value?: string) => {
  if (!value) return '読了日未設定'
  const [year, month, day] = value.split('-')
  return `${year}年${Number(month)}月${Number(day)}日`
}

export function ReadingList({ books, bookcaseNames, onSelect }: Props) {
  const groupedBooks = useMemo(() => [0, 1, 2].map((bookcaseIndex) => ({
    bookcaseIndex,
    shelves: [0, 1, 2].map((shelfIndex) => ({
      shelfIndex,
      books: books
        .filter((book) => book.bookcaseIndex === bookcaseIndex && book.shelfIndex === shelfIndex)
        .sort((a, b) => a.xPosition - b.xPosition),
    })),
  })), [books])

  return (
    <section className="records-view" aria-labelledby="records-title">
      <div className="view-heading records-heading">
        <div>
          <p className="view-eyebrow">READING RECORDS</p>
          <h1 id="records-title">読んだ本の記録</h1>
        </div>
        <p className="record-count">{books.length}冊</p>
      </div>
      {books.length === 0 ? (
        <div className="records-empty">本棚に追加した本が、ここに一覧で表示されます。</div>
      ) : (
        <div className="record-hierarchy">
          {groupedBooks.map(({ bookcaseIndex, shelves }) => {
            const bookcaseCount = shelves.reduce((count, shelf) => count + shelf.books.length, 0)
            return (
              <section className="record-bookcase" key={bookcaseIndex} aria-labelledby={`bookcase-${bookcaseIndex}-title`}>
                <div className="record-bookcase-heading">
                  <h2 id={`bookcase-${bookcaseIndex}-title`}>{bookcaseNames[bookcaseIndex]}</h2>
                  <span>{bookcaseCount}冊</span>
                </div>
                {bookcaseCount === 0 ? <p className="record-bookcase-empty">この本棚にはまだ本がありません。</p> : (
                  <div className="record-shelves">
                    {shelves.map(({ shelfIndex, books: shelfBooks }) => (
                      <section className="record-shelf-group" key={shelfIndex} aria-labelledby={`bookcase-${bookcaseIndex}-shelf-${shelfIndex}`}>
                        <div className="record-shelf-heading">
                          <h3 id={`bookcase-${bookcaseIndex}-shelf-${shelfIndex}`}>{shelfIndex + 1}段目</h3>
                          <span>{shelfBooks.length}冊</span>
                        </div>
                        {shelfBooks.length === 0 ? <p className="record-shelf-empty">本はありません</p> : (
                          <div className="record-list">
                            {shelfBooks.map((book) => (
                              <article className="record-row" key={book.id}>
                                <div className="record-cover"><CoverImage src={book.coverUrl} title={book.title} /></div>
                                <div className="record-book-info">
                                  <h4>{book.title}</h4>
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
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </section>
  )
}
