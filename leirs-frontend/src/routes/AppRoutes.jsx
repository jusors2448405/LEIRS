import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import Home from '../pages/public/Home'
import HowToReport from '../pages/public/HowToReport'
import About from '../pages/public/About'
import Contact from '../pages/public/Contact'
import PrivacyPolicy from '../pages/public/PrivacyPolicy'
import TermsOfService from '../pages/public/TermsOfService'
import TrackReport from '../pages/TrackReport'
import Login from '../pages/Login'
import SystemAdminLayout from '../layouts/SystemAdminLayout'
import IncidentAdminLayout from '../layouts/IncidentAdminLayout'
import CaseAdminLayout from '../layouts/CaseAdminLayout'
import DispatchAdminLayout from '../layouts/DispatchAdminLayout'
import EvidenceAdminLayout from '../layouts/EvidenceAdminLayout'
import StatusAdminLayout from '../layouts/StatusAdminLayout'
import SystemAdminDashboard from '../pages/system-admin/Dashboard'
import SystemAdminUsers from '../pages/system-admin/Users'
import SystemAdminActivities from '../pages/system-admin/Activities'
import SystemAdminAnalytics from '../pages/system-admin/Analytics'
import SystemAdminSettings from '../pages/system-admin/Settings'
import IncidentAdminDashboard from '../pages/incident-admin/Dashboard'
import IncidentAdminNewIncident from '../pages/incident-admin/NewIncident'
import IncidentAdminIncidents from '../pages/incident-admin/Incidents'
import IncidentAdminVerify from '../pages/incident-admin/VerifyIncident'
import CaseAdminDashboard from '../pages/case-admin/Dashboard'
import CaseAdminCases from '../pages/case-admin/Cases'
import CaseAdminForwardedIncidents from '../pages/case-admin/ForwardedIncidents'
import DispatchAdminDashboard from '../pages/dispatch-admin/Dashboard'
import DispatchAdminPendingDispatch from '../pages/dispatch-admin/PendingDispatch'
import DispatchAdminDispatchRequest from '../pages/dispatch-admin/DispatchRequest'
import DispatchAdminActiveDispatches from '../pages/dispatch-admin/ActiveDispatches'
import EvidenceAdminDashboard from '../pages/evidence-admin/Dashboard'
import EvidenceAdminEvidenceList from '../pages/evidence-admin/EvidenceList'
import EvidenceAdminChainOfCustody from '../pages/evidence-admin/ChainOfCustody'
import StatusAdminDashboard from '../pages/status-admin/Dashboard'
import StatusAdminCaseMonitoring from '../pages/status-admin/CaseMonitoring'
import StatusAdminCaseDetail from '../pages/status-admin/CaseDetail'
import PlaceholderPage from '../components/PlaceholderPage'

const AppRoutes = ({ user, onLogin, onLogout }) => {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES - Wrapped in PublicLayout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={user ? (
            <Navigate
              to={
                user.role === 'system_admin'
                  ? '/system-admin'
                  : user.role === 'incident_admin'
                  ? '/incident-admin'
                  : user.role === 'case_admin'
                  ? '/case-admin'
                  : user.role === 'dispatch_admin'
                  ? '/dispatch-admin'
                  : user.role === 'evidence_admin'
                  ? '/evidence-admin'
                  : user.role === 'status_admin'
                  ? '/status-admin'
                  : '/'
              }
              replace
            />
          ) : <Home />} />
          <Route path="/report" element={<HowToReport />} />
          <Route path="/track" element={<TrackReport />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
        </Route>

        {/* STAFF PORTAL LOGIN */}
        <Route path="/staff/login" element={<Login onLogin={onLogin} />} />
        
        {/* Legacy login route - redirect to staff login */}
        <Route path="/login" element={<Navigate to="/staff/login" replace />} />
        
        {/* Legacy track-report route - redirect to new /track */}
        <Route path="/track-report" element={<Navigate to="/track" replace />} />

        {/* LEIRS REVISE: Module-Specific Admin Routes (6 Roles Only) */}
        <Route path="/system-admin" element={<SystemAdminLayout user={user} onLogout={onLogout} />}>
          <Route index element={<SystemAdminDashboard />} />
          <Route path="users" element={<SystemAdminUsers />} />
          <Route path="activities" element={<SystemAdminActivities />} />
          <Route path="analytics" element={<SystemAdminAnalytics />} />
          <Route path="settings" element={<SystemAdminSettings />} />
        </Route>

        <Route path="/incident-admin" element={<IncidentAdminLayout user={user} onLogout={onLogout} />}>
          <Route index element={<IncidentAdminDashboard />} />
          <Route path="new-incident" element={<IncidentAdminNewIncident />} />
          <Route path="incidents" element={<IncidentAdminIncidents />} />
          <Route path="verify/:id" element={<IncidentAdminVerify />} />
        </Route>

        <Route path="/case-admin" element={<CaseAdminLayout user={user} onLogout={onLogout} />}>
          <Route index element={<CaseAdminDashboard />} />
          <Route path="cases" element={<CaseAdminCases />} />
          <Route path="forwarded" element={<CaseAdminForwardedIncidents />} />
        </Route>

        <Route path="/dispatch-admin" element={<DispatchAdminLayout user={user} onLogout={onLogout} />}>
          <Route index element={<DispatchAdminDashboard />} />
          <Route path="pending" element={<DispatchAdminPendingDispatch />} />
          <Route path="dispatch/:incidentId" element={<DispatchAdminDispatchRequest />} />
          <Route path="active" element={<DispatchAdminActiveDispatches />} />
        </Route>

        <Route path="/evidence-admin" element={<EvidenceAdminLayout user={user} onLogout={onLogout} />}>
          <Route index element={<EvidenceAdminDashboard />} />
          <Route path="evidence" element={<EvidenceAdminEvidenceList />} />
          <Route path="custody" element={<EvidenceAdminChainOfCustody />} />
        </Route>

        <Route path="/status-admin" element={<StatusAdminLayout user={user} onLogout={onLogout} />}>
          <Route index element={<StatusAdminDashboard />} />
          <Route path="status" element={<Navigate to="/status-admin" replace />} />
          <Route path="monitoring" element={<StatusAdminCaseMonitoring />} />
          <Route path="case/:incidentId" element={<StatusAdminCaseDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
