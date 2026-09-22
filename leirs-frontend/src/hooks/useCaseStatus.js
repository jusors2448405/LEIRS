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
        .order('created_at', { ascending: false });

      return {
        error: null,
        data: {
          caseDoc,
          incident,
          dispatches: dispatches || [],
          caseUpdates: caseUpdates || [],
          evidence: evidence || []
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

  return {
    cases,
    loading,
    error,
    stats,
    fetchCases,
    fetchCaseStats,
    fetchCaseDetail,
    updateCaseStatus,
    getCurrentStatus // Export helper function
  };
};

export default useCaseStatus;
