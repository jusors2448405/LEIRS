import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Manages case parties (complainants and respondents) for incidents.
 *
 * @param {string|null} incidentId — uuid of the selected incident
 *
 * Returns:
 *   parties        — array of case_parties rows
 *   loading        — true while fetching
 *   saving         — true while insert/update is in flight
 *   error          — string | null
 *   fetchParties   — re-fetch manually
 *   addParty(fields)        → { error }
 *   updateParty(id, fields) → { error }
 *   deleteParty(id)         → { error }
 *
 * Party types: 'Complainant', 'Respondent'
 */
const useCaseParties = (incidentId) => {
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // ── Fetch parties ─────────────────────────────────────────────────────────

  const fetchParties = useCallback(async () => {
    if (!incidentId) {
      setParties([])
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('case_parties')
      .select('*')
      .eq('incident_id', incidentId)
      .order('party_type', { ascending: true })
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setParties([])
    } else {
      setParties(data || [])
    }

    setLoading(false)
  }, [incidentId])

  useEffect(() => {
    fetchParties()
  }, [fetchParties])

  // ── Add party ─────────────────────────────────────────────────────────────

  /**
   * @param {{
   *   party_type: 'Complainant' | 'Respondent',
   *   name: string,
   *   contact?: string,
   *   email?: string,
   *   address?: string,
   *   notes?: string,
   *   information_status?: 'Complete' | 'Pending Verification',
   *   created_by?: string
   * }} fields
   * @returns {{ error: string|null }}
   */
  const addParty = async (fields) => {
    if (!incidentId) return { error: 'No incident selected.' }
    if (!fields.party_type?.trim()) return { error: 'Party type is required.' }
    if (!fields.name?.trim()) return { error: 'Name is required.' }

    setSaving(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('case_parties')
      .insert([{
        incident_id: incidentId,
        party_type: fields.party_type.trim(),
        name: fields.name.trim(),
        contact: fields.contact?.trim() || null,
        email: fields.email?.trim() || null,
        address: fields.address?.trim() || null,
        notes: fields.notes?.trim() || null,
        information_status: fields.information_status || 'Pending Verification',
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

    setParties((prev) => [...prev, data])

    // Also update incidents table with respondent info if this is a respondent
    if (fields.party_type === 'Respondent') {
      await supabase
        .from('incidents')
        .update({
          respondent_name: fields.name.trim(),
          respondent_contact: fields.contact?.trim() || null,
        })
        .eq('id', incidentId)
    }

    return { error: null }
  }

  // ── Update party ──────────────────────────────────────────────────────────

  /**
   * @param {string} partyId — uuid of the case_parties row
   * @param {{
   *   name?: string,
   *   contact?: string,
   *   email?: string,
   *   address?: string,
   *   notes?: string,
   *   information_status?: 'Complete' | 'Pending Verification'
   * }} fields
   * @returns {{ error: string|null }}
   */
  const updateParty = async (partyId, fields) => {
    setSaving(true)
    setError(null)

    const updateFields = {}
    if (fields.name !== undefined) updateFields.name = fields.name.trim()
    if (fields.contact !== undefined) updateFields.contact = fields.contact?.trim() || null
    if (fields.email !== undefined) updateFields.email = fields.email?.trim() || null
    if (fields.address !== undefined) updateFields.address = fields.address?.trim() || null
    if (fields.notes !== undefined) updateFields.notes = fields.notes?.trim() || null
    if (fields.information_status !== undefined) updateFields.information_status = fields.information_status

    const { data, error: updateError } = await supabase
      .from('case_parties')
      .update(updateFields)
      .eq('id', partyId)
      .select('*')
      .single()

    setSaving(false)

    if (updateError) {
      const msg = updateError.message
      setError(msg)
      return { error: msg }
    }

    setParties((prev) =>
      prev.map((p) => (p.id === partyId ? data : p))
    )

    // If this is a respondent, also update incidents denormalization
    if (data.party_type === 'Respondent') {
      await supabase
        .from('incidents')
        .update({
          respondent_name: data.name,
          respondent_contact: data.contact,
        })
        .eq('id', incidentId)
    }

    return { error: null }
  }

  // ── Delete party ──────────────────────────────────────────────────────────

  /**
   * @param {string} partyId — uuid of the case_parties row
   * @returns {{ error: string|null }}
   */
  const deleteParty = async (partyId) => {
    setSaving(true)
    setError(null)

    // Get party info before deleting
    const partyToDelete = parties.find((p) => p.id === partyId)

    const { error: deleteError } = await supabase
      .from('case_parties')
      .delete()
      .eq('id', partyId)

    setSaving(false)

    if (deleteError) {
      const msg = deleteError.message
      setError(msg)
      return { error: msg }
    }

    setParties((prev) => prev.filter((p) => p.id !== partyId))

    // Clear incidents denormalization if this was a respondent
    if (partyToDelete?.party_type === 'Respondent') {
      await supabase
        .from('incidents')
        .update({
          respondent_name: null,
          respondent_contact: null,
        })
        .eq('id', incidentId)
    }

    return { error: null }
  }

  return {
    parties,
    loading,
    saving,
    error,
    fetchParties,
    addParty,
    updateParty,
    deleteParty,
  }
}

export default useCaseParties
