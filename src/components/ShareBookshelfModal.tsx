import { useState } from 'react'
import type { BookcaseNames, BookshelfBook } from '../types/book'
import { createShareLink } from '../utils/share'
import { Modal } from './Modal'

interface Props {
  books: BookshelfBook[]
  bookcaseNames: BookcaseNames
  onClose: () => void
}

export function ShareBookshelfModal({ books, bookcaseNames, onClose }: Props) {
  const [link, setLink] = useState('')
  const [status, setStatus] = useState<'idle' | 'creating' | 'ready' | 'copied' | 'error'>('idle')
  const [error, setError] = useState('')

  const create = async () => {
    setStatus('creating')
    setError('')
    try {
      const nextLink = await createShareLink(books, bookcaseNames)
      setLink(nextLink)
      setStatus('ready')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '共有リンクを作成できませんでした。')
      setStatus('error')
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setStatus('copied')
    } catch {
      setError('コピーできませんでした。リンク欄を選択してコピーしてください。')
      setStatus('error')
    }
  }

  return (
    <Modal title="本棚を共有" onClose={onClose}>
      <div className="share-modal-content">
        <div className="share-intro">
          <span className="share-icon" aria-hidden="true">↗</span>
          <div><h3>本棚のリンクを作る</h3><p>3つの本棚を、閲覧専用のリンクとして共有できます。</p></div>
        </div>
        <div className="share-summary">
          <span>共有される内容</span>
          <strong>{books.length}冊・本棚名・タイトル・著者・表紙・配置</strong>
          <p>読了日、評価、感想、ISBN、出版社は共有されません。</p>
        </div>
        <p className="share-privacy">リンクを知っている人は本棚を閲覧できます。リンクを貼る場所の公開範囲に注意してください。共有リンクを開いても、相手の本棚データは変更されません。</p>
        {!link ? (
          <button type="button" className="primary-button share-create-button" onClick={create} disabled={status === 'creating' || books.length === 0}>{status === 'creating' ? 'リンクを作成中…' : '共有リンクを作成'}</button>
        ) : (
          <div className="share-link-result" role="status">
            <label>共有リンク<input value={link} readOnly onFocus={(event) => event.currentTarget.select()} /></label>
            <div className="share-link-actions">
              <button type="button" className="primary-button" onClick={copy}>{status === 'copied' ? '✓ コピーしました' : 'リンクをコピー'}</button>
            </div>
          </div>
        )}
        {books.length === 0 && <p className="share-error" role="alert">共有する本がまだありません。</p>}
        {error && <p className="share-error" role="alert">{error}</p>}
      </div>
    </Modal>
  )
}
