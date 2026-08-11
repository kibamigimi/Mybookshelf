import { useState, type FormEvent } from 'react'
import type { BookSearchResult } from '../types/book'
import { CoverImage } from './CoverImage'
import { normalizeCoverUrl } from '../utils/url'

interface Props {
  onAdd: (book: BookSearchResult) => void
}

export function ManualBookForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [authors, setAuthors] = useState('')
  const [publisher, setPublisher] = useState('')
  const [publishedDate, setPublishedDate] = useState('')
  const [isbn, setIsbn] = useState('')
  const [coverUrl, setCoverUrl] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return
    onAdd({
      googleBooksId: `manual:${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`,
      dataSource: 'manual',
      title: trimmedTitle,
      authors: authors.split(/[、,]/).map((author) => author.trim()).filter(Boolean),
      publisher: publisher.trim(),
      publishedDate: publishedDate.trim(),
      isbn: isbn.replace(/[\s-]/g, ''),
      coverUrl: normalizeCoverUrl(coverUrl),
    })
  }

  return (
    <form className="manual-form" onSubmit={submit}>
      <div className="manual-intro">
        <div className="manual-preview"><CoverImage src={coverUrl.trim()} title={title.trim() || 'タイトル未入力'} /></div>
        <div><p className="eyebrow">MANUAL ENTRY</p><h3>本の情報を入力</h3><p>検索で見つからない本も、タイトルだけで本棚に置けます。</p></div>
      </div>
      <div className="manual-fields">
        <label className="field-wide">タイトル <span>必須</span><input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="本のタイトル" autoFocus /></label>
        <label>著者<input value={authors} onChange={(event) => setAuthors(event.target.value)} placeholder="複数の場合は読点で区切る" /></label>
        <label>出版社<input value={publisher} onChange={(event) => setPublisher(event.target.value)} placeholder="出版社名" /></label>
        <label>出版日<input value={publishedDate} onChange={(event) => setPublishedDate(event.target.value)} placeholder="例：2024-04-10 または 2024" /></label>
        <label>ISBN<input value={isbn} onChange={(event) => setIsbn(event.target.value)} inputMode="numeric" placeholder="ハイフンありでも入力できます" /></label>
        <label className="field-wide">表紙画像URL<input value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} type="url" placeholder="https://example.com/cover.jpg（任意）" /></label>
      </div>
      <div className="manual-actions"><span>未入力の項目はあとから空欄のままでも保存できます。</span><button className="primary-button" type="submit" disabled={!title.trim()}>この本を追加</button></div>
    </form>
  )
}
