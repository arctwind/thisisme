import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import './index.css'

const DOT_DIAMETER = 8
const PAGE_ANIM_MS = 700

/** HSL values matching the CSS --accent variable in light mode. */
const COLOR_START = { h: 263, s: 20, l: 57 }
const COLOR_END = { h: 30, s: 55, l: 50 }

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** Shared single-scroller animation state — the app has one #root scroller. */
const pager = { isAnimating: false, rafId: 0 }

/** Scroll offset at which each page aligns to the top of the viewport. */
function pageTops(root: HTMLElement): number[] {
  const base = root.getBoundingClientRect().top
  return Array.from(root.querySelectorAll<HTMLElement>('.page')).map(
    (page) => page.getBoundingClientRect().top - base + root.scrollTop,
  )
}

function nearestPageIndex(root: HTMLElement): number {
  const tops = pageTops(root)
  const y = root.scrollTop
  let index = 0
  let best = Infinity
  tops.forEach((top, i) => {
    const distance = Math.abs(top - y)
    if (distance < best) {
      best = distance
      index = i
    }
  })
  return index
}

function animateScrollTo(root: HTMLElement, endY: number): void {
  cancelAnimationFrame(pager.rafId)
  const startY = root.scrollTop
  const distance = endY - startY
  if (Math.abs(distance) < 1) return

  pager.isAnimating = true
  const start = performance.now()

  const step = (now: number) => {
    const t = Math.min(1, (now - start) / PAGE_ANIM_MS)
    root.scrollTop = startY + distance * easeInOutCubic(t)
    if (t < 1) {
      pager.rafId = requestAnimationFrame(step)
    } else {
      pager.isAnimating = false
    }
  }

  pager.rafId = requestAnimationFrame(step)
}

/** Drives full-page eased scrolling for wheel, keyboard, and touch input. */
function useSmoothPaging() {
  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return

    const go = (direction: number) => {
      if (pager.isAnimating) return
      const tops = pageTops(root)
      const current = nearestPageIndex(root)
      const next = Math.max(0, Math.min(tops.length - 1, current + direction))
      if (next !== current) animateScrollTo(root, tops[next])
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (pager.isAnimating || Math.abs(e.deltaY) < 4) return
      go(e.deltaY > 0 ? 1 : -1)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        go(-1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        if (!pager.isAnimating) animateScrollTo(root, pageTops(root)[0])
      } else if (e.key === 'End') {
        e.preventDefault()
        const tops = pageTops(root)
        if (!pager.isAnimating) animateScrollTo(root, tops[tops.length - 1])
      }
    }

    let touchStartY = 0
    let ignoreTouch = false

    const onTouchStart = (e: TouchEvent) => {
      ignoreTouch = !!(e.target as Element | null)?.closest('.page-indicator')
      touchStartY = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!ignoreTouch) e.preventDefault()
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (ignoreTouch) return
      const dy = touchStartY - e.changedTouches[0].clientY
      if (Math.abs(dy) > 40) go(dy > 0 ? 1 : -1)
    }

    root.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    root.addEventListener('touchstart', onTouchStart, { passive: true })
    root.addEventListener('touchmove', onTouchMove, { passive: false })
    root.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      cancelAnimationFrame(pager.rafId)
      pager.isAnimating = false
      root.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      root.removeEventListener('touchstart', onTouchStart)
      root.removeEventListener('touchmove', onTouchMove)
      root.removeEventListener('touchend', onTouchEnd)
    }
  }, [])
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
    cancelAnimationFrame(pager.rafId)
    pager.isAnimating = false
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
    const root = document.getElementById('root')
    if (root) animateScrollTo(root, pageTops(root)[nearestPageIndex(root)])
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
  useSmoothPaging()

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
        <div className="poem">
          <h2 className="poem-title">Nothing Gold Can Stay</h2>
          <span className="poem-author">Robert Frost</span>
          <div className="poem-divider" />
          <p className="poem-line">Nature's first green is gold,</p>
          <p className="poem-line">Her hardest hue to hold.</p>
          <p className="poem-line">Her early leaf's a flower;</p>
          <p className="poem-line">But only so an hour.</p>
          <p className="poem-line">Then leaf subsides to leaf.</p>
          <p className="poem-line">So Eden sank to grief,</p>
          <p className="poem-line">So dawn goes down to day.</p>
          <p className="poem-line">Nothing gold can stay.</p>
        </div>
        <footer className="site-footer">
          <div className="footer-links">
            <a className="footer-link" href="https://github.com/arctwind/thisisme" target="_blank" rel="noopener">GitHub</a>
            <a className="footer-link" href="#">Link 1</a>
            <a className="footer-link" href="#">Link 2</a>
          </div>
        </footer>
      </section>
    </>
  )
}

export default App
