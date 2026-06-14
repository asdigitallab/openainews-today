import { useEffect, useRef, useState } from 'react'

const CHIPS = ['ingest', 'agi', 'panic', 'calm', 'whoami', 'clear', 'help']
const PLACEHOLDERS = [
  'type a command — or tap one below',
  'try: ingest ↵',
  'try: agi ↵',
  'try: whoami ↵',
  'try: help ↵',
]

export default function CommandLine({ busy, onCommand, lastAck }) {
  const [val, setVal] = useState('')
  const [ph, setPh] = useState(0)
  const [ackVisible, setAckVisible] = useState(false)
  const inputRef = useRef(null)
  const ackTimer = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setPh((p) => (p + 1) % PLACEHOLDERS.length), 2600)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!lastAck || !lastAck.text) return
    setAckVisible(true)
    clearTimeout(ackTimer.current)
    ackTimer.current = setTimeout(() => setAckVisible(false), 2500)
    return () => clearTimeout(ackTimer.current)
  }, [lastAck?.key])

  const onKeyDown = (e) => {
    if (e.key !== 'Enter') return
    onCommand(val)
    setVal('')
  }

  const run = (cmd) => {
    if (busy && cmd === 'ingest') return
    onCommand(cmd)
    inputRef.current?.focus()
  }

  return (
    <div className="cli">
      <div className="cli-inner">
        <div className="cli-chips" role="group" aria-label="terminal commands">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              className={'chip' + (c === 'ingest' ? ' chip-primary' : '')}
              onClick={() => run(c)}
              disabled={busy && c === 'ingest'}
            >
              {c === 'ingest' && busy ? 'ingesting…' : c}
            </button>
          ))}
        </div>
        <div className={'prompt' + (busy ? ' busy' : '')} onClick={() => inputRef.current?.focus()}>
          <span className="ps1">newsroom@today:~$</span>
          <input
            ref={inputRef}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            spellCheck="false"
            placeholder={PLACEHOLDERS[ph]}
          />
        </div>
        <div className="hint">
          {ackVisible && lastAck?.text
            ? <span className="hint-ack">// {lastAck.text}</span>
            : '// this terminal is live — tap a command or type one'}
        </div>
      </div>
    </div>
  )
}
