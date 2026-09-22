import React from 'react'
import { FileText } from 'lucide-react'

const PlaceholderPage = ({ title, description }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-text mb-1">{title}</h1>
        <p className="text-muted">{description}</p>
      </div>
      <div className="bg-white border border-border rounded-2xl p-12 flex items-center justify-center">
        <div className="text-center">
          <FileText size={64} className="mx-auto mb-4 text-muted" />
          <h2 className="text-xl font-heading font-semibold text-text mb-2">Coming Soon</h2>
          <p className="text-muted">This module is currently under development.</p>
        </div>
      </div>
    </div>
  )
}

export default PlaceholderPage
