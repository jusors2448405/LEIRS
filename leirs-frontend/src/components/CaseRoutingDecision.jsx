import React, { useState } from 'react';
import { 
  Scale, Shield, Archive, CheckCircle, AlertCircle, 
  FileText, Radio, FolderArchive, X, ArrowRight 
} from 'lucide-react';

/**
 * CaseRoutingDecision Component
 * 
 * Provides a decision point after incident review to route cases to:
 * 1. Barangay Case Process (Case Documentation)
 * 2. PNP/Law Enforcement Referral (Dispatch)
 * 3. Archive / No Further Action
 * 
 * @param {Object} incident - The incident data
 * @param {Function} onRouting - Callback when routing decision is made
 * @param {Function} onCancel - Callback to cancel routing
 */
const CaseRoutingDecision = ({ incident, onRouting, onCancel }) => {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  const routingOptions = [
    {
      id: 'barangay_case',
      label: 'Barangay Case Process',
      icon: Scale,
      color: 'blue',
      description: 'Create case documentation for Barangay mediation and resolution',
      examples: [
        'Disputes between neighbors',
        'Complaints requiring mediation',
        'Cases needing Lupon intervention',
        'Conflicts suitable for Barangay resolution'
      ],
      nextStep: 'Case Documentation Module',
      badge: 'Mediation'
    },
    {
      id: 'pnp_referral',
      label: 'PNP / Law Enforcement Referral',
      icon: Shield,
      color: 'red',
      description: 'Refer to police for immediate law enforcement action',
      examples: [
        'Assault or physical injury',
        'Serious theft or robbery',
        'Violent incidents',
        'Cases requiring police investigation'
      ],
      nextStep: 'Dispatch Module',
      badge: 'Police Action'
    },
    {
      id: 'archive',
      label: 'Archive / No Further Action',
      icon: FolderArchive,
      color: 'gray',
      description: 'Close incident and archive without further processing',
      examples: [
        'Resolved informally',
        'Complainant withdrew',
        'Insufficient information',
        'Out of Barangay jurisdiction'
      ],
      nextStep: 'Incident History',
      badge: 'Closed'
    }
  ];

  const getColorClasses = (color, selected) => {
    const baseClasses = {
      blue: {
        border: 'border-blue-200',
        bg: 'bg-blue-50',
        hover: 'hover:border-blue-300 hover:bg-blue-100',
        selected: 'border-blue-500 bg-blue-50 ring-2 ring-blue-200',
        icon: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      red: {
        border: 'border-red-200',
        bg: 'bg-red-50',
        hover: 'hover:border-red-300 hover:bg-red-100',
        selected: 'border-red-500 bg-red-50 ring-2 ring-red-200',
        icon: 'text-red-600',
        badge: 'bg-red-100 text-red-700 border-red-200'
      },
      gray: {
        border: 'border-gray-200',
        bg: 'bg-gray-50',
        hover: 'hover:border-gray-300 hover:bg-gray-100',
        selected: 'border-gray-500 bg-gray-50 ring-2 ring-gray-200',
        icon: 'text-gray-600',
        badge: 'bg-gray-100 text-gray-700 border-gray-200'
      }
    };

    return baseClasses[color];
  };

  const handleSelect = (routeId) => {
    setSelectedRoute(routeId);
    setError(null);
  };

  const handleConfirm = () => {
    if (!selectedRoute) {
      setError('Please select a routing option');
      return;
    }

    const selectedOption = routingOptions.find(opt => opt.id === selectedRoute);
    
    // Call parent callback with routing decision
    onRouting({
      decision: selectedRoute,
      reason: reason.trim() || null,
      decidedAt: new Date().toISOString(),
      label: selectedOption.label
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <ArrowRight size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-heading font-bold text-text mb-2">
              Case Routing Decision
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Incident <span className="font-mono font-semibold text-primary">{incident.incident_number}</span> has been reviewed. 
              Please select how this incident should be processed based on the Barangay procedures.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Routing Options */}
      <div className="space-y-4">
        {routingOptions.map((option) => {
          const colors = getColorClasses(option.color, selectedRoute === option.id);
          const Icon = option.icon;
          const isSelected = selectedRoute === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`
                w-full text-left p-5 rounded-xl border-2 transition-all
                ${isSelected ? colors.selected : `${colors.border} ${colors.bg} ${colors.hover}`}
              `}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                  <Icon size={24} className={colors.icon} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title and Badge */}
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-heading font-bold text-text text-base">
                      {option.label}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded font-medium border ${colors.badge}`}>
                      {option.badge}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted mb-3">
                    {option.description}
                  </p>

                  {/* Examples */}
                  <div className="space-y-1.5 mb-3">
                    <p className="text-xs font-semibold text-text uppercase tracking-wide">
                      Suitable for:
                    </p>
                    <ul className="space-y-1">
                      {option.examples.map((example, idx) => (
                        <li key={idx} className="text-xs text-muted flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Next Step */}
                  <div className="flex items-center gap-2 text-xs font-medium text-primary">
                    <ArrowRight size={14} />
                    <span>Next: {option.nextStep}</span>
                  </div>
                </div>

                {/* Selection Indicator */}
                <div className="flex-shrink-0">
                  {isSelected ? (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <CheckCircle size={16} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 border-2 border-border rounded-full" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Reason/Notes (Optional) */}
      {selectedRoute && (
        <div className="bg-white border border-border rounded-xl p-5">
          <label className="block text-sm font-medium text-text mb-2">
            Reason / Notes (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide additional context for this routing decision..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm"
          />
          <p className="text-xs text-muted mt-2">
            This information will be recorded in the activity log for reference.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-muted hover:text-text hover:bg-background rounded-lg transition-colors flex items-center gap-2"
        >
          <X size={16} />
          Cancel
        </button>

        <button
          onClick={handleConfirm}
          disabled={!selectedRoute}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle size={18} />
          Confirm Routing Decision
        </button>
      </div>

      {/* Info Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Routing Decisions</p>
            <p className="text-xs leading-relaxed">
              This decision determines the next step in processing this incident. You can route cases to the appropriate 
              module based on the nature and severity of the incident. All routing decisions are logged and can be 
              reviewed in the activity history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseRoutingDecision;
