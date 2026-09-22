/**
 * Theme Management Utility
 * Centralizes theme persistence and application across the LEIRS system
 */

const THEME_KEY = 'leirs_theme'

/**
 * Get the current theme from localStorage
 * @returns {string} 'light' or 'dark'
 */
export const getTheme = () => {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY)
    return savedTheme === 'dark' ? 'dark' : 'light'
  } catch (error) {
    console.error('Failed to get theme:', error)
    return 'light'
  }
}

/**
 * Save theme to localStorage
 * @param {string} theme - 'light' or 'dark'
 */
export const saveTheme = (theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch (error) {
    console.error('Failed to save theme:', error)
  }
}

/**
 * Apply theme to the document
 * @param {string} theme - 'light' or 'dark'
 */
export const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

/**
 * Initialize theme on app startup
 * Reads from localStorage and applies to document
 */
export const initializeTheme = () => {
  const theme = getTheme()
  applyTheme(theme)
  return theme
}

/**
 * Set theme (save and apply)
 * @param {string} theme - 'light' or 'dark'
 */
export const setTheme = (theme) => {
  saveTheme(theme)
  applyTheme(theme)
}

export default {
  getTheme,
  saveTheme,
  applyTheme,
  initializeTheme,
  setTheme
}
