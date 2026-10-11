import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  ShieldAlert,
  MapPin,
  Radio,
  Clock,
  Plus,
  LogOut,
  X,
  Shield,
  Folder,
  Archive
} from 'lucide-react'

const Sidebar = ({ role, onLogout, isOpen, onClose }) => {
  const location = useLocation()
  const navRef = useRef(null)
  const scrollPositionRef = useRef(0)
  const isRestoringRef = useRef(false)

  // LEIRS REVISE: Module-Specific Admin Role Menus (6 Roles Only)
  // System Admin - Full Access to ALL Modules
  const systemAdminMenu = [
    // System Administration
    { name: '🛡️ System Admin', isHeader: true },
    { name: 'Dashboard', path: '/system-admin', icon: LayoutDashboard, indent: true },
    { name: 'Users', path: '/system-admin/users', icon: Users, indent: true },
    { name: 'Activity Log', path: '/system-admin/activities', icon: Clock, indent: true },
    { name: 'Analytics', path: '/system-admin/analytics', icon: BarChart3, indent: true },
    { name: 'Settings', path: '/system-admin/settings', icon: Settings, indent: true },
    
    // Incident Reporting Module
    { name: '📋 Incident Reporting', isHeader: true },
    { name: 'Dashboard', path: '/incident-admin', icon: LayoutDashboard, indent: true },
    { name: 'New Incident', path: '/incident-admin/new-incident', icon: Plus, indent: true },
    { name: 'Incident List', path: '/incident-admin/incidents', icon: FileText, indent: true },
    
    // Case Documentation Module
    { name: '📁 Case Documentation', isHeader: true },
    { name: 'Dashboard', path: '/case-admin', icon: LayoutDashboard, indent: true },
    { name: 'Forwarded Incidents', path: '/case-admin/forwarded', icon: FileText, indent: true },
    { name: 'Case Management', path: '/case-admin/cases', icon: Folder, indent: true },
    
    // Dispatch Module
    { name: '📡 Dispatch', isHeader: true },
    { name: 'Dashboard', path: '/dispatch-admin', icon: LayoutDashboard, indent: true },
    { name: 'Pending Dispatch', path: '/dispatch-admin/pending', icon: Clock, indent: true },
    { name: 'Active Dispatches', path: '/dispatch-admin/active', icon: Radio, indent: true },
    
    // Evidence Management Module
    { name: '🔒 Evidence', isHeader: true },
    { name: 'Dashboard', path: '/evidence-admin', icon: LayoutDashboard, indent: true },
    { name: 'Evidence', path: '/evidence-admin/evidence', icon: Archive, indent: true },
    { name: 'Custody', path: '/evidence-admin/custody', icon: Shield, indent: true },
    
    // Case Status Monitoring Module
    { name: '📊 Case Status', isHeader: true },
    { name: 'Dashboard', path: '/status-admin', icon: LayoutDashboard, indent: true },
    { name: 'Monitoring', path: '/status-admin/monitoring', icon: Clock, indent: true }
  ]

  const incidentAdminMenu = [
    { name: 'Dashboard', path: '/incident-admin', icon: LayoutDashboard },
    { name: 'New Incident', path: '/incident-admin/new-incident', icon: Plus },
    { name: 'Incident List', path: '/incident-admin/incidents', icon: FileText }
  ]

  const caseAdminMenu = [
    { name: 'Dashboard', path: '/case-admin', icon: LayoutDashboard },
    { name: 'Forwarded Incidents', path: '/case-admin/forwarded', icon: FileText },
    { name: 'Case Management', path: '/case-admin/cases', icon: Folder }
  ]

  const dispatchAdminMenu = [
    { name: 'Dashboard', path: '/dispatch-admin', icon: LayoutDashboard },
    { name: 'Pending Dispatch', path: '/dispatch-admin/pending', icon: Clock },
    { name: 'Active Dispatches', path: '/dispatch-admin/active', icon: Radio }
  ]

  const evidenceAdminMenu = [
    { name: 'Dashboard', path: '/evidence-admin', icon: LayoutDashboard },
    { name: 'Evidence', path: '/evidence-admin/evidence', icon: Archive },
    { name: 'Custody', path: '/evidence-admin/custody', icon: Shield }
  ]

  const statusAdminMenu = [
    { name: 'Dashboard', path: '/status-admin', icon: LayoutDashboard },
    { name: 'Monitoring', path: '/status-admin/monitoring', icon: Clock }
  ]

  // Select menu based on role
  let menu = systemAdminMenu // default fallback
  if (role === 'system_admin') menu = systemAdminMenu
  else if (role === 'incident_admin') menu = incidentAdminMenu
  else if (role === 'case_admin') menu = caseAdminMenu
  else if (role === 'dispatch_admin') menu = dispatchAdminMenu
  else if (role === 'evidence_admin') menu = evidenceAdminMenu
  else if (role === 'status_admin') menu = statusAdminMenu

  // ── Preserve scroll position across navigation ────────────────────────────
  
  // Save scroll position whenever it changes (but not during restoration)
  useEffect(() => {
    const navElement = navRef.current
    if (!navElement) return

    const handleScroll = () => {
      // Don't save scroll position while we're restoring it
      if (!isRestoringRef.current) {
        scrollPositionRef.current = navElement.scrollTop
        console.log('[Sidebar] Scroll saved:', navElement.scrollTop)
      }
    }

    navElement.addEventListener('scroll', handleScroll, { passive: true })
    return () => navElement.removeEventListener('scroll', handleScroll)
  }, [])

  // Restore scroll position synchronously before browser paint
  useLayoutEffect(() => {
    const navElement = navRef.current
    if (!navElement) return

    const savedPosition = scrollPositionRef.current
    
    if (savedPosition > 0) {
      console.log('[Sidebar] Restoring scroll to:', savedPosition)
      isRestoringRef.current = true
      navElement.scrollTop = savedPosition
      
      // Use requestAnimationFrame to ensure scroll is applied
      requestAnimationFrame(() => {
        if (navRef.current) {
          navRef.current.scrollTop = savedPosition
          // Reset flag after a short delay
          setTimeout(() => {
            isRestoringRef.current = false
          }, 100)
        }
      })
    }
  }, [location.pathname]) // Restore whenever route changes

  const handleLinkClick = (e, path) => {
    console.log('[Sidebar] Link clicked:', path)
    console.log('[Sidebar] Event:', e)
    console.log('[Sidebar] Current location:', location.pathname)
    // Close sidebar on mobile when a link is clicked
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          w-64 bg-white border-r border-border h-screen fixed left-0 top-0 flex flex-col z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <ShieldAlert className="text-white" size={24} />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-text">LEIRS</h2>
              <p className="text-xs text-muted">Brgy. 178, Camarin</p>
            </div>
          </div>
          {/* Close button - Mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-background rounded-lg transition-colors"
          >
            <X size={20} className="text-muted" />
          </button>
        </div>

        {/* Navigation */}
        <nav ref={navRef} className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menu.map((item, index) => {
            // Render headers (for system admin only)
            if (item.isHeader) {
              return (
                <div
                  key={`header-${index}`}
                  className="text-xs font-semibold text-muted uppercase tracking-wider pt-4 pb-2 px-3"
                >
                  {item.name}
                </div>
              )
            }
            
            // Render regular menu items
            return (
              <Link
                key={`link-${index}-${item.path}`}
                to={item.path}
                onClick={(e) => handleLinkClick(e, item.path)}
                className={`sidebar-link ${location.pathname === item.path ? 'active' : ''} ${item.indent ? 'pl-6' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => {
              onLogout()
              handleLinkClick()
            }}
            className="sidebar-link w-full text-left"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar
