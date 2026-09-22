import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for managing police stations data
 */
const usePoliceStations = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Only fetch Available stations for new dispatch selection
      // Unavailable stations are preserved for historical dispatch records
      const { data, error: fetchError } = await supabase
        .from('police_stations')
        .select('*')
        .eq('status', 'Available')
        .order('station_name');

      if (fetchError) throw fetchError;

      setStations(data || []);
    } catch (err) {
      console.error('Error fetching police stations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  return {
    stations,
    loading,
    error,
    refetch: fetchStations
  };
};

export default usePoliceStations;
