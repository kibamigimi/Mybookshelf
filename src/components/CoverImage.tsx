import { useEffect, useState } from 'react'
import { normalizeCoverUrl } from '../utils/url'

interface CoverImageProps {
  src: string
  title: string
  className?: string
  onLoadError?: () => void
  onLoadSuccess?: () => void
}

export function CoverImage({ src, title, className = '', onLoadError, onLoadSuccess }: CoverImageProps) {
  const safeSrc = normalizeCoverUrl(src)
  const [failed, setFailed] = useState(!safeSrc)
  useEffect(() => setFailed(!safeSrc), [safeSrc])

  if (failed) {
    return (
      <div className={`cover-fallback ${className}`} role="img" aria-label={`${title}の表紙画像なし`}>
        <span>{title}</span>
        <small>NO COVER</small>
      </div>
    )
  }

  return <img className={className} src={safeSrc} alt={`${title}の表紙`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onLoad={onLoadSuccess} onError={() => { setFailed(true); onLoadError?.() }} draggable={false} />
}
