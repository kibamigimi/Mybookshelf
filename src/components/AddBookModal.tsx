import { useEffect, useRef, useState, type FormEvent } from 'react'
import { searchGoogleBooks } from '../services/googleBooks'
import type { BookSearchMode, BookSearchResult } from '../types/book'
import { BookSearchResults } from './BookSearchResults'
import { ManualBookForm } from './ManualBookForm'
import { Modal } from './Modal'

interface Props {
  existingIds: Set<string>
  onClose: () => void
  onAdd: (book: BookSearchResult) => void
}

export function AddBookModal({ existingIds, onClose, onAdd }: Props) {
  const [entryMode, setEntryMode] = useState<'search' | 'manual'>('search')
  const [searchMode, setSearchMode] = useState<BookSearchMode>('all')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const controllerRef = useRef<AbortController | null>(null)
  useEffect(() => () => controllerRef.current?.abort(), [])

  const search = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      setResults(await searchGoogleBooks(trimmed, searchMode, controller.signal))
    } catch (reason) {
      if ((reason as Error).name !== 'AbortError') {
        setResults([])
        setError('検索に失敗しました。通信状況を確認して、もう一度お試しください。')
      }
    } finally {
      if (controllerRef.current === controller) setLoading(false)
    }
  }

  return (
    <Modal title="本を本棚に追加" onClose={onClose} wide>
      <div className="entry-tabs" role="tablist" aria-label="本の追加方法">
        <button type="button" role="tab" aria-selected={entryMode === 'search'} className={entryMode === 'search' ? 'active' : ''} onClick={() => setEntryMode('search')}>本を検索</button>
        <button type="button" role="tab" aria-selected={entryMode === 'manual'} className={entryMode === 'manual' ? 'active' : ''} onClick={() => setEntryMode('manual')}>手動で追加</button>
      </div>

      {entryMode === 'search' ? <>
        <div className="search-methods" role="radiogroup" aria-label="検索方法">
          {([
            ['all', 'すべて'], ['title', 'タイトル'], ['author', '著者'], ['isbn', 'ISBN'],
          ] as Array<[BookSearchMode, string]>).map(([value, label]) => (
            <button key={value} type="button" role="radio" aria-checked={searchMode === value} className={searchMode === value ? 'active' : ''} onClick={() => setSearchMode(value)}>{label}</button>
          ))}
        </div>
        <form className="search-form" onSubmit={search}>
          <label className="sr-only" htmlFor="book-search">本を検索</label>
          <span className="search-glyph" aria-hidden="true">⌕</span>
          <input id="book-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchMode === 'title' ? '本のタイトルを入力' : searchMode === 'author' ? '著者名を入力' : searchMode === 'isbn' ? 'ISBNを入力' : '本のタイトル・著者名・ISBNを入力'} autoComplete="off" inputMode={searchMode === 'isbn' ? 'numeric' : 'text'} />
          <button type="submit" className="primary-button search-button" disabled={loading || !query.trim()}>{loading ? '検索中…' : '検索'}</button>
        </form>

        <div className="search-content">
          {loading && <div className="loading-state" role="status"><span className="spinner" />本を探しています…</div>}
          {!loading && error && <div className="message-state error-state" role="alert">{error}<button type="button" className="text-action" onClick={() => setEntryMode('manual')}>手動で追加する</button></div>}
          {!loading && !error && searched && results.length === 0 && <div className="message-state"><strong>本が見つかりませんでした</strong><span>検索方法やキーワードを変えるか、手動で追加してください。</span><button type="button" className="secondary-button" onClick={() => setEntryMode('manual')}>この本を手動で追加</button></div>}
          {!loading && !error && results.length > 0 && (
            <>
              {results.some((book) => book.dataSource === 'open-library') && (
                <p className="fallback-notice" role="status">Google Booksと複数の書籍データをまとめて表示しています。</p>
              )}
              <BookSearchResults results={results} existingIds={existingIds} onAdd={onAdd} />
            </>
          )}
          {!searched && <div className="search-intro"><span aria-hidden="true">⌕</span><p>検索方法を選んで、<br />読んだ本の表紙を探せます。</p><button type="button" className="text-action" onClick={() => setEntryMode('manual')}>見つからない本を手動で追加</button></div>}
        </div>
      </> : <ManualBookForm onAdd={onAdd} />}
    </Modal>
  )
}
