import { useEffect, useState } from 'react'
import type { BookshelfBook, BookUpdate } from '../types/book'
import { CoverImage } from './CoverImage'
import { Modal } from './Modal'
import { normalizeCoverUrl } from '../utils/url'

interface Props {
  book: BookshelfBook
  onClose: () => void
  onSave: (update: BookUpdate) => void
  onDelete: () => void
}

export function BookDetailModal({ book, onClose, onSave, onDelete }: Props) {
  const [readDate, setReadDate] = useState(book.readDate ?? '')
  const [rating, setRating] = useState(book.rating)
  const [note, setNote] = useState(book.note ?? '')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [editingCover, setEditingCover] = useState(false)
  const [coverUrl, setCoverUrl] = useState(book.coverUrl)
  const [coverStatus, setCoverStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  useEffect(() => {
    setReadDate(book.readDate ?? '')
    setRating(book.rating)
    setNote(book.note ?? '')
    setConfirmingDelete(false)
    setEditingCover(false)
    setCoverUrl(book.coverUrl)
    setCoverStatus('idle')
  }, [book])

  const trimmedCoverUrl = coverUrl.trim()
  const normalizedCoverUrl = normalizeCoverUrl(trimmedCoverUrl)
  const validCoverUrl = Boolean(normalizedCoverUrl)
  const coverReady = Boolean(trimmedCoverUrl) && validCoverUrl && coverStatus === 'success'
  const coverCanSave = !editingCover || !trimmedCoverUrl || coverReady

  const save = () => {
    if (!coverCanSave) return
    onSave({ readDate: readDate || undefined, rating, note: note.trim() || undefined, coverUrl: editingCover ? normalizedCoverUrl : book.coverUrl })
    onClose()
  }

  return (
    <Modal title="本の記録" onClose={onClose}>
      <div className="detail-layout">
        <div className="detail-cover-column">
          <div className="detail-cover">
            <CoverImage
              src={editingCover && validCoverUrl ? normalizedCoverUrl : book.coverUrl}
              title={book.title}
              onLoadSuccess={() => { if (editingCover && validCoverUrl) setCoverStatus('success') }}
              onLoadError={() => { if (editingCover && validCoverUrl) setCoverStatus('error') }}
            />
          </div>
          <button type="button" className="cover-detail-button" onClick={() => {
            setEditingCover(true)
            setCoverStatus(book.coverUrl ? 'success' : 'idle')
          }}>表紙を変更</button>
        </div>
        <div className="detail-bibliography">
          <p className="eyebrow">BOOK DETAILS</p>
          <h3>{book.title}</h3>
          <p>{book.authors.join('、') || '著者不明'}</p>
          <dl>
            <div><dt>出版社</dt><dd>{book.publisher || '—'}</dd></div>
            <div><dt>出版日</dt><dd>{book.publishedDate || '—'}</dd></div>
          </dl>
        </div>
      </div>
      {editingCover && (
        <div className="detail-cover-editor">
          <label>新しい表紙画像URL
            <input
              type="url"
              value={coverUrl}
              onChange={(event) => {
                const nextUrl = event.target.value
                setCoverUrl(nextUrl)
                setCoverStatus(normalizeCoverUrl(nextUrl) ? 'loading' : 'idle')
              }}
              placeholder="https://example.com/cover.jpg"
              autoFocus
            />
          </label>
          <div className="detail-cover-feedback" aria-live="polite">
            {!trimmedCoverUrl && <span>空欄のまま保存すると表紙を外せます。</span>}
            {trimmedCoverUrl && !validCoverUrl && <span className="error">有効な https:// の画像URLを入力してください。</span>}
            {validCoverUrl && coverStatus === 'loading' && <span>画像を確認しています…</span>}
            {validCoverUrl && coverStatus === 'error' && <span className="error">画像を読み込めません。画像自体のURLを指定してください。</span>}
            {coverReady && <span className="success">✓ この表紙を使用できます</span>}
          </div>
          <button type="button" className="text-action" onClick={() => { setEditingCover(false); setCoverUrl(book.coverUrl); setCoverStatus('idle') }}>変更を取り消す</button>
        </div>
      )}
      <div className="notes-form">
        <label>読了日<input type="date" value={readDate} onChange={(e) => setReadDate(e.target.value)} /></label>
        <fieldset>
          <legend>評価</legend>
          <div className="rating" aria-label="5段階評価">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" className={value <= (rating ?? 0) ? 'active' : ''} onClick={() => setRating(rating === value ? undefined : value)} aria-label={`評価 ${value}`} aria-pressed={rating === value}>★</button>
            ))}
            {rating && <span>{rating}.0</span>}
          </div>
        </fieldset>
        <label>一言感想<textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="心に残ったことを、ひとこと。" /><small>{note.length} / 300</small></label>
      </div>
      <div className="detail-actions">
        {!confirmingDelete ? (
          <button className="delete-button" onClick={() => setConfirmingDelete(true)}>本棚から削除</button>
        ) : (
          <div className="delete-confirm" role="alert"><span>本当に削除しますか？</span><button onClick={onDelete}>削除する</button><button onClick={() => setConfirmingDelete(false)}>戻る</button></div>
        )}
        <button className="primary-button" onClick={save} disabled={!coverCanSave}>記録を保存</button>
      </div>
    </Modal>
  )
}
