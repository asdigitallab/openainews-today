// ASCII progress bar, e.g. bar(70, 10) -> "███████░░░"
export function bar(v, n) {
  const filled = Math.round((v / 100) * n)
  return '█'.repeat(filled) + '░'.repeat(n - filled)
}

export function nowHM() {
  const t = new Date()
  return String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0')
}

export function sigId() {
  return 'SIG-' + String(40000 + Math.floor(Math.random() * 9999))
}
