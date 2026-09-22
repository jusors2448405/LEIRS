import { useEffect, useRef, useCallback } from 'react'

/**
 * useIdleTimer Hook
 * 
 * Monitors user activity and triggers logout after specified idle time.
 * Tracks mouse movements, keyboard input, clicks, touches, and scrolls.
 * 
 * @param {Function} onIdle - Callback function to execute when idle timeout occurs
 * @param {number} idleTime - Idle timeout in milliseconds (default: 30 minutes)
 * @param {boolean} enabled - Whether the idle timer is active (default: true)
 */
const useIdleTimer = (onIdle, idleTime = 30 * 60 * 1000, enabled = true) => {
  const timeoutRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  // Reset the idle timer
  const resetTimer = useCallback(() => {
    if (!enabled) return

    lastActivityRef.current = Date.now()

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      console.log('[LEIRS Security] User idle for 30 minutes - logging out')
      onIdle()
    }, idleTime)
  }, [onIdle, idleTime, enabled])

  // Handle user activity
  const handleActivity = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  useEffect(() => {
    if (!enabled) {
      // Clear timeout if disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      return
    }

    // Activity events to monitor
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ]

    // Initialize timer
    resetTimer()

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, true)
    })

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity, true)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, resetTimer, handleActivity])

  // Return function to manually reset timer (useful for programmatic activity)
  return {
    resetTimer,
    getLastActivity: () => lastActivityRef.current
  }
}

export default useIdleTimer
