import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Radio, MapPin, Activity, Users, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const DispatchAdminDashboard = () => {
  const [stats, setStats] = useState({
    pendingResponse: 0,
    barangayTanodActive: 0,
    pnpActive: 0,
    totalBarangayTanod: 0,
    totalPNP: 0,
    completed: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    
    try {
      // Cases ready for response (not yet dispatched)
      const { count: readyForDispatch } = await supabase
        .from('case_documentations')
        .select('*', { count: 'exact', head: true })
        .eq('case_status', 'For Mediation')
        .is('id', 'not.null');

      // Check which cases already have dispatch records
      const { data: existingDispatches } = await supabase
        .from('dispatch')
        .select('incident_id');

      const dispatchedIncidentIds = new Set(existingDispatches?.map(d => d.incident_id) || []);

      // Get cases with their incident IDs
      const { data: readyCases } = await supabase
        .from('case_documentations')
        .select('incident_id')
        .eq('case_status', 'For Mediation');

      const pendingCount = readyCases?.filter(c => !dispatchedIncidentIds.has(c.incident_id)).length || 0;

      // Barangay Tanod stats
      const { count: tanodActive } = await supabase
        .from('dispatch')
        .select('*', { count: 'exact', head: true })
        .eq('response_type', 'barangay_tanod')
        .in('dispatch_status', ['Assigned', 'Dispatched', 'On Scene', 'Action Taken']);

      const { count: tanodTotal } = await supabase
        .from('dispatch')
        .select('*', { count: 'exact', head: true })
        .eq('response_type', 'barangay_tanod');

      // PNP stats (NULL or pnp_officer)
      const { count: pnpActive } = await supabase
        .from('dispatch')
        .select('*', { count: 'exact', head: true })
        .or('response_type.eq.pnp_officer,response_type.is.null')
        .in('dispatch_status', ['Assigned', 'Dispatched', 'Responding', 'On Scene', 'Action Taken', 'Officer Assigned']);

      const { count: pnpTotal } = await supabase
        .from('dispatch')
        .select('*', { count: 'exact', head: true })
        .or('response_type.eq.pnp_officer,response_type.is.null');

      // Completed (both types)
      const { count: completed } = await supabase
        .from('dispatch')
        .select('*', { count: 'exact', head: true })
        .eq('dispatch_status', 'Completed');

      // Total
      const { count: total } = await supabase
        .from('dispatch')
        .select('*', { count: 'exact', head: true });

      setStats({
        pendingResponse: pendingCount,
        barangayTanodActive: tanodActive || 0,
        pnpActive: pnpActive || 0,
        totalBarangayTanod: tanodTotal || 0,
        totalPNP: pnpTotal || 0,
        completed: completed || 0,
        total: total || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-text mb-1">Response Dispatch Module</h1>
        <p className="text-muted">Manage Barangay Tanod and PNP Officer response dispatch</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/dispatch-admin/pending"
          className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl hover:border-primary hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <AlertCircle size={24} className="text-yellow-600" />
          </div>
          <div>
            <p className="font-medium text-text">Pending Response Requests</p>
            <p className="text-sm text-muted">View cases ready for response dispatch</p>
          </div>
        </Link>

        <Link
          to="/dispatch-admin/active"
          className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl hover:border-primary hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Activity size={24} className="text-green-600" />
          </div>
          <div>
            <p className="font-medium text-text">Active Responses</p>
            <p className="text-sm text-muted">Monitor ongoing Tanod & PNP responses</p>
          </div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle size={24} className="text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-yellow-600">{loading ? '—' : stats.pendingResponse}</p>
          <p className="text-sm text-muted mt-1">Pending Response Requests</p>
        </div>

        <div className="bg-white border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users size={24} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-green-600">{loading ? '—' : stats.barangayTanodActive}</p>
          <p className="text-sm text-muted mt-1">Barangay Tanod Responses</p>
        </div>

        <div className="bg-white border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Radio size={24} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-blue-600">{loading ? '—' : stats.pnpActive}</p>
          <p className="text-sm text-muted mt-1">PNP Responses</p>
        </div>

        <div className="bg-white border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-purple-600">{loading ? '—' : stats.completed}</p>
          <p className="text-sm text-muted mt-1">Completed Responses</p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h2 className="text-lg font-heading font-semibold text-text mb-4">Response Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted mb-2">Barangay Tanod</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>🛡️ Active</span>
                <span className="font-semibold text-green-600">{loading ? '—' : stats.barangayTanodActive}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Responses</span>
                <span className="font-semibold">{loading ? '—' : stats.totalBarangayTanod}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted mb-2">PNP Officer</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>👮 Active</span>
                <span className="font-semibold text-blue-600">{loading ? '—' : stats.pnpActive}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Responses</span>
                <span className="font-semibold">{loading ? '—' : stats.totalPNP}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted mb-2">Overall Status</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completed</span>
                <span className="font-semibold text-purple-600">{loading ? '—' : stats.completed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Responses</span>
                <span className="font-semibold">{loading ? '—' : stats.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatchAdminDashboard;
