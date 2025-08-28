// Utility to clear auth data
export function clearAuth() {
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
      
      // Call the logout endpoint to clear the refresh token cookie
      fetch('/api/auth/logout', { method: 'POST' });

      console.log('Cleared auth data from localStorage and cookies')
    } catch (error) {
      console.error('Error clearing auth data:', error)
    }
  }
}
