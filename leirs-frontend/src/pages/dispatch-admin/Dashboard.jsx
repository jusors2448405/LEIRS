import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Radio, MapPin, Activity, Users, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const DispatchAdminDashboard = () => {
  const [stats, setStats] = useState({
    pendingDispatch: 0,
    pendingStationResponse: 0,
    active: 0,
    responding: 0,
    onScene: 0,
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
      // Cases ready for dispatch (not yet dispatched)
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

      // Dispatch stats
      const { count: pendingStation } = await supabase
        .from('dispatch')
        .select('*', { count: 'exact', head: true })
        .eq('dispatch_status', 'Pending Station Response');

      const { count: responding } = await supabase
        .from('dispatch')
        .select('*', { count: 'exact', head: true })
        .eq('dispatch_status', 'Responding');

      const { count: onScene } = await supabase
        .from('dispatch')
        .select('*', { count: 'exact', head: true })
        .eq('dispatch_status', 'On Scene');

      const { count: completed } = await supabase
        .from('dispatch')
        .select('*', { count: 'exact', head: true })
        .eq('dispatch_status', 'Completed');

      const { count: total } = await supabase
        .from('dispatch')
        .select('*', { count: 'exact', head: true });

      const active = (responding || 0) + (onScene || 0);

      setStats({
        pendingDispatch: pendingCount,
        pendingStationResponse: pendingStation || 0,
        active: active,
        responding: responding || 0,
        onScene: onScene || 0,
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
        <h1 className="text-2xl font-heading font-bold text-text mb-1">Law Enforcement Dispatch</h1>
        <p className="text-muted">Manage dispatch requests, police station selection, and officer assignments</p>
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
            <p className="font-medium text-text">Pending Dispatch</p>
            <p className="text-sm text-muted">View cases ready for dispatch</p>
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
            <p className="font-medium text-text">Active Dispatches</p>
            <p className="text-sm text-muted">Monitor ongoing responses</p>
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
          <p className="text-2xl font-heading font-bold text-yellow-600">{loading ? '—' : stats.pendingDispatch}</p>
          <p className="text-sm text-muted mt-1">Pending Dispatch</p>
        </div>

        <div className="bg-white border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-purple-600">{loading ? '—' : stats.pendingStationResponse}</p>
          <p className="text-sm text-muted mt-1">Awaiting Station Response</p>
        </div>

        <div className="bg-white border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity size={24} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-green-600">{loading ? '—' : stats.active}</p>
          <p className="text-sm text-muted mt-1">Active Dispatches</p>
        </div>

        <div className="bg-white border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-blue-600">{loading ? '—' : stats.completed}</p>
          <p className="text-sm text-muted mt-1">Completed Today</p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h2 className="text-lg font-heading font-semibold text-text mb-4">Dispatch Status Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted mb-2">Response Stages</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Responding</span>
                <span className="font-semibold">{loading ? '—' : stats.responding}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>On Scene</span>
                <span className="font-semibold">{loading ? '—' : stats.onScene}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted mb-2">Completion</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completed</span>
                <span className="font-semibold">{loading ? '—' : stats.completed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Dispatches</span>
                <span className="font-semibold">{loading ? '—' : stats.total}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted mb-2">Pending Actions</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Need Station Selection</span>
                <span className="font-semibold text-yellow-600">{loading ? '—' : stats.pendingDispatch}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Awaiting Station</span>
                <span className="font-semibold text-purple-600">{loading ? '—' : stats.pendingStationResponse}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatchAdminDashboard;
