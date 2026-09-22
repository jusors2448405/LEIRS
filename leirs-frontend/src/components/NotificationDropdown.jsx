import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, AlertCircle, Radio, FileText, Shield, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

/**
 * Notification Dropdown Component
 * Shows role-specific notifications based on real Supabase data
 */
const NotificationDropdown = ({ user, isOpen, onClose }) => {
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, user?.role, user?.full_name, user?.name])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const fetchNotifications = async () => {
    setLoading(true)
    const notifs = []

    try {
      const role = user?.role

      if (role === 'admin') {
        // Admin notifications

        // 1. Urgent incidents
        const { data: urgent, error: urgentErr } = await supabase
          .from('incidents')
          .select('id, incident_number, incident_type, priority')
          .eq('priority', 'Urgent')
          .in('status', ['Pending', 'Under Investigation'])
          .order('created_at', { ascending: false })
          .limit(5)

        if (urgentErr) throw urgentErr

        if (urgent && urgent.length > 0) {
          notifs.push({
            id: 'urgent-incidents',
            type: 'urgent',
            icon: AlertCircle,
            title: `${urgent.length} Urgent Incident${urgent.length > 1 ? 's' : ''}`,
            message: 'Require immediate attention',
            path: '/admin/analytics',
            count: urgent.length
          })
        }

        // 2. Pending incidents
        const { data: pending, error: pendErr } = await supabase
          .from('incidents')
          .select('id')
          .eq('status', 'Pending')

        if (pendErr) throw pendErr

        if (pending && pending.length > 0) {
          notifs.push({
            id: 'pending-incidents',
            type: 'warning',
            icon: FileText,
            title: `${pending.length} Pending Incident${pending.length > 1 ? 's' : ''}`,
            message: 'Require review',
            path: '/admin/incidents',
            count: pending.length
          })
        }

        // 3. High priority incidents
        const { data: highPriority, error: hpErr } = await supabase
          .from('incidents')
          .select('id')
          .eq('priority', 'High')
          .in('status', ['Pending', 'Under Investigation'])

        if (hpErr) throw hpErr

        if (highPriority && highPriority.length > 0) {
          notifs.push({
            id: 'high-priority',
            type: 'warning',
            icon: AlertCircle,
            title: `${highPriority.length} High Priority Case${highPriority.length > 1 ? 's' : ''}`,
            message: 'Need attention',
            path: '/admin/status',
            count: highPriority.length
          })
        }

      } else if (role === 'encoder') {
        // Encoder notifications

        // 1. Pending incidents
        const { data: pending, error: pendErr } = await supabase
          .from('incidents')
          .select('id, incident_number')
          .eq('status', 'Pending')
          .order('created_at', { ascending: false })
          .limit(10)

        if (pendErr) throw pendErr

        if (pending && pending.length > 0) {
          notifs.push({
            id: 'pending-encoding',
            type: 'warning',
            icon: FileText,
            title: `${pending.length} Pending Incident${pending.length > 1 ? 's' : ''}`,
            message: 'Require encoding',
            path: '/encoder/incidents',
            count: pending.length
          })
        }

        // 2. High priority incidents
        const { data: highPriority, error: hpErr } = await supabase
          .from('incidents')
          .select('id')
          .eq('priority', 'High')
          .in('status', ['Pending', 'Under Investigation'])

        if (hpErr) throw hpErr

        if (highPriority && highPriority.length > 0) {
          notifs.push({
            id: 'high-priority-encoder',
            type: 'urgent',
            icon: AlertCircle,
            title: `${highPriority.length} High Priority Case${highPriority.length > 1 ? 's' : ''}`,
            message: 'Need immediate review',
            path: '/encoder/status',
            count: highPriority.length
          })
        }

        // 3. Cases without documentation
        const { data: incidents, error: incErr } = await supabase
          .from('incidents')
          .select(`
            id,
            case_documentations (id)
          `)
          .neq('status', 'Closed')

        if (incErr) throw incErr

        const withoutDocs = incidents?.filter(inc => 
          !inc.case_documentations || inc.case_documentations.length === 0
        ).length || 0

        if (withoutDocs > 0) {
          notifs.push({
            id: 'missing-docs',
            type: 'info',
            icon: FileText,
            title: `${withoutDocs} Case${withoutDocs > 1 ? 's' : ''} Missing Documentation`,
            message: 'Require case documentation',
            path: '/encoder/cases',
            count: withoutDocs
          })
        }

      } else if (role === 'officer') {
        // Officer notifications
        const officerName = user?.full_name || user?.name

        if (!officerName) {
          setNotifications([])
          setLoading(false)
          return
        }

        // 1. Active dispatches
        const { data: dispatches, error: dispErr } = await supabase
          .from('dispatch')
          .select('id, incident_id, status')
          .eq('assigned_officer', officerName)
          .in('status', ['Pending', 'En Route', 'On Scene'])
          .order('created_at', { ascending: false })

        if (dispErr) throw dispErr

        if (dispatches && dispatches.length > 0) {
          notifs.push({
            id: 'active-dispatches',
            type: 'urgent',
            icon: Radio,
            title: `${dispatches.length} Active Dispatch${dispatches.length > 1 ? 'es' : ''}`,
            message: 'Require attention',
            path: '/officer/dispatch',
            count: dispatches.length
          })
        }

        // 2. Assigned cases
        const { data: assigned, error: assignErr } = await supabase
          .from('incidents')
          .select('id, priority, status')
          .eq('assigned_officer', officerName)
          .in('status', ['Under Investigation', 'For Mediation'])
          .order('created_at', { ascending: false })

        if (assignErr) throw assignErr

        // High priority assigned cases
        const urgentCases = assigned?.filter(inc => 
          inc.priority === 'Urgent' || inc.priority === 'High'
        ).length || 0

        if (urgentCases > 0) {
          notifs.push({
            id: 'high-priority-cases',
            type: 'urgent',
            icon: AlertCircle,
            title: `${urgentCases} High Priority Case${urgentCases > 1 ? 's' : ''}`,
            message: 'Assigned to you',
            path: '/officer/cases',
            count: urgentCases
          })
        }

        // All assigned cases
        if (assigned && assigned.length > 0 && urgentCases === 0) {
          notifs.push({
            id: 'assigned-cases',
            type: 'info',
            icon: Shield,
            title: `${assigned.length} Active Case${assigned.length > 1 ? 's' : ''}`,
            message: 'Assigned to you',
            path: '/officer/cases',
            count: assigned.length
          })
        }
      }

      setNotifications(notifs)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([])
    }

    setLoading(false)
  }

  const handleNotificationClick = (path) => {
    navigate(path)
    onClose()
  }

  if (!isOpen) return null

  const typeStyles = {
    urgent: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700'
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white border border-border rounded-xl shadow-xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-background">
        <h3 className="font-heading font-semibold text-text">Notifications</h3>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={40} className="mx-auto text-border mb-3" />
            <p className="text-sm font-medium text-text">No new notifications</p>
            <p className="text-xs text-muted mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notif) => {
              const Icon = notif.icon
              return (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.path)}
                  className="w-full px-4 py-3 hover:bg-background transition-colors text-left flex items-start gap-3 group"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${typeStyles[notif.type]}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-text group-hover:text-primary transition-colors">
                        {notif.title}
                      </p>
                      <ChevronRight size={16} className="text-muted flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-xs text-muted mt-0.5">{notif.message}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-border bg-background">
          <p className="text-xs text-muted text-center">
            Click on a notification to view details
          </p>
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown
