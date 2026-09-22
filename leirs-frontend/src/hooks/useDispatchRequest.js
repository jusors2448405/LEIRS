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
    createdBy
  }) => {
    setLoading(true);
    setError(null);

    try {
      const dispatchNumber = generateDispatchNumber();

      const { data, error: insertError } = await supabase
        .from('dispatch')
        .insert([{
          incident_id: incidentId,
          dispatch_number: dispatchNumber,
          police_station_id: policeStationId,
          dispatch_status: 'Pending Station Response',
          station_response_status: 'Pending',
          officer_name: '', // Empty until station accepts and officer is assigned
          notes: notes || null,
          created_by: createdBy || null,
          dispatched_at: new Date().toISOString()
        }])
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

  const assignOfficer = async (dispatchId, officerName) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('dispatch')
        .update({
          officer_name: officerName,
          dispatch_status: 'Officer Assigned',
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

      setLoading(false);
      return { data, error: null };
    } catch (err) {
      console.error('Error assigning officer:', err);
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

  return {
    loading,
    error,
    createDispatchRequest,
    updateStationResponse,
    assignOfficer,
    updateDispatchStatus
  };
};

export default useDispatchRequest;
