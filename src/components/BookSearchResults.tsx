import { useState } from 'react'
import type { BookSearchResult } from '../types/book'
import { CoverImage } from './CoverImage'
import { normalizeCoverUrl } from '../utils/url'

interface Props {
  results: BookSearchResult[]
  existingIds: Set<string>
  onAdd: (book: BookSearchResult) => void
}

type CoverStatus = 'idle' | 'loading' | 'success' | 'error'

export function BookSearchResults({ results, existingIds, onAdd }: Props) {
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({})
  const [failedCoverIds, setFailedCoverIds] = useState<Set<string>>(() => new Set())
  const [openCoverEditors, setOpenCoverEditors] = useState<Set<string>>(() => new Set())
  const [coverStatuses, setCoverStatuses] = useState<Record<string, CoverStatus>>({})

  return (
    <div className="search-grid" aria-live="polite">
      {results.map((book) => {
        const exists = existingIds.has(book.googleBooksId)
        const customCoverUrl = coverUrls[book.googleBooksId] ?? ''
        const hasCustomCover = Boolean(customCoverUrl.trim())
        const normalizedCustomCover = normalizeCoverUrl(customCoverUrl)
        const validCustomCover = Boolean(normalizedCustomCover)
        const customCoverStatus = coverStatuses[book.googleBooksId] ?? 'idle'
        const customCoverReady = validCustomCover && customCoverStatus === 'success'
        const needsCustomCover = !book.coverUrl || failedCoverIds.has(book.googleBooksId)
        const showCoverEditor = needsCustomCover || openCoverEditors.has(book.googleBooksId)
        const displayedCover = validCustomCover ? normalizedCustomCover : book.coverUrl
        return (
          <article className="search-card" key={book.googleBooksId}>
            <div className="result-cover-wrap">
              <CoverImage
                src={displayedCover}
                title={book.title}
                onLoadSuccess={() => {
                  if (validCustomCover) setCoverStatuses((current) => ({ ...current, [book.googleBooksId]: 'success' }))
                }}
                onLoadError={() => {
                  setFailedCoverIds((current) => current.has(book.googleBooksId) ? current : new Set(current).add(book.googleBooksId))
                  if (validCustomCover) setCoverStatuses((current) => ({ ...current, [book.googleBooksId]: 'error' }))
                }}
              />
            </div>
            <div className="result-info">
              <h3>{book.title}</h3>
              <p className="authors">{book.authors.join('、') || '著者不明'}</p>
              <p className="publication">{[book.publisher, book.publishedDate.slice(0, 4)].filter(Boolean).join(' · ') || '出版情報なし'}</p>
              {!needsCustomCover && !showCoverEditor && (
                <button
                  type="button"
                  className="cover-change-button"
                  onClick={() => setOpenCoverEditors((current) => new Set(current).add(book.googleBooksId))}
                >
                  表紙を変更
                </button>
              )}
              {showCoverEditor && (
                <label className="cover-url-field">
                  表紙画像URL
                  <input
                    type="url"
                    value={customCoverUrl}
                    onChange={(event) => {
                      const nextUrl = event.target.value
                      setCoverUrls((current) => ({ ...current, [book.googleBooksId]: nextUrl }))
                      setCoverStatuses((current) => ({
                        ...current,
                        [book.googleBooksId]: normalizeCoverUrl(nextUrl) ? 'loading' : 'idle',
                      }))
                    }}
                    placeholder="https://..."
                    aria-label={`${book.title}の表紙画像URL`}
                  />
                  {!hasCustomCover && <small>画像を右クリックして「画像アドレスをコピー」したURLを使用してください。</small>}
                  {hasCustomCover && !validCustomCover && <span>有効な https:// の画像URLを入力してください。</span>}
                  {validCustomCover && customCoverStatus === 'loading' && <small className="checking">画像を確認しています…</small>}
                  {validCustomCover && customCoverStatus === 'error' && <span>画像を読み込めません。Webページではなく画像自体のURLを指定してください。</span>}
                  {customCoverReady && <small className="success">✓ この表紙を使用できます</small>}
                </label>
              )}
              <button className="card-add-button" disabled={exists || (hasCustomCover && !customCoverReady)} onClick={() => onAdd({ ...book, coverUrl: customCoverReady ? normalizedCustomCover : book.coverUrl })}>
                {exists ? '本棚に追加済み' : 'この本を追加'}
              </button>
              {exists && <span className="duplicate-note">この本はすでに本棚にあります</span>}
            </div>
          </article>
        )
      })}
    </div>
  )
}
