import { ThemeProvider } from './themes/ThemeContext'
import { ThemeLoader } from './themes/ThemeLoader'
import { ThemeSwitcher } from './themes/ThemeSwitcher'

function App() {
  return (
    <ThemeProvider>
      <ThemeLoader />
      {import.meta.env.DEV && <ThemeSwitcher />}
    </ThemeProvider>
  )
}

export default App
