import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for managing dispatch requests
 */
const useDispatchRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateDispatchNumber = () => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const arr = new Uint32Array(1);
    try {
      crypto.getRandomValues(arr);
    } catch {
      arr[0] = Math.random() * 0xFFFFFFFF;
    }
    const seq = String(arr[0] % 10000).padStart(4, '0');
    return `DSP-${yyyy}-${mm}${dd}-${seq}`;
  };

  const createDispatchRequest = async ({
    incidentId,
    policeStationId,
    notes,
    createdBy,
    // NEW: Unified response fields
    responseType = 'pnp_officer',
    responsePurpose = null,
    responderName = null,
    responderRole = null
  }) => {
    setLoading(true);
    setError(null);

    try {
      const dispatchNumber = generateDispatchNumber();

      // Build dispatch record based on response type
      const dispatchData = {
        incident_id: incidentId,
        dispatch_number: dispatchNumber,
        response_type: responseType,
        response_purpose: responsePurpose,
        notes: notes || null,
        created_by: createdBy || null,
        dispatched_at: new Date().toISOString()
      };

      if (responseType === 'barangay_tanod') {
        // Barangay Tanod workflow
        dispatchData.responder_name = responderName;
        dispatchData.responder_role = responderRole || 'Tanod Member';
        dispatchData.dispatch_status = 'Pending';
      } else {
        // PNP workflow (existing)
        dispatchData.police_station_id = policeStationId;
        dispatchData.dispatch_status = 'Pending Station Response';
        dispatchData.station_response_status = 'Pending';
        dispatchData.officer_name = '';
      }

      const { data, error: insertError } = await supabase
        .from('dispatch')
        .insert([dispatchData])
        .select()
        .single();

      if (insertError) throw insertError;

      setLoading(false);
      return { data, error: null };
    } catch (err) {
      console.error('Error creating dispatch request:', err);
      setError(err.message);
      setLoading(false);
      return { data: null, error: err.message };
    }
  };

  const updateStationResponse = async (dispatchId, response) => {
    setLoading(true);
    setError(null);

    try {
      // Normalize response to capitalized format
      const normalizedResponse = response.charAt(0).toUpperCase() + response.slice(1).toLowerCase();
      
      const updates = {
        station_response_status: normalizedResponse, // 'Accepted' or 'Declined'
        station_responded_at: new Date().toISOString()
      };

      if (normalizedResponse === 'Accepted') {
        updates.dispatch_status = 'Station Accepted';
      } else if (normalizedResponse === 'Declined') {
        updates.dispatch_status = 'Station Declined';
      }

      const { data, error: updateError } = await supabase
        .from('dispatch')
        .update(updates)
        .eq('id', dispatchId)
        .select()
        .single();

      if (updateError) throw updateError;

      setLoading(false);
      return { data, error: null };
    } catch (err) {
      console.error('Error updating station response:', err);
      setError(err.message);
      setLoading(false);
      return { data: null, error: err.message };
    }
  };

  const assignOfficer = async (dispatchId, officerName, officerBadge = null) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('dispatch')
        .update({
          officer_name: officerName,
          assigned_officer_badge: officerBadge,
          dispatch_status: 'Assigned', // Unified status
          officer_assigned_at: new Date().toISOString()
        })
        .eq('id', dispatchId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Also update incidents.assigned_officer
      const { error: incidentError } = await supabase
        .from('incidents')
        .update({ assigned_officer: officerName })
        .eq('id', data.incident_id);

      if (incidentError) {
        console.warn('Failed to update incident assigned_officer:', incidentError);
      }

      // Send email notification to complainant (non-blocking)
      try {
        const { data: incident, error: incidentFetchError } = await supabase
          .from('incidents')
          .select('complainant_email, incident_number, incident_type, complainant_name')
          .eq('id', data.incident_id)
          .single();

        if (incidentFetchError) {
          console.warn('[useDispatchRequest] Failed to fetch incident for email:', incidentFetchError);
        } else if (incident?.complainant_email) {
          console.log('[useDispatchRequest] Sending officer assignment email to:', incident.complainant_email);

          const emailApiUrl = import.meta.env.VITE_EMAIL_API_URL;
          if (!emailApiUrl) {
            console.warn('[useDispatchRequest] Email API URL not configured. Email skipped.');
          } else {
            const subject = `LEIRS: Officer Assigned - ${incident.incident_number}`;
            const body = `
Dear ${incident.complainant_name || 'Valued Citizen'},

An officer has been assigned to your incident report.

Reference Number: ${incident.incident_number}
Incident Type: ${incident.incident_type}

Officer Assignment:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Officer Name: ${officerName}
${officerBadge ? `Badge Number: ${officerBadge}` : ''}
Assigned: ${new Date().toLocaleDateString('en-PH', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

The assigned officer will be responding to your incident. You can track the progress of your case using your reference number.

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
                console.log('[useDispatchRequest] Officer assignment email sent successfully');
              } else {
                console.warn('[useDispatchRequest] Email API responded with error:', response.status);
              }
            }).catch(err => {
              console.warn('[useDispatchRequest] Failed to send assignment email:', err.message);
            });
          }
        } else {
          console.log('[useDispatchRequest] No complainant email found for incident:', data.incident_id);
        }
      } catch (emailError) {
        // Email failure should not block assignment
        console.warn('[useDispatchRequest] Email notification error (non-fatal):', emailError);
      }

      setLoading(false);
      return { data, error: null };
    } catch (err) {
      console.error('Error assigning officer:', err);
      setError(err.message);
      setLoading(false);
      return { data: null, error: err.message };
    }
  };

  const assignTanodResponder = async (dispatchId, responderName, responderRole) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('dispatch')
        .update({
          responder_name: responderName,
          responder_role: responderRole,
          dispatch_status: 'Assigned',
          officer_assigned_at: new Date().toISOString() // Reuse timestamp field
        })
        .eq('id', dispatchId)
        .select()
        .single();

      if (updateError) throw updateError;

      setLoading(false);
      return { data, error: null };
    } catch (err) {
      console.error('Error assigning tanod responder:', err);
      setError(err.message);
      setLoading(false);
      return { data: null, error: err.message };
    }
  };

  const updateDispatchStatus = async (dispatchId, newStatus, timestampField) => {
    setLoading(true);
    setError(null);

    try {
      const updates = {
        dispatch_status: newStatus
      };

      // Add timestamp for specific status changes
      if (timestampField) {
        updates[timestampField] = new Date().toISOString();
      }

      const { data, error: updateError } = await supabase
        .from('dispatch')
        .update(updates)
        .eq('id', dispatchId)
        .select()
        .single();

      if (updateError) throw updateError;

      setLoading(false);
      return { data, error: null };
    } catch (err) {
      console.error('Error updating dispatch status:', err);
      setError(err.message);
      setLoading(false);
      return { data: null, error: err.message };
    }
  };

  const updateActionTaken = async (dispatchId, actionTaken, arrivalTime = null) => {
    setLoading(true);
    setError(null);

    try {
      const updates = {
        action_taken: actionTaken,
        dispatch_status: 'Action Taken'
      };

      // Set arrival time if provided (for Tanod workflow)
      if (arrivalTime) {
        updates.tanod_arrival_time = arrivalTime;
      }

      const { data, error: updateError } = await supabase
        .from('dispatch')
        .update(updates)
        .eq('id', dispatchId)
        .select()
        .single();

      if (updateError) throw updateError;

      setLoading(false);
      return { data, error: null };
    } catch (err) {
      console.error('Error updating action taken:', err);
      setError(err.message);
      setLoading(false);
      return { data: null, error: err.message };
    }
  };

  return {
    loading,
    error,
    createDispatchRequest,
    updateStationResponse,
    assignOfficer,
    assignTanodResponder,
    updateDispatchStatus,
    updateActionTaken
  };
};

export default useDispatchRequest;
