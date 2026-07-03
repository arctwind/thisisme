import { lazy, Suspense, useMemo, type ComponentType } from 'react'
import { useTheme } from './ThemeContext'

const DEV_THEME_LOADERS: Record<string, () => Promise<{ default: ComponentType }>> = {
  default: () => import('./default/App'),
}

export function ThemeLoader() {
  if (import.meta.env.DEV) {
    return <DevThemeLoader />
  }
  return <ProdThemeLoader />
}

function DevThemeLoader() {
  const { themeId } = useTheme()

  const ThemeApp = useMemo(() => {
    const loader = DEV_THEME_LOADERS[themeId]
    return loader ? lazy(loader) : null
  }, [themeId])

  if (!ThemeApp) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        Theme &quot;{themeId}&quot; not found.
      </div>
    )
  }

  return (
    <Suspense fallback={null}>
      <ThemeApp />
    </Suspense>
  )
}

function ProdThemeLoader() {
  const themeId = import.meta.env.VITE_THEME || 'default'

  if (themeId === 'default') {
    const DefaultApp = lazy(() => import('./default/App'))
    return (
      <Suspense fallback={null}>
        <DefaultApp />
      </Suspense>
    )
  }

  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      Unknown theme: {themeId}
    </div>
  )
}
