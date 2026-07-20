import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface SettingsState {
  theme: Theme
  setTheme: (t: Theme) => void
  /** Banking-style privacy: mask all monetary values behind dots. */
  hideBalances: boolean
  setHideBalances: (v: boolean) => void
  /** Round/compact display: drop cents and compact large numbers. */
  compact: boolean
  setCompact: (v: boolean) => void
}

const SettingsContext = createContext<SettingsState | null>(null)

const THEME_KEY = 'vesta.theme'
const HIDE_KEY = 'vesta.hideBalances'
const COMPACT_KEY = 'vesta.compact'

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', resolveTheme(theme) === 'dark')
}

const readBool = (key: string) => {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

/** Theme + display preferences (language lives in i18next). Persisted. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'dark',
  )
  const [hideBalances, setHideState] = useState<boolean>(() => readBool(HIDE_KEY))
  const [compact, setCompactState] = useState<boolean>(() => readBool(COMPACT_KEY))

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem(THEME_KEY, t)
    setThemeState(t)
  }, [])
  const setHideBalances = useCallback((v: boolean) => {
    localStorage.setItem(HIDE_KEY, v ? '1' : '0')
    setHideState(v)
  }, [])
  const setCompact = useCallback((v: boolean) => {
    localStorage.setItem(COMPACT_KEY, v ? '1' : '0')
    setCompactState(v)
  }, [])

  const value = useMemo<SettingsState>(
    () => ({ theme, setTheme, hideBalances, setHideBalances, compact, setCompact }),
    [theme, setTheme, hideBalances, setHideBalances, compact, setCompact],
  )
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
