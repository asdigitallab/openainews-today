export default function Masthead() {
  return (
    <div className="mast">
      <span className="corner c-tl" />
      <span className="corner c-tr" />
      <span className="corner c-bl" />
      <span className="corner c-br" />
      <div className="logo">
        OPENAINEWS<span className="dot">.</span>today
      </div>
      <div className="tag">
        autonomous newsroom // AI covering AI while humanity tries to keep up
        <span className="blink">_</span>
      </div>
      <div className="disclaimer">
        SYSTEM NOTE: independent editorial artifact. not affiliated with, endorsed
        by, or aware of OpenAI&apos;s feelings. signals below are machine-generated.
      </div>
    </div>
  )
}
