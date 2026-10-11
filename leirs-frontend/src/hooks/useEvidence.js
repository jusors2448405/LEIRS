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
   *   file_name?, file_url?, collected_by?, collected_at?, evidence_status?,
   *   evidence_source?, collection_location?, case_number?, 
   *   incident_number?, dispatch_number?
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
          incident_id:        incidentId,
          evidence_number:    evidenceNumber,
          evidence_type:      fields.evidence_type,
          evidence_name:      fields.evidence_name,
          description:        fields.description           || null,
          file_name:          fields.file_name             || null,
          file_url:           fields.file_url              || null,
          collected_by:       fields.collected_by          || null,
          collected_at:       fields.collected_at          || null,
          evidence_status:    fields.evidence_status       || 'Collected',
          evidence_source:    fields.evidence_source       || null,
          collection_location: fields.collection_location  || null,
          case_number:        fields.case_number           || null,
          incident_number:    fields.incident_number       || null,
          dispatch_number:    fields.dispatch_number       || null,
        }])
        .select('*')
        .single()

      if (!insertError) {
        setEvidence((prev) => [data, ...prev])

        // Send email notification to complainant (non-blocking)
        try {
          const { data: incident, error: incidentError } = await supabase
            .from('incidents')
            .select('complainant_email, incident_number, incident_type, complainant_name')
            .eq('id', incidentId)
            .single();

          if (incidentError) {
            console.warn('[useEvidence] Failed to fetch incident for email:', incidentError);
          } else if (incident?.complainant_email) {
            console.log('[useEvidence] Sending evidence update email to:', incident.complainant_email);

            const emailApiUrl = import.meta.env.VITE_EMAIL_API_URL;
            if (!emailApiUrl) {
              console.warn('[useEvidence] Email API URL not configured. Email skipped.');
            } else {
              const subject = `LEIRS: Evidence Added - ${incident.incident_number}`;
              const body = `
Dear ${incident.complainant_name || 'Valued Citizen'},

New evidence has been added to your incident report.

Reference Number: ${incident.incident_number}
Incident Type: ${incident.incident_type}

Evidence Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Evidence Number: ${evidenceNumber}
Evidence Type: ${fields.evidence_type}
Evidence Name: ${fields.evidence_name}
${fields.description ? `Description: ${fields.description}` : ''}
Status: ${fields.evidence_status || 'Collected'}
Collected By: ${fields.collected_by || 'N/A'}
Added: ${new Date().toLocaleDateString('en-PH', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

This evidence has been documented and will be reviewed as part of your case.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best regards,
Barangay LEIRS Team
Law Enforcement and Incident Reporting System
              `.trim();

              // Non-blocking fetch
              fetch(emailApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: incident.complainant_email,
                  subject: subject,
                  body: body,
                  html: body
                })
              }).then(response => {
                if (response.ok) {
                  console.log('[useEvidence] Evidence notification email sent successfully');
                } else {
                  console.warn('[useEvidence] Email API responded with error:', response.status);
                }
              }).catch(err => {
                console.warn('[useEvidence] Failed to send evidence email:', err.message);
              });
            }
          } else {
            console.log('[useEvidence] No complainant email found for incident:', incidentId);
          }
        } catch (emailError) {
          // Email failure should not block evidence creation
          console.warn('[useEvidence] Email notification error (non-fatal):', emailError);
        }

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
   *   file_name?, file_url?, collected_by?, collected_at?, evidence_status?,
   *   evidence_source?, collection_location?, case_number?, 
   *   incident_number?, dispatch_number?
   * }} fields
   * @returns {{ error: string|null }}
   */
  const updateEvidence = async (id, fields) => {
    setSaving(true)
    setError(null)

    const { data, error: updateError } = await supabase
      .from('evidence')
      .update({
        evidence_type:       fields.evidence_type,
        evidence_name:       fields.evidence_name,
        description:         fields.description          ?? null,
        file_name:           fields.file_name            ?? null,
        file_url:            fields.file_url             ?? null,
        collected_by:        fields.collected_by         ?? null,
        collected_at:        fields.collected_at         ?? null,
        evidence_status:     fields.evidence_status      ?? 'Collected',
        evidence_source:     fields.evidence_source      ?? null,
        collection_location: fields.collection_location  ?? null,
        case_number:         fields.case_number          ?? null,
        incident_number:     fields.incident_number      ?? null,
        dispatch_number:     fields.dispatch_number      ?? null,
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
