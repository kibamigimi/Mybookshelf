const MAX_URL_LENGTH = 2048

export const normalizeCoverUrl = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return ''

  try {
    const url = new URL(trimmed)
    if (url.protocol === 'http:') url.protocol = 'https:'
    if (url.protocol !== 'https:' || url.username || url.password) return ''
    return url.toString()
  } catch {
    return ''
  }
}

export const isValidCoverUrl = (value: string): boolean => Boolean(normalizeCoverUrl(value))
