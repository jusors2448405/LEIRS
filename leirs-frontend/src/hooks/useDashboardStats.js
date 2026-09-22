import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Fetches all dashboard statistics from public.incidents in two queries:
 *  1. Aggregate counts grouped by status  → derives all stat card numbers
 *  2. Five most-recent incidents           → feeds dashboard tables / feeds
 *
 * Returns:
 *  stats   – { total, pending, underInvestigation, forMediation,
 *               resolved, closed, today }
 *  recent  – array of the 5 newest incident rows (full columns)
 *  loading – boolean
 *  error   – string | null
 *  refetch – call to manually re-run both queries
 */
const useDashboardStats = () => {
  const [stats, setStats]     = useState(null)
  const [recent, setRecent]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    const todayISO = new Date().toISOString().slice(0, 10)

    // ── Query 1: all rows we need for counts (id + status + priority + incident_date)
    //    We pull these light columns instead of COUNT(*) per status so we can
    //    derive every counter in JS without multiple round-trips.
    const { data: countData, error: countError } = await supabase
      .from('incidents')
      .select('id, status, priority, incident_date')

    if (countError) {
      setError(countError.message)
      setLoading(false)
      return
    }

    const rows = countData || []

    const total             = rows.length
    const pending           = rows.filter(r => r.status === 'Pending').length
    const underInvestigation = rows.filter(r => r.status === 'Under Investigation').length
    const forMediation      = rows.filter(r => r.status === 'For Mediation').length
    const resolved          = rows.filter(r => r.status === 'Resolved').length
    const closed            = rows.filter(r => r.status === 'Closed').length
    // "Active" = anything not yet resolved or closed
    const active            = rows.filter(r => !['Resolved', 'Closed'].includes(r.status)).length
    // Today's incidents (by incident_date)
    const today             = rows.filter(r => r.incident_date === todayISO).length

    setStats({
      total,
      pending,
      underInvestigation,
      forMediation,
      resolved,
      closed,
      active,
      today,
    })

    // ── Query 2: 5 most-recent full rows for dashboard tables
    const { data: recentData, error: recentError } = await supabase
      .from('incidents')
      .select('id, incident_number, incident_type, incident_date, location, complainant_name, priority, status, created_by, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      setError(recentError.message)
    } else {
      setRecent(recentData || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { stats, recent, loading, error, refetch: fetchAll }
}

export default useDashboardStats
