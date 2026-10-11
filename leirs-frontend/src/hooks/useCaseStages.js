import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Manages workflow stages for barangay mediation: summons, hearings, mediation, and resolution.
 *
 * @param {string|null} incidentId — uuid of the selected incident
 *
 * Returns:
 *   stages: {
 *     summons:      array of case_summons rows,
 *     hearings:     array of barangay_hearings rows,
 *     mediations:   array of mediation_records rows,
 *   }
 *   loading        — true while fetching any stage
 *   saving         — true while insert/update is in flight
 *   error          — string | null
 *   refetchAll     — re-fetch all stages manually
 *   addSummons(fields)              → { error }
 *   updateSummons(id, fields)       → { error }
 *   addHearing(fields)              → { error }
 *   updateHearing(id, fields)       → { error }
 *   addMediation(fields)            → { error }
 *   updateMediation(id, fields)     → { error }
 *
 * Summons statuses: 'Issued', 'Served', 'NotServed'
 * Hearing outcomes: 'Resolved', 'NotResolved', 'Cancelled'
 * Mediation outcomes: 'Success', 'Partial', 'Failed'
 */
const useCaseStages = (incidentId) => {
  const [stages, setStages] = useState({
    summons: [],
    hearings: [],
    mediations: [],
    resolutions: [],
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // ── Fetch all stages ──────────────────────────────────────────────────────

  const fetchAllStages = useCallback(async () => {
    if (!incidentId) {
      setStages({ summons: [], hearings: [], mediations: [], resolutions: [] })
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch summons
      const { data: summonsData, error: summonsError } = await supabase
        .from('case_summons')
        .select('*')
        .eq('incident_id', incidentId)
        .order('issued_date', { ascending: false })

      // Fetch hearings
      const { data: hearingsData, error: hearingsError } = await supabase
        .from('barangay_hearings')
        .select('*')
        .eq('incident_id', incidentId)
        .order('scheduled_date', { ascending: false })

      // Fetch mediations
      const { data: mediationsData, error: mediationsError } = await supabase
        .from('mediation_records')
        .select('*')
        .eq('incident_id', incidentId)
        .order('mediation_date', { ascending: false })

      // Fetch resolutions
      const { data: resolutionsData, error: resolutionsError } = await supabase
        .from('case_resolutions')
        .select('*')
        .eq('incident_id', incidentId)
        .order('resolution_date', { ascending: false })

      if (summonsError || hearingsError || mediationsError || resolutionsError) {
        const errorMsg = summonsError?.message || hearingsError?.message || mediationsError?.message || resolutionsError?.message
        setError(errorMsg)
      }

      setStages({
        summons: summonsData || [],
        hearings: hearingsData || [],
        mediations: mediationsData || [],
        resolutions: resolutionsData || [],
      })
    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
  }, [incidentId])

  useEffect(() => {
    fetchAllStages()
  }, [fetchAllStages])

  // ── Summons operations ────────────────────────────────────────────────────

  /**
   * @param {{
   *   respondent_id?: string,
   *   summons_number?: string,
   *   issued_date?: string,
   *   status?: string,
   *   service_notes?: string,
   *   created_by?: string
   * }} fields
   * @returns {{ error: string|null }}
   */
  const addSummons = async (fields) => {
    if (!incidentId) return { error: 'No incident selected.' }

    setSaving(true)
    setError(null)

    // Generate unique summons number if not provided
    let summonsNumber = fields.summons_number
    if (!summonsNumber) {
      const now = new Date()
      const yyyy = String(now.getFullYear())
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      const arr = new Uint32Array(1)
      try {
        crypto.getRandomValues(arr)
      } catch {
        arr[0] = Math.random() * 0xffffffff
      }
      const seq = String(arr[0] % 10000).padStart(4, '0')
      summonsNumber = `SUM-${yyyy}-${mm}${dd}-${seq}`
    }

    let lastError = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error: insertError } = await supabase
        .from('case_summons')
        .insert([{
          incident_id: incidentId,
          respondent_id: fields.respondent_id || null,
          summons_number: summonsNumber,
          issued_date: fields.issued_date || new Date().toISOString().split('T')[0],
          status: fields.status || 'Issued',
          service_notes: fields.service_notes || null,
          created_by: fields.created_by || null,
        }])
        .select('*')
        .single()

      if (!insertError) {
        setSaving(false)
        setStages((prev) => ({
          ...prev,
          summons: [data, ...prev.summons],
        }))
        return { error: null }
      }

      lastError = insertError
      if (insertError.code !== '23505') break // Not a unique constraint violation
    }

    setSaving(false)
    const msg = lastError?.message || 'Failed to add summons.'
    setError(msg)
    return { error: msg }
  }

  /**
   * @param {string} summonsId — uuid of the case_summons row
   * @param {{ respondent_id?: string, issued_date?: string, status?: string, served_date?: string, service_notes?: string }} fields
   * @returns {{ error: string|null }}
   */
  const updateSummons = async (summonsId, fields) => {
    setSaving(true)
    setError(null)

    const updateFields = {}
    if (fields.respondent_id !== undefined) updateFields.respondent_id = fields.respondent_id
    if (fields.issued_date !== undefined) updateFields.issued_date = fields.issued_date
    if (fields.status !== undefined) updateFields.status = fields.status
    if (fields.served_date !== undefined) updateFields.served_date = fields.served_date
    if (fields.service_notes !== undefined) updateFields.service_notes = fields.service_notes

    const { data, error: updateError } = await supabase
      .from('case_summons')
      .update(updateFields)
      .eq('id', summonsId)
      .select('*')
      .single()

    setSaving(false)

    if (updateError) {
      const msg = updateError.message
      setError(msg)
      return { error: msg }
    }

    setStages((prev) => ({
      ...prev,
      summons: prev.summons.map((s) => (s.id === summonsId ? data : s)),
    }))
    return { error: null }
  }

  // ── Hearing operations ────────────────────────────────────────────────────

  /**
   * @param {{
   *   scheduled_date: string,
   *   scheduled_time: string,
   *   location: string,
   *   presiding_official: string,
   *   notes?: string,
   *   created_by?: string
   * }} fields
   * @returns {{ error: string|null }}
   */
  const addHearing = async (fields) => {
    if (!incidentId) return { error: 'No incident selected.' }
    if (!fields.scheduled_date) return { error: 'Scheduled date is required.' }
    if (!fields.location?.trim()) return { error: 'Location is required.' }
    if (!fields.presiding_official?.trim()) return { error: 'Presiding official is required.' }

    setSaving(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('barangay_hearings')
      .insert([{
        incident_id: incidentId,
        scheduled_date: fields.scheduled_date,
        scheduled_time: fields.scheduled_time,
        location: fields.location.trim(),
        presiding_official: fields.presiding_official.trim(),
        notes: fields.notes || null,
        created_by: fields.created_by || null,
      }])
      .select('*')
      .single()

    setSaving(false)

    if (insertError) {
      const msg = insertError.message
      setError(msg)
      return { error: msg }
    }

    setStages((prev) => ({
      ...prev,
      hearings: [data, ...prev.hearings],
    }))
    return { error: null }
  }

  /**
   * @param {string} hearingId — uuid of the barangay_hearings row
   * @param {{
   *   outcome?: string,
   *   conducted?: boolean,
   *   conducted_date?: string,
   *   notes?: string,
   *   attendees_complainant?: boolean,
   *   attendees_respondent?: boolean,
   *   attendees_barangay_official?: boolean
   * }} fields
   * @returns {{ error: string|null }}
   */
  const updateHearing = async (hearingId, fields) => {
    setSaving(true)
    setError(null)

    const updateFields = {}
    if (fields.outcome !== undefined) updateFields.outcome = fields.outcome
    if (fields.conducted !== undefined) updateFields.conducted = fields.conducted
    if (fields.conducted_date !== undefined) updateFields.conducted_date = fields.conducted_date
    if (fields.notes !== undefined) updateFields.notes = fields.notes
    if (fields.attendees_complainant !== undefined) updateFields.attendees_complainant = fields.attendees_complainant
    if (fields.attendees_respondent !== undefined) updateFields.attendees_respondent = fields.attendees_respondent
    if (fields.attendees_barangay_official !== undefined) updateFields.attendees_barangay_official = fields.attendees_barangay_official

    const { data, error: updateError } = await supabase
      .from('barangay_hearings')
      .update(updateFields)
      .eq('id', hearingId)
      .select('*')
      .single()

    setSaving(false)

    if (updateError) {
      const msg = updateError.message
      setError(msg)
      return { error: msg }
    }

    setStages((prev) => ({
      ...prev,
      hearings: prev.hearings.map((h) => (h.id === hearingId ? data : h)),
    }))
    return { error: null }
  }

  // ── Mediation operations ──────────────────────────────────────────────────

  /**
   * @param {{
   *   mediator_name: string,
   *   mediation_date: string,
   *   mediation_time?: string,
   *   outcome: 'Success' | 'Partial' | 'Failed',
   *   agreement_text?: string,
   *   settlement_amount?: number,
   *   agreed_terms?: string,
   *   notes?: string,
   *   created_by?: string
   * }} fields
   * @returns {{ error: string|null }}
   */
  const addMediation = async (fields) => {
    if (!incidentId) return { error: 'No incident selected.' }
    if (!fields.mediator_name?.trim()) return { error: 'Mediator name is required.' }
    if (!fields.mediation_date) return { error: 'Mediation date is required.' }
    if (!fields.outcome) return { error: 'Outcome is required.' }

    setSaving(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('mediation_records')
      .insert([{
        incident_id: incidentId,
        mediator_name: fields.mediator_name.trim(),
        mediation_date: fields.mediation_date,
        mediation_time: fields.mediation_time || null,
        outcome: fields.outcome,
        agreement_text: fields.agreement_text || null,
        settlement_amount: fields.settlement_amount || null,
        agreed_terms: fields.agreed_terms || null,
        notes: fields.notes || null,
        created_by: fields.created_by || null,
      }])
      .select('*')
      .single()

    setSaving(false)

    if (insertError) {
      const msg = insertError.message
      setError(msg)
      return { error: msg }
    }

    setStages((prev) => ({
      ...prev,
      mediations: [data, ...prev.mediations],
    }))
    return { error: null }
  }

  /**
   * @param {string} mediationId — uuid of the mediation_records row
   * @param {{
   *   outcome?: string,
   *   agreement_text?: string,
   *   settlement_amount?: number,
   *   agreed_terms?: string,
   *   notes?: string,
   *   complainant_present?: boolean,
   *   respondent_present?: boolean
   * }} fields
   * @returns {{ error: string|null }}
   */
  const updateMediation = async (mediationId, fields) => {
    setSaving(true)
    setError(null)

    const updateFields = {}
    if (fields.outcome !== undefined) updateFields.outcome = fields.outcome
    if (fields.agreement_text !== undefined) updateFields.agreement_text = fields.agreement_text
    if (fields.settlement_amount !== undefined) updateFields.settlement_amount = fields.settlement_amount
    if (fields.agreed_terms !== undefined) updateFields.agreed_terms = fields.agreed_terms
    if (fields.notes !== undefined) updateFields.notes = fields.notes
    if (fields.complainant_present !== undefined) updateFields.complainant_present = fields.complainant_present
    if (fields.respondent_present !== undefined) updateFields.respondent_present = fields.respondent_present

    const { data, error: updateError } = await supabase
      .from('mediation_records')
      .update(updateFields)
      .eq('id', mediationId)
      .select('*')
      .single()

    setSaving(false)

    if (updateError) {
      const msg = updateError.message
      setError(msg)
      return { error: msg }
    }

    setStages((prev) => ({
      ...prev,
      mediations: prev.mediations.map((m) => (m.id === mediationId ? data : m)),
    }))
    return { error: null }
  }

  // ── Resolution operations ─────────────────────────────────────────────────

  /**
   * @param {{
   *   resolution_type: string,
   *   resolution_date: string,
   *   resolution_description: string,
   *   recommendations?: string,
   *   complainant_email?: string,
   *   created_by?: string
   * }} fields
   * @returns {{ error: string|null }}
   */
  const addResolution = async (fields) => {
    if (!incidentId) return { error: 'No incident selected.' }
    if (!fields.resolution_type) return { error: 'Resolution type is required.' }
    if (!fields.resolution_date) return { error: 'Resolution date is required.' }
    if (!fields.resolution_description?.trim()) return { error: 'Resolution description is required.' }

    setSaving(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('case_resolutions')
      .insert([{
        incident_id: incidentId,
        resolution_type: fields.resolution_type,
        resolution_date: fields.resolution_date,
        resolution_description: fields.resolution_description.trim(),
        recommendations: fields.recommendations?.trim() || null,
        complainant_email: fields.complainant_email?.trim() || null,
        created_by: fields.created_by || null,
      }])
      .select('*')
      .single()

    setSaving(false)

    if (insertError) {
      const msg = insertError.message
      setError(msg)
      return { error: msg }
    }

    setStages((prev) => ({
      ...prev,
      resolutions: [data, ...prev.resolutions],
    }))
    return { error: null }
  }

  /**
   * @param {string} resolutionId — uuid of the case_resolutions row
   * @param {{
   *   resolution_type?: string,
   *   resolution_date?: string,
   *   resolution_description?: string,
   *   recommendations?: string,
   *   complainant_email?: string
   * }} fields
   * @returns {{ error: string|null }}
   */
  const updateResolution = async (resolutionId, fields) => {
    setSaving(true)
    setError(null)

    const updateFields = {}
    if (fields.resolution_type !== undefined) updateFields.resolution_type = fields.resolution_type
    if (fields.resolution_date !== undefined) updateFields.resolution_date = fields.resolution_date
    if (fields.resolution_description !== undefined) updateFields.resolution_description = fields.resolution_description
    if (fields.recommendations !== undefined) updateFields.recommendations = fields.recommendations
    if (fields.complainant_email !== undefined) updateFields.complainant_email = fields.complainant_email

    const { data, error: updateError } = await supabase
      .from('case_resolutions')
      .update(updateFields)
      .eq('id', resolutionId)
      .select('*')
      .single()

    setSaving(false)

    if (updateError) {
      const msg = updateError.message
      setError(msg)
      return { error: msg }
    }

    setStages((prev) => ({
      ...prev,
      resolutions: prev.resolutions.map((r) => (r.id === resolutionId ? data : r)),
    }))
    return { error: null }
  }

  return {
    stages,
    loading,
    saving,
    error,
    refetchAll: fetchAllStages,
    addSummons,
    updateSummons,
    addHearing,
    updateHearing,
    addMediation,
    updateMediation,
    addResolution,
    updateResolution,
  }
}

export default useCaseStages
