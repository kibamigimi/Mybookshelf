import { useState } from 'react'
import type { BookRecordInput, BookSearchResult } from '../types/book'
import { CoverImage } from './CoverImage'
import { Modal } from './Modal'

interface Props {
  book: BookSearchResult
  onClose: () => void
  onConfirm: (record: BookRecordInput) => void
}

export function AddBookRecordModal({ book, onClose, onConfirm }: Props) {
  const [readDate, setReadDate] = useState('')
  const [rating, setRating] = useState<number>()
  const [note, setNote] = useState('')

  const confirm = () => onConfirm({
    readDate: readDate || undefined,
    rating,
    note: note.trim() || undefined,
  })

  return (
    <Modal title="本の記録を入力" onClose={onClose}>
      <div className="add-record-book">
        <div className="add-record-cover"><CoverImage src={book.coverUrl} title={book.title} /></div>
        <div>
          <p className="eyebrow">NEW BOOK</p>
          <h3>{book.title}</h3>
          <p>{book.authors.join('、') || '著者不明'}</p>
        </div>
      </div>
      <div className="notes-form add-record-form">
        <label>読了日<input type="date" value={readDate} onChange={(event) => setReadDate(event.target.value)} autoFocus /></label>
        <fieldset>
          <legend>評価</legend>
          <div className="rating" aria-label="5段階評価">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" className={value <= (rating ?? 0) ? 'active' : ''} onClick={() => setRating(rating === value ? undefined : value)} aria-label={`評価 ${value}`} aria-pressed={rating === value}>★</button>
            ))}
            {rating && <span>{rating}.0</span>}
          </div>
        </fieldset>
        <label>一言感想<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} placeholder="心に残ったことを、ひとこと。" /><small>{note.length} / 300</small></label>
      </div>
      <div className="add-record-actions">
        <p>記録は空欄のままでも、あとから編集できます。</p>
        <div>
          <button type="button" className="secondary-button" onClick={onClose}>キャンセル</button>
          <button type="button" className="primary-button" onClick={confirm}>本棚に追加</button>
        </div>
      </div>
    </Modal>
  )
}
