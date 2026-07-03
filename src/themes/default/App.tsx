import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import './index.css'

const DOT_DIAMETER = 8

/** HSL values matching the CSS --accent variable in light mode. */
const COLOR_START = { h: 263, s: 20, l: 57 }
const COLOR_END = { h: 30, s: 55, l: 50 }

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function PageIndicator() {
  const [dotOffset, setDotOffset] = useState(0)
  const [scrollPercent, setScrollPercent] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const ticking = useRef(false)

  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return

    const updateDot = () => {
      const maxScroll = root.scrollHeight - root.clientHeight
      if (maxScroll <= 0) {
        setDotOffset(0)
        setScrollPercent(0)
        ticking.current = false
        return
      }
      const percentage = root.scrollTop / maxScroll

      const track = trackRef.current
      if (track) {
        const maxOffset = track.clientHeight - DOT_DIAMETER
        setDotOffset(percentage * maxOffset)
      }
      setScrollPercent(percentage)
      ticking.current = false
    }

    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(updateDot)
        ticking.current = true
      }
    }

    root.addEventListener('scroll', onScroll, { passive: true })
    return () => root.removeEventListener('scroll', onScroll)
  }, [])

  const scrollByTrackY = useCallback((clientY: number) => {
    const root = document.getElementById('root')
    const track = trackRef.current
    if (!root || !track) return

    const rect = track.getBoundingClientRect()
    const fraction = (clientY - rect.top) / rect.height
    const clamped = Math.max(0, Math.min(1, fraction))
    const maxScroll = root.scrollHeight - root.clientHeight
    root.scrollTop = clamped * maxScroll
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const el = indicatorRef.current
    if (!el) return
    el.setPointerCapture(e.pointerId)
    scrollByTrackY(e.clientY)
    e.preventDefault()
  }, [scrollByTrackY])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const el = indicatorRef.current
    if (!el || !el.hasPointerCapture(e.pointerId)) return
    scrollByTrackY(e.clientY)
  }, [scrollByTrackY])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const el = indicatorRef.current
    if (!el) return
    el.releasePointerCapture(e.pointerId)
  }, [])

  const dotColor = useMemo(() => {
    const h = Math.round(lerp(COLOR_START.h, COLOR_END.h, scrollPercent))
    const s = Math.round(lerp(COLOR_START.s, COLOR_END.s, scrollPercent))
    const l = Math.round(lerp(COLOR_START.l, COLOR_END.l, scrollPercent))
    return `hsl(${h}, ${s}%, ${l}%)`
  }, [scrollPercent])

  return (
    <div
      className="page-indicator"
      ref={indicatorRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="indicator-track" ref={trackRef}>
        <span
          className="indicator-dot"
          style={{
            transform: `translateY(${dotOffset}px)`,
            background: dotColor,
          }}
        />
      </div>
    </div>
  )
}

function App() {
  return (
    <>
      <PageIndicator />
      <section className="page page-hero">
        <div className="hero">
          <h1 className="title">
            <span className="title-main">Thisis</span>
            <span className="title-me">me</span>
          </h1>
          <div className="divider" />
          <p className="intro">
            <span className="intro-name">Alvinte</span>
            <span className="intro-slogan">Build things that matter.</span>
          </p>
        </div>
      </section>
      <section className="page page-detail">
        <div className="detail-container">
          <h2 className="detail-heading">About</h2>
          <p className="detail-text">More content coming soon.</p>
        </div>
      </section>
    </>
  )
}

export default App
