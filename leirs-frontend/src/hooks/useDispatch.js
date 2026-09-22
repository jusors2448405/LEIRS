import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useDispatch
 *
 * Fetches and mutates dispatch records.
 *
 * @param {object} options
 *   incidentId   {string|null}  — when set, fetches dispatches for ONE incident
 *   officerName  {string|null}  — when set, fetches dispatches for ONE officer
 *   fetchAll     {boolean}      — when true, fetches ALL dispatches (admin overview)
 *
 * Returns:
 *   dispatches[]          — array of dispatch rows (with joined incident fields)
 *   loading               — true while fetching
 *   saving                — true while insert/update is in flight
 *   error                 — string | null
 *   refetch               — manually re-run the query
 *   createDispatch(fields)        → { error }
 *   updateDispatchStatus(id, status, notes?) → { error }
 */
const useDispatch = ({ incidentId = null, officerName = null, fetchAll = false } = {}) => {
  const [dispatches, setDispatches] = useState([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)

  // ── Generate dispatch number ──────────────────────────────────────────────

  const generateDispatchNumber = () => {
    const now  = new Date()
    const yyyy = String(now.getFullYear())
    const mm   = String(now.getMonth() + 1).padStart(2, '0')
    const dd   = String(now.getDate()).padStart(2, '0')
    const arr  = new Uint32Array(1)
    try { crypto.getRandomValues(arr) } catch { arr[0] = Math.random() * 0xFFFFFFFF }
    const seq  = String(arr[0] % 10000).padStart(4, '0')
    return `DSP-${yyyy}-${mm}${dd}-${seq}`
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchDispatches = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('dispatch')
      .select(`
        id,
        dispatch_number,
        officer_name,
        dispatch_status,
        notes,
        created_by,
        dispatched_at,
        created_at,
        updated_at,
        incident_id,
        incidents (
          id,
          incident_number,
          incident_type,
          location,
          priority,
          status
        )
      `)
      .order('dispatched_at', { ascending: false })

    if (incidentId)  query = query.eq('incident_id', incidentId)

    // Only apply officer filter when a non-empty name is provided.
    // If officerName is an empty string (no user in localStorage), return
    // nothing rather than all rows — prevents accidental data exposure.
    if (officerName && officerName.trim()) {
      query = query.eq('officer_name', officerName.trim())
    } else if (!fetchAll && !incidentId) {
      // No valid filter at all — return empty rather than all rows
      setDispatches([])
      setLoading(false)
      return
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setDispatches([])
    } else {
      // Flatten the joined incidents array (PostgREST returns 1-to-1 as array)
      const rows = (data || []).map((d) => ({
        ...d,
        incident: Array.isArray(d.incidents)
          ? (d.incidents[0] ?? null)
          : d.incidents ?? null,
      }))
      setDispatches(rows)
    }

    setLoading(false)
  }, [incidentId, officerName, fetchAll]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchDispatches() }, [fetchDispatches])

  // ── Create ────────────────────────────────────────────────────────────────

  /**
   * @param {{
   *   incident_id, officer_name, notes?, created_by?
   * }} fields
   * @returns {{ error: string|null }}
   */
  const createDispatch = async (fields) => {
    if (!fields.incident_id) return { error: 'No incident selected.' }
    if (!fields.officer_name?.trim()) return { error: 'Officer name is required.' }

    setSaving(true)
    setError(null)

    let lastError = null

    for (let attempt = 0; attempt < 5; attempt++) {
      const dispatchNumber = generateDispatchNumber()

      const { data, error: insertError } = await supabase
        .from('dispatch')
        .insert([{
          incident_id:     fields.incident_id,
          dispatch_number: dispatchNumber,
          officer_name:    fields.officer_name.trim(),
          dispatch_status: 'Dispatched',
          notes:           fields.notes || null,
          created_by:      fields.created_by || null,
          dispatched_at:   new Date().toISOString(),
        }])
        .select(`
          id, dispatch_number, officer_name, dispatch_status,
          notes, created_by, dispatched_at, created_at, updated_at,
          incident_id,
          incidents ( id, incident_number, incident_type, location, priority, status )
        `)
        .single()

      if (!insertError) {
        // Sync incidents.assigned_officer so every other page stays current
        await supabase
          .from('incidents')
          .update({ assigned_officer: fields.officer_name.trim() })
          .eq('id', fields.incident_id)

        const newRow = {
          ...data,
          incident: Array.isArray(data.incidents)
            ? (data.incidents[0] ?? null)
            : data.incidents ?? null,
        }
        setDispatches((prev) => [newRow, ...prev])
        setSaving(false)
        return { error: null }
      }

      lastError = insertError
      // 23505 = unique_violation on dispatch_number → retry with new number
      if (insertError.code !== '23505') break
    }

    setSaving(false)
    const msg = lastError?.message || 'Failed to create dispatch.'
    setError(msg)
    return { error: msg }
  }

  // ── Update status (+ optional notes) ─────────────────────────────────────

  /**
   * @param {string}      id       — uuid of the dispatch row
   * @param {string}      status   — one of the valid dispatch_status values
   * @param {string|null} notes    — optional updated notes
   * @returns {{ error: string|null }}
   */
  const updateDispatchStatus = async (id, status, notes = undefined) => {
    setSaving(true)
    setError(null)

    const updateFields = { dispatch_status: status }
    if (notes !== undefined) updateFields.notes = notes

    const { data, error: updateError } = await supabase
      .from('dispatch')
      .update(updateFields)
      .eq('id', id)
      .select(`
        id, dispatch_number, officer_name, dispatch_status,
        notes, created_by, dispatched_at, created_at, updated_at,
        incident_id,
        incidents ( id, incident_number, incident_type, location, priority, status )
      `)
      .single()

    setSaving(false)

    if (updateError) {
      const msg = updateError.message
      setError(msg)
      return { error: msg }
    }

    const updated = {
      ...data,
      incident: Array.isArray(data.incidents)
        ? (data.incidents[0] ?? null)
        : data.incidents ?? null,
    }
    setDispatches((prev) => prev.map((d) => (d.id === id ? updated : d)))
    return { error: null }
  }

  return {
    dispatches,
    loading,
    saving,
    error,
    refetch: fetchDispatches,
    createDispatch,
    updateDispatchStatus,
  }
}

export default useDispatch
