import { useCallback, useMemo, useState } from 'react'
import { AddBookModal } from './components/AddBookModal'
import { AddBookRecordModal } from './components/AddBookRecordModal'
import { BookDetailModal } from './components/BookDetailModal'
import { ReadingCalendar } from './components/ReadingCalendar'
import { ReadingList } from './components/ReadingList'
import { Bookshelf } from './components/Bookshelf'
import { useBookshelf } from './hooks/useBookshelf'
import type { BookRecordInput, BookSearchResult, BookshelfBook } from './types/book'

type View = 'bookshelf' | 'calendar' | 'records'

export default function App() {
  const { books, addBook, moveBook, updateBook, removeBook } = useBookshelf()
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newestId, setNewestId] = useState<string | null>(null)
  const [pendingBook, setPendingBook] = useState<BookSearchResult | null>(null)
  const [view, setView] = useState<View>('bookshelf')
  const selected = books.find((book) => book.id === selectedId) ?? null
  const existingIds = useMemo(() => new Set(books.map((book) => book.googleBooksId)), [books])
  const closeAdd = useCallback(() => setShowAdd(false), [])
  const closeDetail = useCallback(() => setSelectedId(null), [])

  const prepareAdd = (result: BookSearchResult) => {
    setShowAdd(false)
    setPendingBook(result)
  }

  const handleAdd = (record: BookRecordInput) => {
    if (!pendingBook) return
    const book = addBook(pendingBook, record)
    if (!book) return
    setPendingBook(null)
    setNewestId(book.id)
    setView('bookshelf')
    window.setTimeout(() => setNewestId(null), 700)
  }

  const handleSelect = useCallback((book: BookshelfBook) => setSelectedId(book.id), [])

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" type="button" onClick={() => setView('bookshelf')} aria-label="My Bookshelf ホーム">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>My Bookshelf</span>
        </button>
        <nav className="main-nav" aria-label="メインメニュー">
          <button type="button" className={view === 'bookshelf' ? 'active' : ''} onClick={() => setView('bookshelf')} aria-current={view === 'bookshelf' ? 'page' : undefined}>本棚</button>
          <button type="button" className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')} aria-current={view === 'calendar' ? 'page' : undefined}>カレンダー</button>
          <button type="button" className={view === 'records' ? 'active' : ''} onClick={() => setView('records')} aria-current={view === 'records' ? 'page' : undefined}>読書記録</button>
        </nav>
        <div className="header-actions">
          <button className="icon-button search-icon-button" onClick={() => setShowAdd(true)} aria-label="本を検索">⌕</button>
          <button className="primary-button header-add" onClick={() => setShowAdd(true)}>＋ <span>本を追加</span></button>
        </div>
      </header>

      <main id="top" className={`view-main view-${view}`}>
        {view === 'bookshelf' && <Bookshelf books={books} newestId={newestId} onMove={moveBook} onSelect={handleSelect} />}
        {view === 'calendar' && <ReadingCalendar books={books} onSelect={handleSelect} />}
        {view === 'records' && <ReadingList books={books} onSelect={handleSelect} />}
      </main>

      {showAdd && <AddBookModal existingIds={existingIds} onClose={closeAdd} onAdd={prepareAdd} />}
      {pendingBook && <AddBookRecordModal book={pendingBook} onClose={() => setPendingBook(null)} onConfirm={handleAdd} />}
      {selected && (
        <BookDetailModal
          book={selected}
          onClose={closeDetail}
          onSave={(notes) => updateBook(selected.id, notes)}
          onDelete={() => { removeBook(selected.id); setSelectedId(null) }}
        />
      )}
    </div>
  )
}
