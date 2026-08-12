import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import type { BookcaseNames, BookshelfBackup, BookshelfBook } from '../types/book'
import { createBackup, parseBackup } from '../utils/storage'
import { Modal } from './Modal'

interface Props {
  books: BookshelfBook[]
  bookcaseNames: BookcaseNames
  onClose: () => void
  onSaveNames: (names: BookcaseNames) => void
  onRestore: (backup: BookshelfBackup) => void
}

export function BookshelfSettingsModal({ books, bookcaseNames, onClose, onSaveNames, onRestore }: Props) {
  const [names, setNames] = useState<BookcaseNames>(bookcaseNames)
  const [backup, setBackup] = useState<BookshelfBackup | null>(null)
  const [importError, setImportError] = useState('')
  const [confirmingRestore, setConfirmingRestore] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setNames(bookcaseNames), [bookcaseNames])

  const updateName = (index: number, value: string) => {
    setNames((current) => current.map((name, nameIndex) => nameIndex === index ? value : name) as BookcaseNames)
  }

  const saveNames = () => {
    const normalized = names.map((name, index) => name.trim().slice(0, 30) || `本棚 ${index + 1}`) as BookcaseNames
    setNames(normalized)
    onSaveNames(normalized)
  }

  const exportBackup = () => {
    const data = JSON.stringify(createBackup(books, bookcaseNames), null, 2)
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `my-bookshelf-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const selectBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setBackup(null)
    setConfirmingRestore(false)
    setImportError('')
    if (!file) return
    try {
      const parsed = parseBackup(await file.text())
      setBackup(parsed)
    } catch (reason) {
      setImportError(reason instanceof Error ? reason.message : 'バックアップを読み取れませんでした。')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <Modal title="本棚の設定" onClose={onClose}>
      <section className="settings-section" aria-labelledby="bookcase-names-title">
        <div className="settings-section-heading">
          <h3 id="bookcase-names-title">本棚の名前</h3>
          <p>30文字まで入力できます。</p>
        </div>
        <div className="bookcase-name-fields">
          {names.map((name, index) => (
            <label key={index}>本棚 {index + 1}
              <input value={name} onChange={(event) => updateName(index, event.target.value)} maxLength={30} />
            </label>
          ))}
        </div>
        <button type="button" className="secondary-button settings-save-button" onClick={saveNames}>名前を保存</button>
      </section>

      <section className="settings-section backup-section" aria-labelledby="backup-title">
        <div className="settings-section-heading">
          <h3 id="backup-title">バックアップと復元</h3>
          <p>本・配置・読書記録・本棚名をJSONファイルに保存します。</p>
        </div>
        <div className="backup-actions">
          <button type="button" className="secondary-button" onClick={exportBackup}>バックアップを書き出す</button>
          <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}>バックアップを読み込む</button>
          <input ref={fileInputRef} className="sr-only" type="file" accept="application/json,.json" onChange={selectBackup} />
        </div>
        <p className="backup-privacy">ファイルには感想などの個人データが含まれます。共有せず、安全な場所に保管してください。</p>
        {importError && <p className="backup-message error" role="alert">{importError}</p>}
        {backup && (
          <div className="restore-preview" role="status">
            <strong>バックアップを確認しました</strong>
            <span>{backup.books.length}冊・{new Date(backup.exportedAt).toLocaleDateString('ja-JP')}作成</span>
            {!confirmingRestore ? (
              <button type="button" className="secondary-button" onClick={() => setConfirmingRestore(true)}>このデータを復元</button>
            ) : (
              <div className="restore-confirm" role="alert">
                <p>現在の本棚を、このバックアップで置き換えます。よろしいですか？</p>
                <div><button type="button" className="delete-button" onClick={() => onRestore(backup)}>置き換えて復元</button><button type="button" className="text-action" onClick={() => setConfirmingRestore(false)}>戻る</button></div>
              </div>
            )}
          </div>
        )}
      </section>
      <div className="settings-footer"><button type="button" className="primary-button" onClick={onClose}>閉じる</button></div>
    </Modal>
  )
}
