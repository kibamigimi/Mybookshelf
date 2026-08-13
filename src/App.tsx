import { useCallback, useEffect, useMemo, useState } from 'react'
import { AddBookModal } from './components/AddBookModal'
import { AddBookRecordModal } from './components/AddBookRecordModal'
import { BookDetailModal } from './components/BookDetailModal'
import { ReadingCalendar } from './components/ReadingCalendar'
import { ReadingList } from './components/ReadingList'
import { Bookshelf } from './components/Bookshelf'
import { BookshelfSettingsModal } from './components/BookshelfSettingsModal'
import { ShareBookshelfModal } from './components/ShareBookshelfModal'
import { useBookshelf } from './hooks/useBookshelf'
import type { BookcaseNames, BookRecordInput, BookSearchResult, BookshelfBackup, BookshelfBook, SharedBookshelf } from './types/book'
import { loadBookcaseNames, saveBookcaseNames } from './utils/storage'
import { readSharedBookshelf } from './utils/share'

type View = 'bookshelf' | 'calendar' | 'records'

export default function App() {
  const { books, addBook, moveBook, updateBook, removeBook, replaceBooks } = useBookshelf()
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newestId, setNewestId] = useState<string | null>(null)
  const [pendingBook, setPendingBook] = useState<BookSearchResult | null>(null)
  const [view, setView] = useState<View>('bookshelf')
  const [activeBookcase, setActiveBookcase] = useState(0)
  const [bookcaseNames, setBookcaseNames] = useState<BookcaseNames>(loadBookcaseNames)
  const [showSettings, setShowSettings] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [sharedBookshelf, setSharedBookshelf] = useState<SharedBookshelf | null>(null)
  const [shareLoadError, setShareLoadError] = useState('')
  useEffect(() => {
    let active = true
    readSharedBookshelf()
      .then((shared) => { if (active && shared) { setSharedBookshelf(shared); setView('bookshelf'); setActiveBookcase(0) } })
      .catch((reason) => { if (active) setShareLoadError(reason instanceof Error ? reason.message : '共有リンクを開けませんでした。') })
    return () => { active = false }
  }, [])
  useEffect(() => saveBookcaseNames(bookcaseNames), [bookcaseNames])
  const displayBooks = sharedBookshelf?.books ?? books
  const displayBookcaseNames = sharedBookshelf?.bookcaseNames ?? bookcaseNames
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
    const book = addBook(pendingBook, record, activeBookcase)
    if (!book) return
    setPendingBook(null)
    setNewestId(book.id)
    setView('bookshelf')
    window.setTimeout(() => setNewestId(null), 700)
  }

  const handleSelect = useCallback((book: BookshelfBook) => setSelectedId(book.id), [])
  const restoreBackup = useCallback((backup: BookshelfBackup) => {
    replaceBooks(backup.books)
    setBookcaseNames(backup.bookcaseNames)
    setActiveBookcase(0)
    setSelectedId(null)
    setShowSettings(false)
    setView('bookshelf')
  }, [replaceBooks])

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" type="button" onClick={() => setView('bookshelf')} aria-label="My Bookshelf ホーム">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>My Bookshelf</span>
        </button>
        {!sharedBookshelf && <nav className="main-nav" aria-label="メインメニュー">
          <button type="button" className={view === 'bookshelf' ? 'active' : ''} onClick={() => setView('bookshelf')} aria-current={view === 'bookshelf' ? 'page' : undefined}>本棚</button>
          <button type="button" className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')} aria-current={view === 'calendar' ? 'page' : undefined}>カレンダー</button>
          <button type="button" className={view === 'records' ? 'active' : ''} onClick={() => setView('records')} aria-current={view === 'records' ? 'page' : undefined}>読書記録</button>
        </nav>}
        <div className="header-actions">
          {sharedBookshelf ? (
            <button className="primary-button shared-exit-button" onClick={() => { window.location.href = `${window.location.origin}${window.location.pathname}` }}>自分の本棚を開く</button>
          ) : <>
            <button className="header-share-button" onClick={() => setShowShare(true)} aria-label="本棚を共有">↗ <span>共有</span></button>
            <button className="icon-button settings-button" onClick={() => setShowSettings(true)} aria-label="本棚の設定">⚙</button>
            <button className="icon-button search-icon-button" onClick={() => setShowAdd(true)} aria-label="本を検索">⌕</button>
            <button className="primary-button header-add" onClick={() => setShowAdd(true)}>＋ <span>本を追加</span></button>
          </>}
        </div>
      </header>

      <main id="top" className={`view-main view-${view}`}>
        {sharedBookshelf && <div className="shared-view-banner"><strong>共有された本棚</strong><span>閲覧専用です。あなたの本棚には保存されません。</span></div>}
        {shareLoadError && <div className="share-load-error" role="alert">{shareLoadError}</div>}
        {view === 'bookshelf' && (
          <Bookshelf
            books={displayBooks}
            bookcaseNames={displayBookcaseNames}
            activeBookcase={activeBookcase}
            newestId={newestId}
            readOnly={Boolean(sharedBookshelf)}
            ariaLabel={sharedBookshelf ? '共有された本棚' : '自分の本棚'}
            onBookcaseChange={setActiveBookcase}
            onMove={moveBook}
            onSelect={handleSelect}
          />
        )}
        {view === 'calendar' && <ReadingCalendar books={books} onSelect={handleSelect} />}
        {view === 'records' && <ReadingList books={books} bookcaseNames={bookcaseNames} onSelect={handleSelect} />}
      </main>

      {showAdd && <AddBookModal existingIds={existingIds} onClose={closeAdd} onAdd={prepareAdd} />}
      {pendingBook && <AddBookRecordModal book={pendingBook} onClose={() => setPendingBook(null)} onConfirm={handleAdd} />}
      {showShare && <ShareBookshelfModal books={books} bookcaseNames={bookcaseNames} onClose={() => setShowShare(false)} />}
      {showSettings && (
        <BookshelfSettingsModal
          books={books}
          bookcaseNames={bookcaseNames}
          onClose={() => setShowSettings(false)}
          onSaveNames={setBookcaseNames}
          onRestore={restoreBackup}
        />
      )}
      {selected && (
        <BookDetailModal
          book={selected}
          bookcaseNames={bookcaseNames}
          onClose={closeDetail}
          onSave={(notes) => updateBook(selected.id, notes)}
          onDelete={() => { removeBook(selected.id); setSelectedId(null) }}
        />
      )}
    </div>
  )
}
