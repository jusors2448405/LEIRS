import React, { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Eye, AlertCircle, FileX, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ViewIncidentModal from '../../components/ViewIncidentModal'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  'All',
  'Pending',
  'Under Investigation',
  'For Mediation',
  'Resolved',
  'Closed',
]

const STATUS_COLORS = {
  'Pending':             'bg-yellow-100 text-yellow-700',
  'Under Investigation': 'bg-blue-100 text-blue-700',
  'For Mediation':       'bg-purple-100 text-purple-700',
  'Resolved':            'bg-green-100 text-green-700',
  'Closed':              'bg-gray-100 text-gray-600',
}

const PAGE_SIZE = 10

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (val) => {
  if (!val) return '—'
  const d = new Date(val + 'T00:00:00')
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatTime = (val) => {
  if (!val) return '—'
  const [h, m] = val.split(':')
  const d = new Date()
  d.setHours(Number(h), Number(m))
  return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const cls = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  )
}

const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} className="px-4 py-4">
        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: i === 0 ? '80%' : '60%' }} />
      </td>
    ))}
  </tr>
)

// ─── Main Component ───────────────────────────────────────────────────────────

const Incidents = () => {
  const [incidents, setIncidents]       = useState([])
  const [totalCount, setTotalCount]     = useState(0)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  const [search, setSearch]             = useState('')
  const [searchInput, setSearchInput]   = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage]                 = useState(1)

  const [selectedIncident, setSelectedIncident] = useState(null)

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchIncidents = useCallback(async () => {
    setLoading(true)
    setError(null)

    const from = (page - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let query = supabase
      .from('incidents')
      .select('id, incident_number, incident_type, incident_date, incident_time, location, complainant_name, complainant_contact, description, priority, status, assigned_officer, created_by, created_at, updated_at, reference_pin', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (statusFilter !== 'All') {
      query = query.eq('status', statusFilter)
    }

    if (search.trim()) {
      const term = `%${search.trim()}%`
      query = query.or(
        `incident_number.ilike.${term},incident_type.ilike.${term},location.ilike.${term},complainant_name.ilike.${term}`
      )
    }

    const { data, error: fetchError, count } = await query

    if (fetchError) {
      setError(fetchError.message)
      setIncidents([])
      setTotalCount(0)
    } else {
      setIncidents(data || [])
      setTotalCount(count || 0)
    }

    setLoading(false)
  }, [page, statusFilter, search])

  useEffect(() => {
    fetchIncidents()
  }, [fetchIncidents])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  // ── Search: debounce 350 ms ───────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  // ── Derived ───────────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const pageNumbers = (() => {
    const pages = []
    const delta = 1
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      pages.push(i)
    }
    if (pages[0] > 1)          pages.unshift('...')
    if (pages[0] !== 1)        pages.unshift(1)
    if (pages[pages.length - 1] < totalPages)  pages.push('...')
    if (pages[pages.length - 1] !== totalPages) pages.push(totalPages)
    return pages
  })()

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-text mb-1">Incident List</h1>
        <p className="text-muted">View and manage all incident reports.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by incident no., type, location, or reporter..."
            className="input-field pl-10 text-sm"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field pl-9 pr-8 text-sm appearance-none cursor-pointer min-w-[180px]"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>
        </div>

        {/* Refresh */}
        <button
          onClick={fetchIncidents}
          disabled={loading}
          title="Refresh"
          className="p-2.5 border border-border rounded-lg text-muted hover:text-primary hover:border-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Result count */}
      {!loading && !error && (
        <p className="text-sm text-muted -mt-2">
          {totalCount === 0
            ? 'No incidents found.'
            : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount} incident${totalCount !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Failed to load incidents</p>
            <p className="text-red-500 mt-0.5">{error}</p>
            <button
              onClick={fetchIncidents}
              className="mt-2 underline text-red-600 hover:text-red-700 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background">
                <tr>
                  {['Incident No.', 'Type', 'Date', 'Time', 'Location', 'Reporter', 'Contact', 'Status', ''].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-3.5 text-left font-heading font-semibold text-muted text-xs uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-border">

                {/* Loading skeleton */}
                {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

                {/* Empty state */}
                {!loading && incidents.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted">
                        <FileX size={40} className="text-border" />
                        <p className="font-medium text-text">No incidents found</p>
                        <p className="text-sm">
                          {search || statusFilter !== 'All'
                            ? 'Try adjusting your search or filter.'
                            : 'No incident reports have been submitted yet.'}
                        </p>
                        {(search || statusFilter !== 'All') && (
                          <button
                            onClick={() => { setSearchInput(''); setStatusFilter('All') }}
                            className="mt-1 text-sm text-primary underline font-medium"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!loading && incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-background/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-medium text-primary whitespace-nowrap">
                      {inc.incident_number}
                    </td>
                    <td className="px-4 py-3.5 text-text whitespace-nowrap">{inc.incident_type}</td>
                    <td className="px-4 py-3.5 text-text whitespace-nowrap">{formatDate(inc.incident_date)}</td>
                    <td className="px-4 py-3.5 text-text whitespace-nowrap">{formatTime(inc.incident_time)}</td>
                    <td className="px-4 py-3.5 text-text max-w-[160px] truncate" title={inc.location}>
                      {inc.location}
                    </td>
                    <td className="px-4 py-3.5 text-text whitespace-nowrap">{inc.complainant_name}</td>
                    <td className="px-4 py-3.5 text-text whitespace-nowrap">{inc.complainant_contact || '—'}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-muted hover:text-primary hover:border-primary transition-colors whitespace-nowrap"
                      >
                        <Eye size={13} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg text-muted hover:text-primary hover:border-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={15} />
            Previous
          </button>

          <div className="flex items-center gap-1">
            {pageNumbers.map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 py-1 text-sm text-muted select-none">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-primary text-white'
                      : 'border border-border text-muted hover:text-primary hover:border-primary'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg text-muted hover:text-primary hover:border-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* View modal */}
      {selectedIncident && (
        <ViewIncidentModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          showPin={true}
        />
      )}
    </div>
  )
}

export default Incidents
