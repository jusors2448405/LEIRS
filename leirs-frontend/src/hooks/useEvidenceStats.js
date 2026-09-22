import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for fetching evidence statistics for dashboard
 */
const useEvidenceStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {},
    byType: {},
    recentEvidence: [],
    recentCustody: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all evidence to calculate stats
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence')
        .select('*, incident:incidents(incident_number, incident_type)')
        .order('created_at', { ascending: false });

      if (evidenceError) throw evidenceError;

      // Calculate stats
      const total = evidenceData?.length || 0;
      
      const byStatus = {};
      const byType = {};
      
      evidenceData?.forEach(item => {
        // Count by status
        const status = item.status || 'Logged';
        byStatus[status] = (byStatus[status] || 0) + 1;
        
        // Count by type
        const type = item.evidence_type || 'Other';
        byType[type] = (byType[type] || 0) + 1;
      });

      // Get recent evidence (last 10)
      const recentEvidence = evidenceData?.slice(0, 10) || [];

      // Fetch recent custody actions
      const { data: custodyData, error: custodyError } = await supabase
        .from('evidence_custody')
        .select('*, evidence:evidence(evidence_number, evidence_name)')
        .order('action_at', { ascending: false })
        .limit(10);

      if (custodyError) {
        console.warn('Could not fetch custody data:', custodyError);
      }

      setStats({
        total,
        byStatus,
        byType,
        recentEvidence,
        recentCustody: custodyData || []
      });
    } catch (err) {
      console.error('Error fetching evidence stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up real-time subscription for evidence changes
    const evidenceChannel = supabase
      .channel('evidence_stats_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'evidence' },
        () => fetchStats()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'evidence_custody' },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(evidenceChannel);
    };
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

export default useEvidenceStats;
