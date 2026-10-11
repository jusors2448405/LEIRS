import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for Case Status Monitoring
 * Provides read-only access to case data across modules
 * 
 * @param {Object} filters - Optional filters for case queries
 * @returns {Object} Case status data and methods
 */
const useCaseStatus = (filters = {}) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    underInvestigation: 0,
    readyForDispatch: 0,
    resolved: 0,
    closed: 0
  });

  // Extract filter values to prevent infinite loop
  const { search, status } = filters;

  /**
   * Get current status for a case
   * Priority: dispatch status > case documentation status
   * Final states (Resolved/Closed) always take precedence
   * 
   * @param {Object} caseItem - Case with dispatch info
   * @returns {Object} { status, display, source, color }
   */
  const getCurrentStatus = (caseItem) => {
    // Always respect final states
    if (caseItem.case_status === 'Resolved' || caseItem.case_status === 'Closed') {
      return {
        status: caseItem.case_status,
        display: caseItem.case_status,
        source: 'case_documentation',
        color: caseItem.case_status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
      };
    }

    // If dispatch exists, use dispatch status (active workflow)
    if (caseItem.dispatch && caseItem.dispatch.dispatch_status) {
      const dispatchStatus = caseItem.dispatch.dispatch_status;
      
      // Map dispatch status to display text and colors
      const dispatchStatusMap = {
        'Pending Station Response': {
          display: 'Awaiting Station Response',
          color: 'bg-yellow-100 text-yellow-700'
        },
        'Station Accepted': {
          display: 'Station Accepted',
          color: 'bg-blue-100 text-blue-700'
        },
        'Station Declined': {
          display: 'Station Declined',
          color: 'bg-red-100 text-red-700'
        },
        'Officer Assigned': {
          display: 'Officer Assigned',
          color: 'bg-indigo-100 text-indigo-700'
        },
        'Dispatched': {
          display: 'Dispatched',
          color: 'bg-purple-100 text-purple-700'
        },
        'Responding': {
          display: 'Officer Responding',
          color: 'bg-orange-100 text-orange-700'
        },
        'On Scene': {
          display: 'Officer On Scene',
          color: 'bg-teal-100 text-teal-700'
        },
        'Completed': {
          display: 'Dispatch Completed',
          color: 'bg-green-100 text-green-700'
        }
      };

      const mapped = dispatchStatusMap[dispatchStatus] || {
        display: dispatchStatus,
        color: 'bg-gray-100 text-gray-600'
      };

      return {
        status: dispatchStatus,
        display: mapped.display,
        source: 'dispatch',
        color: mapped.color
      };
    }

    // Otherwise, use case documentation status (pre-dispatch)
    const caseStatusMap = {
      'Pending': {
        display: 'Pending',
        color: 'bg-yellow-100 text-yellow-700'
      },
      'Under Investigation': {
        display: 'Under Investigation',
        color: 'bg-blue-100 text-blue-700'
      },
      'For Mediation': {
        display: 'Ready for Dispatch',
        color: 'bg-purple-100 text-purple-700'
      }
    };

    const mapped = caseStatusMap[caseItem.case_status] || {
      display: caseItem.case_status,
      color: 'bg-gray-100 text-gray-600'
    };

    return {
      status: caseItem.case_status,
      display: mapped.display,
      source: 'case_documentation',
      color: mapped.color
    };
  };

  /**
   * Fetch case statistics for dashboard
   * Fixed: Only count cases as "Ready for Dispatch" if they haven't been dispatched yet
   */
  const fetchCaseStats = useCallback(async () => {
    try {
      // Get all cases with their status and incident_id
      const { data, error: fetchError } = await supabase
        .from('case_documentations')
        .select('case_status, incident_id');

      if (fetchError) throw fetchError;

      // Get all incidents that have dispatch records
      const { data: dispatchedCases, error: dispatchError } = await supabase
        .from('dispatch')
        .select('incident_id');

      if (dispatchError) {
        console.warn('Failed to fetch dispatch records:', dispatchError);
      }

      // Create set of dispatched incident IDs for fast lookup
      const dispatchedIncidentIds = new Set(
        dispatchedCases?.map(d => d.incident_id) || []
      );

      // Calculate statistics
      const stats = {
        total: data?.length || 0,
        pending: 0,
        underInvestigation: 0,
        readyForDispatch: 0,
        resolved: 0,
        closed: 0
      };

      data?.forEach(caseDoc => {
        switch (caseDoc.case_status) {
          case 'Pending':
            stats.pending++;
            break;
          case 'Under Investigation':
            stats.underInvestigation++;
            break;
          case 'For Mediation':
            // Only count as "Ready for Dispatch" if NOT yet dispatched
            if (!dispatchedIncidentIds.has(caseDoc.incident_id)) {
              stats.readyForDispatch++;
            }
            break;
          case 'Resolved':
            stats.resolved++;
            break;
          case 'Closed':
            stats.closed++;
            break;
        }
      });

      setStats(stats);
      return { error: null, data: stats };
    } catch (err) {
      console.error('Error fetching case stats:', err);
      return { error: err.message, data: null };
    }
  }, []);

  /**
   * Fetch cases with related incident and dispatch information
   * Does NOT use deprecated incidents.assigned_officer or case_documentations.assigned_officer
   */
  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('case_documentations')
        .select(`
          id,
          case_number,
          case_status,
          case_notes,
          created_at,
          updated_at,
          incident:incidents!inner(
            id,
            incident_number,
            incident_type,
            incident_date,
            incident_time,
            location,
            complainant_name,
            complainant_contact,
            description,
            status,
            priority,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (status && status !== 'all') {
        query = query.eq('case_status', status);
      }

      // Apply search filter
      if (search) {
        const searchTerm = `%${search.trim()}%`;
        // Search in case_number via case_documentations
        query = query.or(`case_number.ilike.${searchTerm}`);
      }

      const { data: caseDocs, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // For each case, fetch dispatch information (officer assignment from Dispatch Module)
      const casesWithDispatch = await Promise.all(
        (caseDocs || []).map(async (caseDoc) => {
          // Get latest dispatch record for this incident
          const { data: dispatch } = await supabase
            .from('dispatch')
            .select('officer_name, dispatch_status, dispatched_at, police_station_id, police_stations(station_name)')
            .eq('incident_id', caseDoc.incident.id)
            .order('dispatched_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get evidence count
          const { count: evidenceCount } = await supabase
            .from('evidence')
            .select('id', { count: 'exact', head: true })
            .eq('incident_id', caseDoc.incident.id);

          return {
            ...caseDoc,
            dispatch: dispatch || null,
            evidenceCount: evidenceCount || 0
          };
        })
      );

      // Apply additional search filters that require joined data
      let filteredCases = casesWithDispatch;
      
      if (search) {
        const searchLower = search.toLowerCase().trim();
        filteredCases = casesWithDispatch.filter(c => 
          c.case_number?.toLowerCase().includes(searchLower) ||
          c.incident?.incident_number?.toLowerCase().includes(searchLower) ||
          c.incident?.incident_type?.toLowerCase().includes(searchLower) ||
          c.incident?.location?.toLowerCase().includes(searchLower)
        );
      }

      setCases(filteredCases);
      setLoading(false);
      return { error: null, data: filteredCases };
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError(err.message);
      setLoading(false);
      return { error: err.message, data: null };
    }
  }, [search, status]); // Changed from [filters] to [search, status]

  /**
   * Fetch detailed information for a single case
   * @param {string} incidentId - UUID of the incident
   */
  const fetchCaseDetail = async (incidentId) => {
    try {
      // Fetch case documentation
      const { data: caseDoc, error: caseError } = await supabase
        .from('case_documentations')
        .select('*')
        .eq('incident_id', incidentId)
        .maybeSingle();

      if (caseError) throw caseError;
      if (!caseDoc) return { error: 'Case documentation not found', data: null };

      // Fetch incident details
      const { data: incident, error: incidentError } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', incidentId)
        .single();

      if (incidentError) throw incidentError;

      // Fetch dispatch information (officer assignment from Dispatch Module)
      const { data: dispatches, error: dispatchError } = await supabase
        .from('dispatch')
        .select('*, police_stations(station_name, address, contact_number)')
        .eq('incident_id', incidentId)
        .order('dispatched_at', { ascending: false });

      // Fetch case updates timeline
      const { data: caseUpdates, error: updatesError } = await supabase
        .from('case_updates')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: false });

      // Fetch evidence
      const { data: evidence, error: evidenceError } = await supabase
        .from('evidence')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: false});

      // Fetch evidence custody records (if evidence exists)
      let evidenceCustody = [];
      if (evidence && evidence.length > 0) {
        const evidenceIds = evidence.map(e => e.id);
        const { data: custodyData, error: custodyError } = await supabase
          .from('evidence_custody')
          .select('*')
          .in('evidence_id', evidenceIds)
          .order('action_at', { ascending: false});
        
        evidenceCustody = custodyData || [];
      }

      // Fetch case parties
      const { data: parties, error: partiesError } = await supabase
        .from('case_parties')
        .select('*')
        .eq('case_id', caseDoc.id)
        .order('created_at', { ascending: true });

      return {
        error: null,
        data: {
          caseDoc,
          incident,
          dispatches: dispatches || [],
          caseUpdates: caseUpdates || [],
          evidence: evidence || [],
          evidenceCustody: evidenceCustody || [],
          parties: parties || []
        }
      };
    } catch (err) {
      console.error('Error fetching case detail:', err);
      return { error: err.message, data: null };
    }
  };

  /**
   * Update case status
   * Only updates case_status, does NOT touch officer assignment
   * Sends email notification to complainant after successful update
   * @param {string} incidentId - UUID of the incident
   * @param {string} newStatus - New case status
   * @param {string} notes - Optional status update notes
   */
  const updateCaseStatus = async (incidentId, newStatus, notes = '') => {
    try {
      // Fetch current case documentation
      const { data: caseDoc, error: fetchError } = await supabase
        .from('case_documentations')
        .select('*')
        .eq('incident_id', incidentId)
        .single();

      if (fetchError) throw fetchError;
      if (!caseDoc) throw new Error('Case documentation not found');

      const previousStatus = caseDoc.case_status;

      // Update case status
      const updatedNotes = notes.trim()
        ? `${caseDoc.case_notes || ''}\n\n[${new Date().toLocaleString('en-PH')}] Status updated to ${newStatus}:\n${notes.trim()}`
        : caseDoc.case_notes;

      const { data: updatedCase, error: updateError } = await supabase
        .from('case_documentations')
        .update({
          case_status: newStatus,
          case_notes: updatedNotes
        })
        .eq('id', caseDoc.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Sync status to incidents table
      const { error: syncError } = await supabase
        .from('incidents')
        .update({ status: newStatus })
        .eq('id', incidentId);

      if (syncError) {
        console.warn('Failed to sync status to incidents table:', syncError);
        // Non-fatal: case status was updated successfully
      }

      // Send email notification to complainant (non-blocking)
      try {
        const { data: incident, error: incidentError } = await supabase
          .from('incidents')
          .select('complainant_email')
          .eq('id', incidentId)
          .single();

        if (incidentError) {
          console.warn('[useCaseStatus] Failed to fetch complainant email:', incidentError);
        } else if (incident?.complainant_email) {
          console.log('[useCaseStatus] Sending status update email to:', incident.complainant_email);
          
          // Send email via Edge Function
          const emailApiUrl = import.meta.env.VITE_EMAIL_API_URL;
          if (!emailApiUrl) {
            console.warn('[useCaseStatus] Email API URL not configured. Email skipped.');
          } else {
            // Get incident details for email context
            const { data: incidentDetails, error: detailsError } = await supabase
              .from('incidents')
              .select('incident_number, incident_type, complainant_name')
              .eq('id', incidentId)
              .single();

            if (detailsError) {
              console.warn('[useCaseStatus] Failed to fetch incident details for email:', detailsError);
            } else {
              const subject = `LEIRS: Status Update - ${incidentDetails.incident_number}`;
              const body = `
Dear ${incidentDetails.complainant_name || 'Valued Citizen'},

The status of your incident report has been updated.

Reference Number: ${incidentDetails.incident_number}
Incident Type: ${incidentDetails.incident_type}

Status Update:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Previous Status: ${previousStatus}
Current Status: ${newStatus}
Updated: ${new Date().toLocaleDateString('en-PH', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

${newStatus === 'Under Investigation' ? 'Your case is now being actively investigated by our team.' : ''}
${newStatus === 'For Mediation' ? 'Your case has been scheduled for mediation. You will receive separate notification with the schedule details.' : ''}
${newStatus === 'Resolved' ? 'Your case has been resolved. Thank you for your patience throughout this process.' : ''}
${newStatus === 'Closed' ? 'Your case has been officially closed. If you have concerns, please contact our office.' : ''}

You can track your case progress using reference number: ${incidentDetails.incident_number}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best regards,
Barangay LEIRS Team
Law Enforcement and Incident Reporting System
              `.trim();

              // Non-blocking fetch: don't await, don't throw
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
                  console.log('[useCaseStatus] Status update email sent successfully');
                } else {
                  console.warn('[useCaseStatus] Email API responded with error:', response.status);
                }
              }).catch(err => {
                console.warn('[useCaseStatus] Failed to send status update email:', err.message);
              });
            }
          }
        } else {
          console.log('[useCaseStatus] No complainant email found for incident:', incidentId);
        }
      } catch (emailError) {
        // Email failure should not block status update
        console.warn('[useCaseStatus] Email notification error (non-fatal):', emailError);
      }

      return { error: null, data: updatedCase };
    } catch (err) {
      console.error('Error updating case status:', err);
      return { error: err.message, data: null };
    }
  };

  // Fetch cases when filters change
  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Fetch stats on mount
  useEffect(() => {
    fetchCaseStats();
  }, [fetchCaseStats]);

  /**
   * Determine current stage of the case
   * Returns stage name, handler role, and next action
   * 
   * @param {Object} caseData - Complete case data
   * @param {Object} stages - Workflow stages (summons, hearings, mediations, resolutions)
   * @returns {Object} { stage, handledBy, nextAction, priority }
   */
  const determineCurrentStage = (caseData, stages) => {
    if (!caseData || !caseData.caseDoc) {
      return {
        stage: 'Unknown',
        handledBy: 'N/A',
        nextAction: 'N/A',
        priority: 'low'
      };
    }

    const { caseDoc, dispatches } = caseData;
    const latestDispatch = dispatches?.[0];

    // 1. Check if case is closed (final state)
    if (caseDoc.case_status === 'Closed') {
      return {
        stage: 'Case Closed',
        handledBy: 'Case Status Admin',
        nextAction: 'No further action required',
        priority: 'low'
      };
    }

    // 2. Check if resolved (awaiting closure)
    if (caseDoc.case_status === 'Resolved') {
      return {
        stage: 'Case Resolved',
        handledBy: 'Case Admin',
        nextAction: 'Awaiting case closure',
        priority: 'low'
      };
    }

    // 3. Check active dispatch workflow (takes priority when active)
    if (latestDispatch && !['Completed', 'Cancelled'].includes(latestDispatch.dispatch_status)) {
      const dispatchStageMap = {
        'Pending Station Response': {
          stage: 'Awaiting Station Response',
          handledBy: 'Police Station / Dispatch Admin',
          nextAction: 'Wait for station to accept/decline dispatch'
        },
        'Station Accepted': {
          stage: 'Station Accepted Dispatch',
          handledBy: 'Police Station',
          nextAction: 'Assign officer to incident'
        },
        'Station Declined': {
          stage: 'Dispatch Declined',
          handledBy: 'Dispatch Admin',
          nextAction: 'Reassign to different station or close dispatch'
        },
        'Officer Assigned': {
          stage: 'Officer Assigned',
          handledBy: 'Assigned Officer',
          nextAction: 'Officer to respond to incident'
        },
        'Dispatched': {
          stage: 'Dispatch In Progress',
          handledBy: 'Assigned Officer',
          nextAction: 'Officer responding to scene'
        },
        'Responding': {
          stage: 'Officer Responding',
          handledBy: `Officer ${latestDispatch.officer_name}`,
          nextAction: 'Officer en route to incident location'
        },
        'On Scene': {
          stage: 'Officer On Scene',
          handledBy: `Officer ${latestDispatch.officer_name}`,
          nextAction: 'Complete incident response and submit report'
        }
      };

      const dispatchInfo = dispatchStageMap[latestDispatch.dispatch_status] || {
        stage: `Dispatch: ${latestDispatch.dispatch_status}`,
        handledBy: 'Dispatch Admin',
        nextAction: 'Monitor dispatch progress'
      };

      return {
        ...dispatchInfo,
        priority: 'high'
      };
    }

    // 4. Check active mediation (no outcome yet)
    if (stages.mediations && stages.mediations.length > 0) {
      const latestMediation = stages.mediations[0];
      if (!latestMediation.outcome) {
        return {
          stage: 'Under Lupon Mediation',
          handledBy: 'Case Admin / Lupon Mediator',
          nextAction: 'Complete mediation session and record outcome',
          priority: 'high'
        };
      }
    }

    // 5. Check upcoming hearing
    if (stages.hearings && stages.hearings.length > 0) {
      const upcomingHearing = stages.hearings.find(h => {
        const hearingDate = new Date(h.scheduled_date);
        return hearingDate > new Date() || !h.outcome;
      });

      if (upcomingHearing) {
        const hearingDate = new Date(upcomingHearing.scheduled_date);
        const isUpcoming = hearingDate > new Date();
        
        if (isUpcoming) {
          return {
            stage: 'Hearing Scheduled',
            handledBy: 'Case Admin',
            nextAction: `Attend hearing on ${hearingDate.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`,
            priority: 'high'
          };
        } else {
          return {
            stage: 'Hearing Conducted',
            handledBy: 'Case Admin',
            nextAction: 'Record hearing outcome',
            priority: 'high'
          };
        }
      }
    }

    // 6. Check pending summons
    if (stages.summons && stages.summons.length > 0) {
      const unservedSummons = stages.summons.find(s => s.status !== 'Served');
      if (unservedSummons) {
        return {
          stage: 'Summons Issued',
          handledBy: 'Case Admin',
          nextAction: 'Serve summons to respondent',
          priority: 'medium'
        };
      }
    }

    // 7. Check case documentation status
    if (caseDoc.case_status === 'Under Investigation') {
      return {
        stage: 'Under Investigation',
        handledBy: 'Case Admin',
        nextAction: 'Continue case investigation and documentation',
        priority: 'medium'
      };
    }

    if (caseDoc.case_status === 'For Mediation') {
      return {
        stage: 'Ready for Dispatch',
        handledBy: 'Dispatch Admin',
        nextAction: 'Assign police officer for dispatch',
        priority: 'medium'
      };
    }

    if (caseDoc.case_status === 'Pending') {
      return {
        stage: 'Pending Review',
        handledBy: 'Case Admin',
        nextAction: 'Begin case processing',
        priority: 'medium'
      };
    }

    // Default fallback
    return {
      stage: caseDoc.case_status,
      handledBy: 'Case Admin',
      nextAction: 'Continue case processing',
      priority: 'low'
    };
  };

  return {
    cases,
    loading,
    error,
    stats,
    fetchCases,
    fetchCaseStats,
    fetchCaseDetail,
    updateCaseStatus,
    getCurrentStatus, // Export helper function
    determineCurrentStage // Export new helper function
  };
};

export default useCaseStatus;
