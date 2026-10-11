import React from 'react';
import {
  CheckCircle, Circle, Clock, FileText, Users, Calendar,
  Radio, Shield, Gavel, FileCheck, Award
} from 'lucide-react';

/**
 * CaseTimeline Component
 * Displays case progress following actual Barangay process flow
 * Only shows stages that are applicable to the specific case
 * 
 * @param {Object} props
 * @param {Object} props.caseData - Complete case data from useCaseStatus
 * @param {Object} props.stages - Workflow stages from useCaseStages
 */
const CaseTimeline = ({ caseData, stages }) => {
  if (!caseData || !stages) {
    return (
      <div className="text-center py-8">
        <Clock size={32} className="mx-auto text-muted mb-2" />
        <p className="text-sm text-muted">Loading timeline...</p>
      </div>
    );
  }

  const { caseDoc, incident, dispatches, evidence, evidenceCustody } = caseData;

  // Build timeline stages based on actual data
  const timelineStages = [];

  // 1. Incident Reported (Always present)
  timelineStages.push({
    id: 'reported',
    label: 'Incident Reported',
    icon: FileText,
    completed: true,
    date: incident.created_at,
    description: `${incident.incident_type} reported by ${incident.complainant_name}`,
    details: [
      `Location: ${incident.location}`,
      `Priority: ${incident.priority}`,
      `Incident #: ${incident.incident_number}`
    ]
  });

  // 2. Incident Reviewed/Validated (Always present if status changed)
  if (incident.status !== 'Pending' || caseDoc) {
    timelineStages.push({
      id: 'reviewed',
      label: 'Incident Reviewed',
      icon: FileCheck,
      completed: true,
      date: incident.updated_at,
      description: 'Incident validated and accepted for processing',
      details: [`Initial Status: ${incident.status}`]
    });
  }

  // 3. Case Documentation (Always present if case exists)
  if (caseDoc) {
    timelineStages.push({
      id: 'documentation',
      label: 'Case Documentation',
      icon: Users,
      completed: true,
      date: caseDoc.created_at,
      description: 'Case file created and parties identified',
      details: [
        `Case #: ${caseDoc.case_number}`,
        `Case Status: ${caseDoc.case_status}`
      ]
    });
  }

  // 4. Summons Issued (Only if summons exists)
  if (stages.summons && stages.summons.length > 0) {
    const latestSummons = stages.summons[0];
    timelineStages.push({
      id: 'summons',
      label: 'Summons Issued',
      icon: Gavel,
      completed: true,
      date: latestSummons.issued_date,
      description: 'Summons issued to respondent',
      details: [
        `Summons #: ${latestSummons.summons_number}`,
        `Status: ${latestSummons.status}`,
        stages.summons.length > 1 ? `Total summons: ${stages.summons.length}` : null
      ].filter(Boolean),
      badge: latestSummons.status === 'Served' ? 'success' : 
             latestSummons.status === 'NotServed' ? 'warning' : 'info'
    });
  }

  // 5. Barangay Hearing (Only if hearings exist)
  if (stages.hearings && stages.hearings.length > 0) {
    const latestHearing = stages.hearings[0];
    const hearingDate = new Date(latestHearing.scheduled_date);
    const isPast = hearingDate < new Date();
    
    timelineStages.push({
      id: 'hearing',
      label: 'Barangay Hearing',
      icon: Calendar,
      completed: isPast && latestHearing.outcome,
      inProgress: !isPast || !latestHearing.outcome,
      date: latestHearing.scheduled_date,
      description: latestHearing.outcome 
        ? `Hearing concluded - Outcome: ${latestHearing.outcome}`
        : isPast 
        ? 'Hearing conducted - awaiting outcome'
        : 'Hearing scheduled',
      details: [
        `Location: ${latestHearing.location || 'Barangay Hall'}`,
        latestHearing.hearing_time ? `Time: ${latestHearing.hearing_time}` : null,
        latestHearing.attendees ? `Attendees: ${latestHearing.attendees}` : null,
        stages.hearings.length > 1 ? `Total hearings: ${stages.hearings.length}` : null
      ].filter(Boolean),
      badge: latestHearing.outcome === 'Resolved' ? 'success' :
             latestHearing.outcome === 'NotResolved' ? 'warning' :
             latestHearing.outcome === 'Cancelled' ? 'error' : 'info'
    });
  }

  // 6. Lupon/Mediation (Only if mediation records exist)
  if (stages.mediations && stages.mediations.length > 0) {
    const latestMediation = stages.mediations[0];
    
    timelineStages.push({
      id: 'mediation',
      label: 'Lupon Mediation',
      icon: Users,
      completed: !!latestMediation.outcome,
      inProgress: !latestMediation.outcome,
      date: latestMediation.mediation_date,
      description: latestMediation.outcome
        ? `Mediation concluded - Outcome: ${latestMediation.outcome}`
        : 'Mediation in progress',
      details: [
        `Mediator: ${latestMediation.mediator_name || 'Assigned'}`,
        latestMediation.mediation_time ? `Time: ${latestMediation.mediation_time}` : null,
        latestMediation.agreed_terms ? 'Agreement reached' : null,
        stages.mediations.length > 1 ? `Total sessions: ${stages.mediations.length}` : null
      ].filter(Boolean),
      badge: latestMediation.outcome === 'Success' ? 'success' :
             latestMediation.outcome === 'Partial' ? 'warning' :
             latestMediation.outcome === 'Failed' ? 'error' : 'info'
    });
  }

  // 7. Dispatch (Only if dispatch exists)
  if (dispatches && dispatches.length > 0) {
    const latestDispatch = dispatches[0];
    const isCompleted = ['Completed', 'Cancelled'].includes(latestDispatch.dispatch_status);
    
    timelineStages.push({
      id: 'dispatch',
      label: 'Law Enforcement Dispatch',
      icon: Radio,
      completed: isCompleted,
      inProgress: !isCompleted,
      date: latestDispatch.dispatched_at,
      description: `Officer ${latestDispatch.officer_name} - ${latestDispatch.dispatch_status}`,
      details: [
        latestDispatch.police_stations ? `Station: ${latestDispatch.police_stations.station_name}` : null,
        `Status: ${latestDispatch.dispatch_status}`,
        dispatches.length > 1 ? `Total dispatches: ${dispatches.length}` : null
      ].filter(Boolean),
      badge: latestDispatch.dispatch_status === 'Completed' ? 'success' :
             latestDispatch.dispatch_status === 'Cancelled' ? 'error' : 'info'
    });
  }

  // 8. Evidence Recording (Only if evidence exists) - Enhanced with details
  if (evidence && evidence.length > 0) {
    // Add evidence creation events
    evidence.forEach((ev, idx) => {
      timelineStages.push({
        id: `evidence-${ev.id}`,
        label: 'Evidence Recorded',
        icon: Shield,
        completed: true,
        date: ev.created_at,
        description: `${ev.evidence_name} (${ev.evidence_type})`,
        details: [
          ev.evidence_source ? `Source: ${ev.evidence_source}` : null,
          ev.collection_location ? `Location: ${ev.collection_location}` : null,
          ev.evidence_status ? `Status: ${ev.evidence_status}` : null,
          ev.collected_by ? `Collected by: ${ev.collected_by}` : null
        ].filter(Boolean),
        badge: 'info'
      });

      // Add evidence status change if not initial status
      if (ev.evidence_status && ev.evidence_status !== 'Collected' && ev.updated_at !== ev.created_at) {
        timelineStages.push({
          id: `evidence-status-${ev.id}`,
          label: `Evidence ${ev.evidence_status}`,
          icon: CheckCircle,
          completed: true,
          date: ev.updated_at,
          description: `${ev.evidence_name} status updated`,
          details: [`New Status: ${ev.evidence_status}`],
          badge: ev.evidence_status === 'Accepted' ? 'success' : 
                 ev.evidence_status === 'Archived' ? 'info' : 'warning'
        });
      }
    });

    // Add custody transfer events
    if (evidenceCustody && evidenceCustody.length > 0) {
      evidenceCustody.forEach((custody) => {
        const evidenceItem = evidence.find(e => e.id === custody.evidence_id);
        
        timelineStages.push({
          id: `custody-${custody.id}`,
          label: `Evidence Custody: ${custody.action_type}`,
          icon: Shield,
          completed: true,
          date: custody.action_at,
          description: evidenceItem?.evidence_name || 'Evidence item',
          details: [
            custody.from_user ? `From: ${custody.from_user}` : null,
            custody.to_user ? `To: ${custody.to_user}` : null,
            custody.performed_by ? `Performed by: ${custody.performed_by}` : null,
            custody.location ? `Location: ${custody.location}` : null,
            custody.transfer_reason ? `Reason: ${custody.transfer_reason}` : null,
            custody.notes ? `Notes: ${custody.notes}` : null
          ].filter(Boolean),
          badge: 'info'
        });
      });
    }
  }

  // 9. Resolution (Only if resolution exists)
  if (stages.resolutions && stages.resolutions.length > 0) {
    const resolution = stages.resolutions[0];
    
    timelineStages.push({
      id: 'resolution',
      label: 'Case Resolution',
      icon: Award,
      completed: true,
      date: resolution.resolution_date,
      description: `Resolved: ${resolution.resolution_type}`,
      details: [
        resolution.resolution_description ? `Details: ${resolution.resolution_description}` : null,
        resolution.recommendations ? 'Recommendations provided' : null
      ].filter(Boolean),
      badge: 'success'
    });
  }

  // 10. Case Closed (Only if case is closed)
  if (caseDoc && caseDoc.case_status === 'Closed') {
    timelineStages.push({
      id: 'closed',
      label: 'Case Closed',
      icon: CheckCircle,
      completed: true,
      date: caseDoc.updated_at,
      description: 'Case officially closed',
      details: ['Final status: Closed'],
      badge: 'success'
    });
  }

  // Sort timeline stages chronologically
  timelineStages.sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateA - dateB;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {timelineStages.map((stage, index) => {
        const Icon = stage.icon;
        const isLast = index === timelineStages.length - 1;
        
        return (
          <div key={stage.id} className="relative">
            {/* Timeline connector line */}
            {!isLast && (
              <div
                className={`absolute left-6 top-12 w-0.5 ${
                  stage.completed ? 'bg-primary' : 'bg-border'
                }`}
                style={{ height: '4rem' }}
              />
            )}

            {/* Timeline item */}
            <div className="flex gap-4">
              {/* Icon circle */}
              <div className="flex-shrink-0">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    stage.completed
                      ? 'bg-primary text-white'
                      : stage.inProgress
                      ? 'bg-orange-100 text-orange-600 border-2 border-orange-300'
                      : 'bg-gray-100 text-muted border-2 border-border'
                  }`}
                >
                  {stage.completed ? (
                    <CheckCircle size={20} />
                  ) : stage.inProgress ? (
                    <Clock size={20} />
                  ) : (
                    <Circle size={20} />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-text">{stage.label}</h3>
                    {stage.badge && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium border ${getBadgeColor(
                          stage.badge
                        )}`}
                      >
                        {stage.badge === 'success' && '✓ '}
                        {stage.badge === 'warning' && '⚠ '}
                        {stage.badge === 'error' && '✕ '}
                        {stage.completed
                          ? 'Completed'
                          : stage.inProgress
                          ? 'In Progress'
                          : 'Pending'}
                      </span>
                    )}
                  </div>
                  {stage.date && (
                    <span className="text-xs text-muted whitespace-nowrap ml-4">
                      {formatDateTime(stage.date)}
                    </span>
                  )}
                </div>

                <p className="text-sm text-text mb-2">{stage.description}</p>

                {stage.details && stage.details.length > 0 && (
                  <ul className="space-y-1">
                    {stage.details.map((detail, idx) => (
                      <li key={idx} className="text-xs text-muted flex items-center gap-2">
                        <span className="w-1 h-1 bg-muted rounded-full" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Timeline summary */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center gap-6 text-xs text-muted">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-primary" />
            <span>{timelineStages.filter(s => s.completed).length} Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-orange-600" />
            <span>{timelineStages.filter(s => s.inProgress).length} In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle size={14} className="text-muted" />
            <span>
              {timelineStages.filter(s => !s.completed && !s.inProgress).length} Pending
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseTimeline;
