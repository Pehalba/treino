export function youtubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/)
  return match?.[1] ?? null
}

export function youtubeEmbedUrl(url: string): string | null {
  const id = youtubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}

export function youtubeWatchUrl(url: string): string {
  const id = youtubeId(url)
  return id ? `https://www.youtube.com/watch?v=${id}` : url
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function inviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
