import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  FileText, Users, FileCheck, Calendar, BookOpen,
  CheckCircle
} from 'lucide-react'
import CaseDocumentation from '../encoder/CaseDocumentation'
import CaseParties from './CaseParties'
import SummonsManager from './SummonsManager'
import HearingScheduler from './HearingScheduler'
import MediationLogger from './MediationLogger'
import ResolutionForm from './ResolutionForm'

function Cases() {
  const location = useLocation()
  const preselectedIncidentId = location.state?.incidentId
  
  const [activeTab, setActiveTab] = useState('documentation')
  const [selectedIncidentId, setSelectedIncidentId] = useState(preselectedIncidentId)

  // Update selected incident when preselected incident changes
  useEffect(() => {
    if (preselectedIncidentId) {
      setSelectedIncidentId(preselectedIncidentId)
      setActiveTab('documentation')
    }
  }, [preselectedIncidentId])

  const TABS = [
    {
      id: 'documentation',
      label: 'Case Documentation',
      icon: FileText,
      description: 'Create and manage case documentation'
    },
    {
      id: 'parties',
      label: 'Case Parties',
      icon: Users,
      description: 'Manage complainants and respondents'
    },
    {
      id: 'summons',
      label: 'Summons',
      icon: FileCheck,
      description: 'Issue and track summons to respondents'
    },
    {
      id: 'hearings',
      label: 'Barangay Hearings',
      icon: Calendar,
      description: 'Schedule and manage hearings'
    },
    {
      id: 'mediation',
      label: 'Mediation',
      icon: BookOpen,
      description: 'Log mediation sessions and progress'
    },
    {
      id: 'resolution',
      label: 'Resolution',
      icon: CheckCircle,
      description: 'Record case resolution outcomes'
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'documentation':
        return <CaseDocumentation 
          preselectedIncidentId={selectedIncidentId}
          onIncidentSelect={setSelectedIncidentId}
        />
      case 'parties':
        return <CaseParties incidentId={selectedIncidentId} />
      case 'summons':
        return <SummonsManager incidentId={selectedIncidentId} />
      case 'hearings':
        return <HearingScheduler incidentId={selectedIncidentId} />
      case 'mediation':
        return <MediationLogger incidentId={selectedIncidentId} />
      case 'resolution':
        return <ResolutionForm incidentId={selectedIncidentId} />
      default:
        return <CaseDocumentation 
          preselectedIncidentId={selectedIncidentId}
          onIncidentSelect={setSelectedIncidentId}
        />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-4 pt-4">
        <h1 className="text-3xl font-heading font-bold text-text mb-2">
          Case Documentation and Management
        </h1>
        <p className="text-muted">
          Manage case documentation, parties, summons, hearings, and mediation outcomes
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-border">
        <div className="px-4 overflow-x-auto">
          <div className="flex gap-1 -mb-px">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors
                    whitespace-nowrap text-sm
                    ${isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-text'
                    }
                  `}
                  title={tab.description}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-6">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default Cases
