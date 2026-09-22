import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Analytics Hook - Comprehensive data for LEIRS Analytics Dashboard
 * Aggregates data from incidents, cases, dispatch, and evidence
 */
const useAnalytics = (filters = {}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch all incidents
      let incidentsQuery = supabase
        .from('incidents')
        .select('id, incident_number, incident_type, incident_date, location, status, priority, created_at')

      // Apply date range filter
      if (filters.startDate) {
        incidentsQuery = incidentsQuery.gte('incident_date', filters.startDate)
      }
      if (filters.endDate) {
        incidentsQuery = incidentsQuery.lte('incident_date', filters.endDate)
      }

      // Apply incident type filter
      if (filters.incidentType && filters.incidentType !== 'all') {
        incidentsQuery = incidentsQuery.eq('incident_type', filters.incidentType)
      }

      // Apply location filter
      if (filters.location && filters.location !== 'all') {
        incidentsQuery = incidentsQuery.ilike('location', `%${filters.location}%`)
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        incidentsQuery = incidentsQuery.eq('status', filters.status)
      }

      const { data: incidents, error: incidentsError } = await incidentsQuery

      if (incidentsError) throw incidentsError

      // Fetch all cases
      const { data: cases, error: casesError } = await supabase
        .from('case_documentations')
        .select('id, case_number, case_status, incident_id, created_at, updated_at')

      if (casesError) throw casesError

      // Fetch all dispatch records
      const { data: dispatches, error: dispatchError } = await supabase
        .from('dispatch')
        .select('id, incident_id, dispatch_status, dispatched_at, officer_name')

      if (dispatchError) throw dispatchError

      // Fetch all evidence
      const { data: evidence, error: evidenceError } = await supabase
        .from('evidence')
        .select('id, incident_id, evidence_type, collected_at, created_at')

      if (evidenceError) throw evidenceError

      // Process and aggregate data
      const analytics = processAnalytics(incidents || [], cases || [], dispatches || [], evidence || [])

      setData(analytics)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err.message)
      setLoading(false)
    }
  }, [filters.startDate, filters.endDate, filters.incidentType, filters.location, filters.status])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return { data, loading, error, refetch: fetchAnalytics }
}

/**
 * Process raw data into analytics structure
 */
const processAnalytics = (incidents, cases, dispatches, evidence) => {
  // Create a map of incident_id to dispatch status for quick lookup
  const dispatchStatusMap = {}
  dispatches.forEach(d => {
    // Only keep the most recent dispatch status per incident
    if (!dispatchStatusMap[d.incident_id]) {
      dispatchStatusMap[d.incident_id] = d.dispatch_status
    }
  })

  /**
   * Normalize location for consistent grouping
   * Extracts primary location (street/road name) and groups similar addresses
   */
  const normalizeLocation = (location) => {
    if (!location || !location.trim()) return 'Unknown'
    
    // Trim and normalize whitespace
    let normalized = location.trim().replace(/\s+/g, ' ')
    
    // Extract primary location before comma (most specific part)
    // Example: "Zabarte Road, Barangay 178, Zone 15" -> "Zabarte Road"
    const beforeComma = normalized.split(',')[0].trim()
    
    // Remove common suffixes that don't add location value
    // Example: "Kiko Wet And Dry Market Near" -> "Kiko Wet And Dry Market"
    const cleaned = beforeComma
      .replace(/\s+(near|beside|front|back|across)$/i, '')
      .trim()
    
    // Convert to Title Case for consistent display
    return cleaned
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Summary Statistics
  // A case is "Active" only if:
  // 1. Its case_status is NOT 'Resolved' or 'Closed', AND
  // 2. Either it has no dispatch OR its dispatch status is NOT 'Completed'
  const activeCases = cases.filter(c => {
    // If case is Resolved or Closed, it's not active
    if (['Resolved', 'Closed'].includes(c.case_status)) {
      return false
    }
    
    // Check if dispatch exists for this case
    const dispatchStatus = dispatchStatusMap[c.incident_id]
    
    // If no dispatch, case is still active based on case_status
    if (!dispatchStatus) {
      return true
    }
    
    // If dispatch exists and is Completed, case is no longer active
    // (even if case_status hasn't been updated to Resolved/Closed yet)
    if (dispatchStatus === 'Completed') {
      return false
    }
    
    // Dispatch exists but not completed, case is still active
    return true
  }).length

  // Count cases where dispatch is completed but case is not formally Resolved/Closed
  const dispatchCompletedAwaitingClosure = cases.filter(c => {
    const dispatchStatus = dispatchStatusMap[c.incident_id]
    return dispatchStatus === 'Completed' && !['Resolved', 'Closed'].includes(c.case_status)
  }).length

  const summary = {
    totalIncidents: incidents.length,
    totalCases: cases.length,
    activeCases: activeCases,
    underInvestigation: cases.filter(c => c.case_status === 'Under Investigation').length,
    dispatchedCases: dispatches.length,
    dispatchCompletedAwaitingClosure: dispatchCompletedAwaitingClosure,
    resolvedCases: cases.filter(c => c.case_status === 'Resolved').length,
    closedCases: cases.filter(c => c.case_status === 'Closed').length,
    pendingCases: cases.filter(c => c.case_status === 'Pending').length,
    totalEvidence: evidence.length
  }

  // Incidents by Type
  const incidentsByType = {}
  incidents.forEach(inc => {
    incidentsByType[inc.incident_type] = (incidentsByType[inc.incident_type] || 0) + 1
  })

  // Incidents by Status
  const incidentsByStatus = {}
  incidents.forEach(inc => {
    incidentsByStatus[inc.status] = (incidentsByStatus[inc.status] || 0) + 1
  })

  // Incidents by Location (with normalization for consistent grouping)
  const incidentsByLocation = {}
  incidents.forEach(inc => {
    const normalizedLoc = normalizeLocation(inc.location)
    incidentsByLocation[normalizedLoc] = (incidentsByLocation[normalizedLoc] || 0) + 1
  })

  // Incidents Over Time (by month)
  const incidentsByMonth = {}
  incidents.forEach(inc => {
    const month = inc.incident_date ? inc.incident_date.substring(0, 7) : 'Unknown' // YYYY-MM
    incidentsByMonth[month] = (incidentsByMonth[month] || 0) + 1
  })

  // Cases by Status
  const casesByStatus = {}
  cases.forEach(c => {
    casesByStatus[c.case_status] = (casesByStatus[c.case_status] || 0) + 1
  })

  // Dispatch by Status
  const dispatchByStatus = {}
  dispatches.forEach(d => {
    dispatchByStatus[d.dispatch_status] = (dispatchByStatus[d.dispatch_status] || 0) + 1
  })

  // Evidence by Type
  const evidenceByType = {}
  evidence.forEach(e => {
    evidenceByType[e.evidence_type] = (evidenceByType[e.evidence_type] || 0) + 1
  })

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentIncidents = incidents.filter(i => new Date(i.created_at) >= sevenDaysAgo).length

  return {
    summary,
    incidentsByType,
    incidentsByStatus,
    incidentsByLocation,
    incidentsByMonth,
    casesByStatus,
    dispatchByStatus,
    evidenceByType,
    recentIncidents,
    // Raw data for exports
    rawData: {
      incidents,
      cases,
      dispatches,
      evidence
    }
  }
}

export default useAnalytics
