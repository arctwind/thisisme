import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

const STORAGE_KEY = 'thisisme-theme'
const DEFAULT_THEME = 'default'

interface ThemeContextValue {
  themeId: string
  setThemeId: (id: string) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: DEFAULT_THEME,
  setThemeId: () => {},
})

function getInitialTheme(): string {
  if (typeof localStorage === 'undefined') return DEFAULT_THEME
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState(getInitialTheme)

  const setThemeId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id)
    setThemeIdState(id)
  }, [])

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
