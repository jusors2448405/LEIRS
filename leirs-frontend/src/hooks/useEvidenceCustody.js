import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for managing evidence custody chain
 * @param {string} evidenceId - UUID of the evidence item
 */
const useEvidenceCustody = (evidenceId) => {
  const [custodyHistory, setCustodyHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch custody history for specific evidence
  const fetchCustodyHistory = useCallback(async () => {
    if (!evidenceId) {
      setCustodyHistory([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('evidence_custody')
        .select('*')
        .eq('evidence_id', evidenceId)
        .order('action_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCustodyHistory(data || []);
    } catch (err) {
      console.error('Error fetching custody history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [evidenceId]);

  useEffect(() => {
    fetchCustodyHistory();
  }, [fetchCustodyHistory]);

  /**
   * Record a custody action
   * @param {Object} params
   * @param {string} params.actionType - Type of action (Received, Transferred, etc.)
   * @param {string} params.fromUser - User transferring custody (optional)
   * @param {string} params.toUser - User receiving custody (optional)
   * @param {string} params.location - Location of action (optional)
   * @param {string} params.notes - Additional notes (optional)
   * @param {string} params.createdBy - User recording this action
   * @param {Date} params.actionAt - When the action occurred (defaults to now)
   * @returns {{ error: string|null, data: Object|null }}
   */
  const recordCustodyAction = async ({
    actionType,
    fromUser = null,
    toUser = null,
    location = null,
    notes = null,
    createdBy,
    actionAt = null
  }) => {
    if (!evidenceId) {
      return { error: 'No evidence selected', data: null };
    }

    setSaving(true);
    setError(null);

    try {
      // Determine the new action timestamp
      const newActionTimestamp = actionAt ? new Date(actionAt) : new Date();

      // Validate chronological order: fetch the latest custody record
      const { data: latestCustody, error: fetchError } = await supabase
        .from('evidence_custody')
        .select('action_at')
        .eq('evidence_id', evidenceId)
        .order('action_at', { ascending: false })
        .limit(1)
        .single();

      // If there's an existing custody record, validate chronological order
      if (!fetchError && latestCustody) {
        const latestActionTimestamp = new Date(latestCustody.action_at);
        
        if (newActionTimestamp < latestActionTimestamp) {
          const errorMsg = `Invalid custody date/time. The new action (${newActionTimestamp.toLocaleString()}) must be on or after the latest custody event (${latestActionTimestamp.toLocaleString()}).`;
          setError(errorMsg);
          setSaving(false);
          return { error: errorMsg, data: null };
        }
      }

      // Insert custody record
      const { data: custodyData, error: custodyError } = await supabase
        .from('evidence_custody')
        .insert([{
          evidence_id: evidenceId,
          action_type: actionType,
          from_user: fromUser,
          to_user: toUser,
          location: location,
          notes: notes,
          action_at: newActionTimestamp.toISOString(),
          created_by: createdBy
        }])
        .select()
        .single();

      if (custodyError) throw custodyError;

      // Update evidence status and current custodian
      let newStatus = 'Logged';
      let currentCustodian = null;

      switch (actionType) {
        case 'Received':
          newStatus = 'In Custody';
          currentCustodian = toUser;
          break;
        case 'Transferred':
          newStatus = 'In Custody';
          currentCustodian = toUser;
          break;
        case 'Released':
          newStatus = 'Released';
          currentCustodian = null;
          break;
        case 'Returned':
          newStatus = 'Returned';
          currentCustodian = toUser || fromUser;
          break;
        case 'In Court':
          newStatus = 'In Court';
          currentCustodian = 'Court';
          break;
        case 'Archived':
          newStatus = 'Archived';
          currentCustodian = null;
          break;
      }

      const { error: updateError } = await supabase
        .from('evidence')
        .update({
          status: newStatus,
          current_custodian: currentCustodian
        })
        .eq('id', evidenceId);

      if (updateError) throw updateError;

      // Refresh custody history
      await fetchCustodyHistory();

      setSaving(false);
      return { error: null, data: custodyData };
    } catch (err) {
      console.error('Error recording custody action:', err);
      const errorMsg = err.message || 'Failed to record custody action';
      setError(errorMsg);
      setSaving(false);
      return { error: errorMsg, data: null };
    }
  };

  /**
   * Get the most recent custody action
   */
  const getLatestCustody = () => {
    return custodyHistory.length > 0 ? custodyHistory[0] : null;
  };

  /**
   * Get current custodian from history
   */
  const getCurrentCustodian = () => {
    const latest = getLatestCustody();
    if (!latest) return null;

    if (latest.action_type === 'Received' || latest.action_type === 'Returned') {
      return latest.to_user;
    } else if (latest.action_type === 'Transferred') {
      return latest.to_user;
    } else if (latest.action_type === 'Released') {
      return null;
    } else if (latest.action_type === 'In Court') {
      return 'Court';
    } else if (latest.action_type === 'Archived') {
      return 'Archives';
    }

    return latest.to_user || latest.from_user;
  };

  /**
   * Get the latest custody action timestamp
   * @returns {Date|null} Latest action timestamp or null if no history
   */
  const getLatestCustodyTimestamp = () => {
    const latest = getLatestCustody();
    return latest ? new Date(latest.action_at) : null;
  };

  /**
   * Validate if a proposed action timestamp is chronologically valid
   * @param {Date|string} proposedTimestamp - The proposed action timestamp
   * @returns {{ valid: boolean, message: string|null }}
   */
  const validateActionTimestamp = (proposedTimestamp) => {
    const latest = getLatestCustodyTimestamp();
    if (!latest) {
      return { valid: true, message: null };
    }

    const proposedDate = new Date(proposedTimestamp);
    if (proposedDate < latest) {
      return {
        valid: false,
        message: `Action date/time must be on or after the latest custody event (${latest.toLocaleString('en-PH', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })})`
      };
    }

    return { valid: true, message: null };
  };

  return {
    custodyHistory,
    loading,
    saving,
    error,
    recordCustodyAction,
    fetchCustodyHistory,
    getLatestCustody,
    getCurrentCustodian,
    getLatestCustodyTimestamp,
    validateActionTimestamp
  };
};

export default useEvidenceCustody;
