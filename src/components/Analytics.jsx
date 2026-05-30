import { useEffect } from 'react'

// Google Analytics 4. Only loads if VITE_GA_ID is set at build time.
// We inject the gtag.js script at runtime to keep static HTML clean when
// analytics aren't configured (e.g. local dev).
export default function Analytics() {
  useEffect(() => {
    const id = import.meta.env.VITE_GA_ID
    if (!id || typeof window === 'undefined') return
    if (window.__gaLoaded) return
    window.__gaLoaded = true

    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
    document.head.appendChild(s)

    window.dataLayer = window.dataLayer || []
    function gtag() { window.dataLayer.push(arguments) }
    window.gtag = gtag
    gtag('js', new Date())
    gtag('config', id, { send_page_view: true })
  }, [])
  return null
}
