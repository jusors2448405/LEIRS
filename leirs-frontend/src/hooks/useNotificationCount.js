import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook to get notification count for badge display
 * Returns the total count of actionable notifications
 */
const useNotificationCount = (user) => {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !user.role) {
      setCount(0)
      setLoading(false)
      return
    }

    fetchNotificationCount()

    // Refresh count every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000)
    return () => clearInterval(interval)
  }, [user?.role, user?.full_name, user?.name])

  const fetchNotificationCount = async () => {
    let totalCount = 0

    try {
      const role = user?.role

      if (role === 'admin') {
        // Count urgent incidents
        const { count: urgentCount, error: urgentErr } = await supabase
          .from('incidents')
          .select('*', { count: 'exact', head: true })
          .eq('priority', 'Urgent')
          .in('status', ['Pending', 'Under Investigation'])

        if (!urgentErr && urgentCount) totalCount += urgentCount

        // Count pending incidents
        const { count: pendingCount, error: pendErr } = await supabase
          .from('incidents')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Pending')

        if (!pendErr && pendingCount) totalCount += pendingCount

        // Count high priority
        const { count: highCount, error: hpErr } = await supabase
          .from('incidents')
          .select('*', { count: 'exact', head: true })
          .eq('priority', 'High')
          .in('status', ['Pending', 'Under Investigation'])

        if (!hpErr && highCount) totalCount += highCount

      } else if (role === 'encoder') {
        // Count pending
        const { count: pendingCount, error: pendErr } = await supabase
          .from('incidents')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Pending')

        if (!pendErr && pendingCount) totalCount += pendingCount

        // Count high priority
        const { count: highCount, error: hpErr } = await supabase
          .from('incidents')
          .select('*', { count: 'exact', head: true })
          .eq('priority', 'High')
          .in('status', ['Pending', 'Under Investigation'])

        if (!hpErr && highCount) totalCount += highCount

      } else if (role === 'officer') {
        const officerName = user?.full_name || user?.name

        if (officerName) {
          // Count active dispatches
          const { count: dispatchCount, error: dispErr } = await supabase
            .from('dispatch')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_officer', officerName)
            .in('status', ['Pending', 'En Route', 'On Scene'])

          if (!dispErr && dispatchCount) totalCount += dispatchCount

          // Count assigned cases
          const { count: caseCount, error: caseErr } = await supabase
            .from('incidents')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_officer', officerName)
            .in('status', ['Under Investigation', 'For Mediation'])

          if (!caseErr && caseCount) totalCount += caseCount
        }
      }

      setCount(totalCount)
    } catch (error) {
      console.error('Error fetching notification count:', error)
      setCount(0)
    }

    setLoading(false)
  }

  return { count, loading, refresh: fetchNotificationCount }
}

export default useNotificationCount
