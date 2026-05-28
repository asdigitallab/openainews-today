import { useEffect, useRef, useState } from 'react'

export default function CommandLine({ busy, onCommand }) {
  const [val, setVal] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const onKeyDown = (e) => {
    if (e.key !== 'Enter') return
    onCommand(val)
    setVal('')
  }

  return (
    <div className="cli">
      <div className="cli-inner">
        <div
          className={'prompt' + (busy ? ' busy' : '')}
          onClick={() => inputRef.current?.focus()}
        >
          <span className="ps1">newsroom@today:~$</span>
          <input
            ref={inputRef}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            spellCheck="false"
            placeholder="type 'ingest' to pull a new signal — or 'help'"
          />
        </div>
        <div className="hint">
          commands: <b>ingest</b> · <b>agi</b> · <b>panic</b> · <b>calm</b> ·{' '}
          <b>whoami</b> · <b>clear</b> · <b>help</b>
        </div>
      </div>
    </div>
  )
}
