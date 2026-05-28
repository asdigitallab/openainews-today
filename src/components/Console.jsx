import { useEffect, useRef } from 'react'

export default function Console({ lines }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  return (
    <div id="console" ref={ref}>
      {lines.map((l, i) => (
        <span key={l.key} className={l.cls}>
          {(l.inline ? '' : i > 0 ? '\n' : '') + l.text}
        </span>
      ))}
    </div>
  )
}
