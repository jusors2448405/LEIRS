import React from 'react';
import EvidenceManagement from '../shared/EvidenceManagement';

/**
 * Evidence List page for Evidence Admin role
 * Reuses the shared EvidenceManagement component
 */
function EvidenceList() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-text mb-1">Evidence Management</h1>
        <p className="text-muted">View and manage all evidence records</p>
      </div>

      <EvidenceManagement />
    </div>
  );
}

export default EvidenceList;
