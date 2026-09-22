import { useLocation } from 'react-router-dom';
import CaseDocumentation from '../encoder/CaseDocumentation';

function Cases() {
  const location = useLocation();
  
  // Check if we received an incident ID from ForwardedIncidents page
  const preselectedIncidentId = location.state?.incidentId;

  return (
    <div className="container-fluid p-4">
      <div className="mb-4">
        <h2 className="mb-1">Case Documentation and Management</h2>
        <p className="text-muted small mb-0">
          Create and manage case documentation for forwarded incidents
        </p>
      </div>
      
      {/* Reuse the existing CaseDocumentation component */}
      <CaseDocumentation preselectedIncidentId={preselectedIncidentId} />
    </div>
  );
}

export default Cases;
