import React, { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Radio, 
  AlertCircle, 
  Download, 
  Filter,
  Package,
  MapPin,
  Activity
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import useAnalytics from '../../hooks/useAnalytics'

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('executive')
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    incidentType: 'all',
    location: 'all',
    status: 'all'
  })

  const { data, loading, error } = useAnalytics(filters)

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      incidentType: 'all',
      location: 'all',
      status: 'all'
    })
  }

  const exportToCSV = () => {
    if (!data) return

    let csv = 'LEIRS Analytics Export\n\n'
    
    csv += 'SUMMARY STATISTICS\n'
    csv += `Total Incidents,${data.summary.totalIncidents}\n`
    csv += `Total Cases,${data.summary.totalCases}\n`
    csv += `Active Cases,${data.summary.activeCases}\n`
    csv += `Resolved Cases,${data.summary.resolvedCases}\n`
    csv += `Closed Cases,${data.summary.closedCases}\n\n`

    csv += 'INCIDENTS BY TYPE\n'
    Object.entries(data.incidentsByType).forEach(([type, count]) => {
      csv += `${type},${count}\n`
    })
    csv += '\n'

    csv += 'INCIDENTS BY STATUS\n'
    Object.entries(data.incidentsByStatus).forEach(([status, count]) => {
      csv += `${status},${count}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leirs-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <div>
            <h3 className="font-semibold text-red-800">Error Loading Analytics</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const hasActiveFilters = filters.startDate || filters.endDate || 
    filters.incidentType !== 'all' || filters.location !== 'all' || filters.status !== 'all'

  const tabs = [
    { id: 'executive', label: 'Executive Summary', icon: BarChart3 },
    { id: 'incidents', label: 'Incident Analytics', icon: AlertCircle },
    { id: 'cases', label: 'Case Analytics', icon: FileText },
    { id: 'dispatch', label: 'Dispatch Analytics', icon: Radio },
    { id: 'evidence', label: 'Evidence Analytics', icon: Package },
    { id: 'location', label: 'Location Analytics', icon: MapPin }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text mb-1">Analytics & Reporting</h1>
          <p className="text-muted">Comprehensive incident and case analytics dashboard</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-primary" />
          <h3 className="font-heading font-semibold text-text">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Incident Type</label>
            <select
              value={filters.incidentType}
              onChange={(e) => handleFilterChange('incidentType', e.target.value)}
              className="input-field"
            >
              <option value="all">All Types</option>
              <option value="Theft">Theft</option>
              <option value="Assault">Assault</option>
              <option value="Vandalism">Vandalism</option>
              <option value="Domestic Violence">Domestic Violence</option>
              <option value="Noise Complaint">Noise Complaint</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input-field"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="For Mediation">For Mediation</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div className="flex items-end">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-white border-b-2 border-primary'
                    : 'text-muted hover:bg-background hover:text-text'
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'executive' && <ExecutiveSummary data={data} />}
        {activeTab === 'incidents' && <IncidentAnalytics data={data} />}
        {activeTab === 'cases' && <CaseAnalytics data={data} />}
        {activeTab === 'dispatch' && <DispatchAnalytics data={data} />}
        {activeTab === 'evidence' && <EvidenceAnalytics data={data} />}
        {activeTab === 'location' && <LocationAnalytics data={data} />}
      </div>

      
    </div>
  )
}

// Executive Summary Component
const ExecutiveSummary = ({ data }) => {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280']

  const statusData = Object.entries(data.incidentsByStatus).map(([name, value]) => ({
    name,
    value
  }))

  const caseStatusData = Object.entries(data.casesByStatus).map(([name, value]) => ({
    name,
    value
  }))

  const dispatchStatusData = Object.entries(data.dispatchByStatus).map(([name, value]) => ({
    name,
    value
  }))

  const monthlyData = Object.entries(data.incidentsByMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({
      month,
      incidents: count
    }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <FileText size={24} className="text-blue-600" />
          </div>
          <p className="text-3xl font-heading font-bold text-text">{data.summary.totalIncidents}</p>
          <p className="text-sm text-muted mt-1">Total Incidents</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <BarChart3 size={24} className="text-purple-600" />
          </div>
          <p className="text-3xl font-heading font-bold text-text">{data.summary.totalCases}</p>
          <p className="text-sm text-muted mt-1">Total Cases</p>
        </div>

        <div className="bg-white border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={24} className="text-green-600" />
          </div>
          <p className="text-3xl font-heading font-bold text-green-600">{data.summary.activeCases}</p>
          <p className="text-sm text-muted mt-1">Active Cases</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <Radio size={24} className="text-orange-600" />
          </div>
          <p className="text-3xl font-heading font-bold text-text">{data.summary.dispatchedCases}</p>
          <p className="text-sm text-muted mt-1">Dispatched Cases</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-2xl font-heading font-bold text-blue-600">{data.summary.underInvestigation}</p>
          <p className="text-xs text-muted mt-1">Under Investigation</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-2xl font-heading font-bold text-yellow-600">{data.summary.pendingCases}</p>
          <p className="text-xs text-muted mt-1">Pending Cases</p>
        </div>
        <div className="bg-white border border-orange-200 rounded-xl p-4">
          <p className="text-2xl font-heading font-bold text-orange-600">{data.summary.dispatchCompletedAwaitingClosure}</p>
          <p className="text-xs text-muted mt-1">Dispatch Done</p>
        </div>
        <div className="bg-white border border-green-200 rounded-xl p-4">
          <p className="text-2xl font-heading font-bold text-green-600">{data.summary.resolvedCases}</p>
          <p className="text-xs text-muted mt-1">Resolved Cases</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-2xl font-heading font-bold text-gray-600">{data.summary.closedCases}</p>
          <p className="text-xs text-muted mt-1">Closed Cases</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-2xl font-heading font-bold text-purple-600">{data.summary.totalEvidence}</p>
          <p className="text-xs text-muted mt-1">Evidence Records</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents by Status - Pie Chart */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="font-heading font-semibold text-text mb-4">Incidents by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => `${value}: ${entry.payload.value}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cases by Status - Pie Chart */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="font-heading font-semibold text-text mb-4">Cases by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={caseStatusData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {caseStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => `${value}: ${entry.payload.value}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Dispatch Status - Pie Chart */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="font-heading font-semibold text-text mb-4">Dispatch Status</h3>
          {dispatchStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dispatchStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dispatchStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => `${value}: ${entry.payload.value}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm text-center py-20">No dispatch records yet</p>
          )}
        </div>
      </div>

      {/* Line Charts */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="font-heading font-semibold text-text mb-4">Incidents Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="incidents" stroke="#1E40AF" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// Incident Analytics Component
const IncidentAnalytics = ({ data }) => {
  const typeData = Object.entries(data.incidentsByType)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const statusData = Object.entries(data.incidentsByStatus)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const monthlyData = Object.entries(data.incidentsByMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, incidents: count }))

  const topLocations = Object.entries(data.incidentsByLocation)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  return (
    <div className="space-y-6">
      {/* Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidents by Type */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="font-heading font-semibold text-text mb-4">Incidents by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#1E40AF" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Incidents by Status */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="font-heading font-semibold text-text mb-4">Incidents by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h3 className="font-heading font-semibold text-text mb-4">Incident Trend Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="incidents" stroke="#1E40AF" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Locations Table */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h3 className="font-heading font-semibold text-text mb-4">Top 10 Incident Locations</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-text">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-text">Location</th>
                <th className="text-right py-3 px-4 font-semibold text-text">Count</th>
              </tr>
            </thead>
            <tbody>
              {topLocations.map((item, index) => (
                <tr key={index} className="border-b border-border hover:bg-background">
                  <td className="py-3 px-4 text-muted">#{index + 1}</td>
                  <td className="py-3 px-4">{item.location}</td>
                  <td className="py-3 px-4 text-right font-semibold">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Case Analytics Component
const CaseAnalytics = ({ data }) => {
  const statusData = Object.entries(data.casesByStatus)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const resolutionRate = data.summary.totalCases > 0
    ? (((data.summary.resolvedCases + data.summary.closedCases) / data.summary.totalCases) * 100).toFixed(1)
    : 0

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-xl p-6">
          <p className="text-3xl font-heading font-bold text-text">{data.summary.totalCases}</p>
          <p className="text-sm text-muted mt-1">Total Cases</p>
        </div>
        <div className="bg-white border border-green-200 rounded-xl p-6">
          <p className="text-3xl font-heading font-bold text-green-600">{data.summary.activeCases}</p>
          <p className="text-sm text-muted mt-1">Active Cases</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-6">
          <p className="text-3xl font-heading font-bold text-text">{data.summary.resolvedCases}</p>
          <p className="text-sm text-muted mt-1">Resolved Cases</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-6">
          <p className="text-3xl font-heading font-bold text-primary">{resolutionRate}%</p>
          <p className="text-sm text-muted mt-1">Resolution Rate</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Status - Pie Chart */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="font-heading font-semibold text-text mb-4">Cases by Status Distribution</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="45%"
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend 
                verticalAlign="bottom" 
                height={60}
                formatter={(value, entry) => `${value}: ${entry.payload.value}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cases by Status - Bar Chart */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="font-heading font-semibold text-text mb-4">Case Status Comparison</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// Dispatch Analytics Component
const DispatchAnalytics = ({ data }) => {
  const statusData = Object.entries(data.dispatchByStatus)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const COLORS = ['#3B82F6', '#F59E0B', '#F97316', '#10B981']

  return (
    <div className="space-y-6">
      {/* KPI Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-xl p-6">
          <p className="text-3xl font-heading font-bold text-text">{data.summary.dispatchedCases}</p>
          <p className="text-sm text-muted mt-1">Total Dispatches</p>
        </div>
        {statusData.map((item, index) => (
          <div key={item.name} className="bg-white border border-border rounded-xl p-6">
            <p className="text-3xl font-heading font-bold" style={{ color: COLORS[index % COLORS.length] }}>
              {item.value}
            </p>
            <p className="text-sm text-muted mt-1">{item.name}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {statusData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dispatch Status - Pie Chart */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h3 className="font-heading font-semibold text-text mb-4">Dispatch Status Distribution</h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  verticalAlign="bottom" 
                  height={60}
                  formatter={(value, entry) => `${value}: ${entry.payload.value}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Dispatch Status - Bar Chart */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h3 className="font-heading font-semibold text-text mb-4">Dispatch Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <Activity size={48} className="text-muted mx-auto mb-4" />
          <p className="text-muted">No dispatch records available yet</p>
        </div>
      )}
    </div>
  )
}

// Evidence Analytics Component
const EvidenceAnalytics = ({ data }) => {
  const typeData = Object.entries(data.evidenceByType)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6']

  return (
    <div className="space-y-6">
      {/* KPI Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <Package size={24} className="text-purple-600" />
          </div>
          <p className="text-3xl font-heading font-bold text-text">{data.summary.totalEvidence}</p>
          <p className="text-sm text-muted mt-1">Total Evidence Records</p>
        </div>
      </div>

      {/* Charts */}
      {typeData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evidence by Type - Bar Chart */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h3 className="font-heading font-semibold text-text mb-4">Evidence by Type</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Evidence by Type - Pie Chart */}
          <div className="bg-white border border-border rounded-xl p-6">
            <h3 className="font-heading font-semibold text-text mb-4">Evidence Type Distribution</h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  verticalAlign="bottom" 
                  height={60}
                  formatter={(value, entry) => `${value}: ${entry.payload.value}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <Package size={48} className="text-muted mx-auto mb-4" />
          <p className="text-muted">No evidence records available yet</p>
        </div>
      )}
    </div>
  )
}

// Location Analytics Component
const LocationAnalytics = ({ data }) => {
  // Helper function to extract short, readable location name from full address
  const getShortLocationName = (fullLocation) => {
    if (!fullLocation) return 'Unknown Location'
    
    // Split by comma to get address parts
    const parts = fullLocation.split(',').map(part => part.trim())
    
    // Return the first meaningful part (first segment before comma)
    // This gives us "Kiko Wet And Dry Market" instead of full address
    return parts[0] || fullLocation
  }

  const locationData = Object.entries(data.incidentsByLocation)
    .map(([location, count]) => ({ 
      location, 
      shortLocation: getShortLocationName(location),
      count 
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  // Custom tooltip to show full address
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-text mb-1">{payload[0].payload.shortLocation}</p>
          <p className="text-sm text-muted mb-2">{payload[0].payload.location}</p>
          <p className="text-sm">
            <span className="text-muted">Incidents: </span>
            <span className="font-semibold text-primary">{payload[0].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-xl p-6">
          <p className="text-3xl font-heading font-bold text-text">
            {Object.keys(data.incidentsByLocation).length}
          </p>
          <p className="text-sm text-muted mt-1">Unique Locations</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-6">
          <p className="text-3xl font-heading font-bold text-text">{data.summary.totalIncidents}</p>
          <p className="text-sm text-muted mt-1">Total Incidents</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-6">
          <p className="text-2xl font-heading font-bold text-primary truncate">
            {getShortLocationName(locationData[0]?.location) || 'N/A'}
          </p>
          <p className="text-sm text-muted mt-1">Top Location</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h3 className="font-heading font-semibold text-text mb-4">Top 15 Incident Locations</h3>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={locationData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="shortLocation" type="category" width={200} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#1E40AF" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Location Table */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h3 className="font-heading font-semibold text-text mb-4">Incident Locations Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-text">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-text">Location</th>
                <th className="text-right py-3 px-4 font-semibold text-text">Incident Count</th>
                <th className="text-right py-3 px-4 font-semibold text-text">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {locationData.map((item, index) => {
                const percentage = ((item.count / data.summary.totalIncidents) * 100).toFixed(1)
                return (
                  <tr key={index} className="border-b border-border hover:bg-background" title={item.location}>
                    <td className="py-3 px-4 text-muted">#{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{item.shortLocation}</div>
                      <div className="text-xs text-muted truncate max-w-md">{item.location}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">{item.count}</td>
                    <td className="py-3 px-4 text-right text-muted">{percentage}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      
    </div>
  )
}

export default Analytics
