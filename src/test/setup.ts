import '@testing-library/jest-dom/vitest'
import '@/lib/i18n' // initialize the i18next instance for components under test

// jsdom has no scrollTo — TanStack Router calls it on navigation.
window.scrollTo ??= (() => undefined) as typeof window.scrollTo

// jsdom ships neither IntersectionObserver, ResizeObserver, nor matchMedia —
// motion (and anything scroll/viewport-aware) needs stubs to render.

class ObserverStub {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds: readonly number[] = []
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

globalThis.IntersectionObserver ??= ObserverStub as unknown as typeof IntersectionObserver
globalThis.ResizeObserver ??= ObserverStub as unknown as typeof ResizeObserver

window.matchMedia ??= ((query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList) as typeof window.matchMedia
