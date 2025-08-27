// Utility to clear corrupted auth data
export function clearCorruptedAuth() {
  if (typeof window !== 'undefined') {
    try {
      // Clear all auth-related localStorage items
      localStorage.removeItem('nexus-auth')
      localStorage.removeItem('token')
      localStorage.removeItem('auth-token')
      
      // Clear any other potential auth keys
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.includes('auth') || key.includes('token') || key.includes('jwt')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear auth-related cookies
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      console.log('Cleared corrupted auth data from localStorage and cookies')
    } catch (error) {
      console.error('Error clearing auth data:', error)
    }
  }
}