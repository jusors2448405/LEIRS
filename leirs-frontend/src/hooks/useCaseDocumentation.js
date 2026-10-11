import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Manages case documentation for a single incident.
 *
 * @param {string|null} incidentId  — uuid of the selected incident
 *
 * Returns:
 *   caseDoc      — the existing case_documentations row, or null
 *   loading      — true while fetching
 *   saving       — true while insert/update is in flight
 *   error        — string | null
 *   fetchCaseDoc — re-fetch manually
 *   createCaseDoc(fields) → { error }
 *   updateCaseDoc(fields) → { error }
 *
 * Status sync:
 *   Every successful create or update also writes the same case_status value
 *   to incidents.status so that dashboards, Incident List, Case Status,
 *   and Analytics all stay consistent.  No schema change is needed — both
 *   columns already exist.
 */
const useCaseDocumentation = (incidentId) => {
  const [caseDoc, setCaseDoc]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)
  const [isDispatched, setIsDispatched] = useState(false)

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchCaseDoc = useCallback(async () => {
    if (!incidentId) {
      setCaseDoc(null)
      setIsDispatched(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('case_documentations')
      .select('*')
      .eq('incident_id', incidentId)
      .maybeSingle()

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setCaseDoc(data ?? null)
    }

    // Check if a dispatch record exists for this incident
    await checkDispatchExists()

    setLoading(false)
  }, [incidentId])

  // ── Check Dispatch Handoff ───────────────────────────────────────────────
  //
  // Determines whether this case has been handed off to Dispatch.
  // Lock condition: A dispatch record exists for this incident_id.
  // Once Dispatch takes over, Case Documentation becomes read-only.

  const checkDispatchExists = useCallback(async () => {
    if (!incidentId) {
      setIsDispatched(false)
      return
    }

    const { data, error: checkError } = await supabase
      .from('dispatch')
      .select('id')
      .eq('incident_id', incidentId)
      .limit(1)
      .maybeSingle()

    if (checkError) {
      // If check fails, err on the side of caution: don't lock
      console.error('Failed to check dispatch status:', checkError)
      setIsDispatched(false)
    } else {
      setIsDispatched(!!data)
    }
  }, [incidentId])

  useEffect(() => {
    fetchCaseDoc()
  }, [fetchCaseDoc])

  // ── Private helper: sync incidents.status ────────────────────────────────
  //
  // Called after every successful case doc create/update.
  // Writes case_status → incidents.status so every page that reads
  // incidents.status (dashboards, Incident List, Case Status, analytics)
  // reflects the latest status immediately after a refresh.
  //
  // This is fire-and-forget from the caller's perspective: if it fails we
  // surface the error but we do NOT roll back the case_documentations write
  // (the case doc is the source of truth; incidents.status is a mirror).

  const syncIncidentStatus = async (newStatus) => {
    if (!incidentId) return null
    const { error: syncError } = await supabase
      .from('incidents')
      .update({ status: newStatus })
      .eq('id', incidentId)
    return syncError
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const generateCaseNumber = () => {
    const now  = new Date()
    const yyyy = String(now.getFullYear())
    const mm   = String(now.getMonth() + 1).padStart(2, '0')
    const dd   = String(now.getDate()).padStart(2, '0')
    const arr  = new Uint32Array(1)
    try { crypto.getRandomValues(arr) } catch { arr[0] = Math.random() * 0xFFFFFFFF }
    const seq  = String(arr[0] % 1000).padStart(3, '0')
    return `CASE-${yyyy}-${mm}${dd}-${seq}`
  }

  // ── Create ────────────────────────────────────────────────────────────────

  const createCaseDoc = async (fields) => {
    setSaving(true)
    setError(null)

    let lastError = null
    const targetStatus = fields.case_status || 'Pending'

    for (let attempt = 0; attempt < 5; attempt++) {
      const caseNumber = generateCaseNumber()

      const { data, error: insertError } = await supabase
        .from('case_documentations')
        .insert([{
          incident_id:      incidentId,
          case_number:      caseNumber,
          assigned_officer: fields.assigned_officer || null,
          case_status:      targetStatus,
          case_notes:       fields.case_notes || null,
        }])
        .select('*')
        .single()

      if (!insertError) {
        setCaseDoc(data)

        // Mirror status onto the incident row
        const syncErr = await syncIncidentStatus(targetStatus)
        if (syncErr) {
          // Non-fatal: case doc was saved, warn via error state but don't fail
          setSaving(false)
          setError(`Case doc saved, but failed to sync incident status: ${syncErr.message}`)
          return { error: null } // case doc itself succeeded
        }

        // ── Auto-create case_parties from incident data (Phase 2) ──────────────────
        // Auto-populate case_parties with complainant and respondent from incidents table
        // This eliminates manual re-entry during Case Parties workflow
        const autoCreateErr = await autoCreateCasePartiesFromIncident()
        if (autoCreateErr) {
          // Non-fatal: case doc created successfully, parties can be added manually
          console.warn('Auto-create parties warning:', autoCreateErr)
        }

        setSaving(false)
        return { error: null }
      }

      lastError = insertError
      if (insertError.code !== '23505') break
    }

    setSaving(false)
    const msg = lastError?.message || 'Failed to create case documentation.'
    setError(msg)
    return { error: msg }
  }

  // ── Auto-create case_parties from incident data ────────────────────────
  // Phase 2: Automatically creates Complainant and Respondent records from
  // incidents table to eliminate manual re-entry in Case Parties tab
  const autoCreateCasePartiesFromIncident = useCallback(async () => {
    if (!incidentId) return null

    try {
      // Fetch the incident to get complainant and respondent info
      const { data: incident, error: incidentError } = await supabase
        .from('incidents')
        .select(
          'complainant_name, complainant_email, complainant_address, ' +
          'respondent_name, respondent_contact, respondent_address'
        )
        .eq('id', incidentId)
        .single()

      if (incidentError) {
        console.warn('Could not fetch incident for party auto-creation:', incidentError.message)
        return null // Non-fatal
      }

      if (!incident) return null

      // Check if parties already exist to avoid duplicates
      const { data: existingParties, error: checkError } = await supabase
        .from('case_parties')
        .select('id')
        .eq('incident_id', incidentId)

      if (checkError) {
        console.warn('Could not check existing parties:', checkError.message)
        return null
      }

      // If parties already exist, don't create duplicates
      if (existingParties && existingParties.length > 0) {
        console.log('Parties already exist for this incident, skipping auto-creation')
        return null
      }

      // Create Complainant party if complainant_name exists
      if (incident.complainant_name && incident.complainant_name.trim()) {
        const { error: complainantError } = await supabase
          .from('case_parties')
          .insert([{
            incident_id: incidentId,
            party_type: 'Complainant',
            name: incident.complainant_name.trim(),
            contact: incident.complainant_contact || null,
            email: incident.complainant_email || null,
          }])

        if (complainantError) {
          console.warn('Failed to create Complainant party:', complainantError.message)
          return complainantError.message
        }
      }

      // Create Respondent party if respondent_name exists
      if (incident.respondent_name && incident.respondent_name.trim()) {
        const { error: respondentError } = await supabase
          .from('case_parties')
          .insert([{
            incident_id: incidentId,
            party_type: 'Respondent',
            name: incident.respondent_name.trim(),
            contact: incident.respondent_contact || null,
            email: null, // Respondent email typically not available at report time
          }])

        if (respondentError) {
          console.warn('Failed to create Respondent party:', respondentError.message)
          return respondentError.message
        }
      }

      console.log('Case parties auto-created successfully from incident data')
      return null // Success
    } catch (err) {
      console.error('Error auto-creating case parties:', err)
      return err.message // Non-fatal
    }
  }, [incidentId])

  // ── Update ────────────────────────────────────────────────────────────────

  const updateCaseDoc = async (fields) => {
    if (!caseDoc?.id) return { error: 'No case documentation to update.' }

    setSaving(true)
    setError(null)

    const targetStatus = fields.case_status ?? caseDoc.case_status

    const { data, error: updateError } = await supabase
      .from('case_documentations')
      .update({
        assigned_officer: fields.assigned_officer ?? caseDoc.assigned_officer,
        case_status:      targetStatus,
        case_notes:       fields.case_notes ?? caseDoc.case_notes,
      })
      .eq('id', caseDoc.id)
      .select('*')
      .single()

    if (updateError) {
      setSaving(false)
      const msg = updateError.message
      setError(msg)
      return { error: msg }
    }

    setCaseDoc(data)

    // Mirror status onto the incident row
    const syncErr = await syncIncidentStatus(targetStatus)
    if (syncErr) {
      setSaving(false)
      setError(`Case doc saved, but failed to sync incident status: ${syncErr.message}`)
      return { error: null } // case doc itself succeeded
    }

    setSaving(false)
    return { error: null }
  }

  return {
    caseDoc,
    loading,
    saving,
    error,
    isDispatched,
    fetchCaseDoc,
    createCaseDoc,
    updateCaseDoc,
    autoCreateCasePartiesFromIncident,
  }
}

export default useCaseDocumentation
