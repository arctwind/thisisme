import { useTheme } from './ThemeContext'
import { THEMES } from './registry'

export function ThemeSwitcher() {
  const { themeId, setThemeId } = useTheme()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        zIndex: 9999,
        display: 'flex',
        gap: 6,
      }}
    >
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          onClick={() => setThemeId(theme.id)}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            border: '1px solid #ccc',
            borderRadius: 4,
            background: theme.id === themeId ? '#8b7da8' : '#fff',
            color: theme.id === themeId ? '#fff' : '#333',
            cursor: 'pointer',
          }}
        >
          {theme.name}
        </button>
      ))}
    </div>
  )
}
