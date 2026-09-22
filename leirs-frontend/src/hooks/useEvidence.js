import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Manages evidence records for a single incident.
 *
 * @param {string|null} incidentId — uuid of the selected incident
 *
 * Returns:
 *   evidence[]     — array of evidence rows for this incident
 *   loading        — true while fetching
 *   saving         — true while insert/update/delete is in flight
 *   error          — string | null
 *   fetchEvidence  — re-fetch manually
 *   createEvidence(fields) → { error }
 *   updateEvidence(id, fields) → { error }
 *   deleteEvidence(id) → { error }
 */
const useEvidence = (incidentId) => {
  const [evidence, setEvidence] = useState([])
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)

  // ── Generate unique evidence number ──────────────────────────────────────

  const generateEvidenceNumber = () => {
    const now  = new Date()
    const yyyy = String(now.getFullYear())
    const mm   = String(now.getMonth() + 1).padStart(2, '0')
    const dd   = String(now.getDate()).padStart(2, '0')
    const arr  = new Uint32Array(1)
    try { crypto.getRandomValues(arr) } catch { arr[0] = Math.random() * 0xFFFFFFFF }
    const seq  = String(arr[0] % 10000).padStart(4, '0')
    return `EVID-${yyyy}-${mm}${dd}-${seq}`
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchEvidence = useCallback(async () => {
    if (!incidentId) {
      setEvidence([])
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('evidence')
      .select('*')
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setEvidence(data || [])
    }

    setLoading(false)
  }, [incidentId])

  useEffect(() => {
    fetchEvidence()
  }, [fetchEvidence])

  // ── Create ────────────────────────────────────────────────────────────────

  /**
   * @param {{
   *   evidence_type, evidence_name, description?,
   *   file_name?, file_url?, collected_by?, collected_at?, status?
   * }} fields
   * @returns {{ error: string|null }}
   */
  const createEvidence = async (fields) => {
    if (!incidentId) return { error: 'No incident selected.' }

    setSaving(true)
    setError(null)

    let lastError = null

    for (let attempt = 0; attempt < 5; attempt++) {
      const evidenceNumber = generateEvidenceNumber()

      const { data, error: insertError } = await supabase
        .from('evidence')
        .insert([{
          incident_id:     incidentId,
          evidence_number: evidenceNumber,
          evidence_type:   fields.evidence_type,
          evidence_name:   fields.evidence_name,
          description:     fields.description     || null,
          file_name:       fields.file_name        || null,
          file_url:        fields.file_url         || null,
          collected_by:    fields.collected_by     || null,
          collected_at:    fields.collected_at     || null,
          status:          fields.status           || 'Logged',
        }])
        .select('*')
        .single()

      if (!insertError) {
        setEvidence((prev) => [data, ...prev])
        setSaving(false)
        return { error: null }
      }

      lastError = insertError
      // 23505 = unique_violation on evidence_number → retry
      if (insertError.code !== '23505') break
    }

    setSaving(false)
    const msg = lastError?.message || 'Failed to save evidence record.'
    setError(msg)
    return { error: msg }
  }

  // ── Update ────────────────────────────────────────────────────────────────

  /**
   * @param {string} id — uuid of the evidence row
   * @param {{
   *   evidence_type?, evidence_name?, description?,
   *   file_name?, file_url?, collected_by?, collected_at?, status?
   * }} fields
   * @returns {{ error: string|null }}
   */
  const updateEvidence = async (id, fields) => {
    setSaving(true)
    setError(null)

    const { data, error: updateError } = await supabase
      .from('evidence')
      .update({
        evidence_type:  fields.evidence_type,
        evidence_name:  fields.evidence_name,
        description:    fields.description    ?? null,
        file_name:      fields.file_name       ?? null,
        file_url:       fields.file_url        ?? null,
        collected_by:   fields.collected_by    ?? null,
        collected_at:   fields.collected_at    ?? null,
        status:         fields.status          ?? 'Logged',
      })
      .eq('id', id)
      .select('*')
      .single()

    setSaving(false)

    if (updateError) {
      const msg = updateError.message
      setError(msg)
      return { error: msg }
    }

    setEvidence((prev) => prev.map((e) => (e.id === id ? data : e)))
    return { error: null }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  /**
   * @param {string} id — uuid of the evidence row
   * @returns {{ error: string|null }}
   */
  const deleteEvidence = async (id) => {
    setSaving(true)
    setError(null)

    const { error: deleteError } = await supabase
      .from('evidence')
      .delete()
      .eq('id', id)

    setSaving(false)

    if (deleteError) {
      const msg = deleteError.message
      setError(msg)
      return { error: msg }
    }

    setEvidence((prev) => prev.filter((e) => e.id !== id))
    return { error: null }
  }

  return {
    evidence,
    loading,
    saving,
    error,
    fetchEvidence,
    createEvidence,
    updateEvidence,
    deleteEvidence,
  }
}

export default useEvidence
