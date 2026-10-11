# LEIRS Dispatch Module Enhancement - Implementation Plan

**Date:** September 25, 2026  
**Module:** Response Dispatch Module (Enhanced)  
**Objective:** Add Barangay Tanod response capability while preserving existing PNP dispatch workflow

---

## 1. EXECUTIVE SUMMARY

### Current State
The Dispatch Module currently handles **only PNP (Philippine National Police) dispatch** workflow:
- Police station selection and dispatch request
- Station acceptance/decline handling
- Officer assignment
- Status tracking through completion
- 8 status states (Pending Station Response → Completed)

### Enhancement Goal
Support **dual response types** (Barangay Tanod + PNP Officer) within the same module:
- **Barangay Tanod Response:** Direct barangay responder assignment for local incidents
- **PNP Officer Response:** Existing police station workflow (must remain unchanged)
- Unified dashboard showing both response types
- Timeline integration for Case Status Monitoring

### Critical Requirements
1. ✅ **No Breaking Changes:** All existing PNP dispatch records must continue working
2. ✅ **Backward Compatibility:** NULL values for new fields should default to PNP workflow
3. ✅ **Feature Preservation:** Every existing PNP feature must remain functional
4. ✅ **Dual Workflow Support:** Both response types operate independently

---

## 2. DATABASE SCHEMA ANALYSIS

### 2.1 Existing Dispatch Table Structure

**Source:** `database/migrations/007_create_dispatch.sql` + `011_modify_dispatch_for_stations.sql`

**Current Fields:**
```sql
CREATE TABLE public.dispatch (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
    dispatch_number VARCHAR(50) UNIQUE NOT NULL,
    officer_name VARCHAR(100),  -- Used for PNP officer
    dispatch_status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_by VARCHAR(100),
    dispatched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- PNP Station Fields (added in migration 011)
    police_station_id UUID REFERENCES public.police_stations(id),
    station_response_status VARCHAR(30),
    station_responded_at TIMESTAMPTZ,
    officer_assigned_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Constraint
    CONSTRAINT valid_dispatch_status CHECK (dispatch_status IN (
        'Pending Station Response',
        'Station Accepted',
        'Station Declined',
        'Officer Assigned',
        'Dispatched',
        'Responding',
        'On Scene',
        'Completed'
    ))
);
```

**Existing Constraints:**
- `dispatch_number` must be UNIQUE
- `dispatch_status` limited to 8 PNP-specific states
- All timestamp fields are NULLABLE

---

### 2.2 Required New Fields

**Add to `dispatch` table:**

| Field Name | Data Type | Nullable | Default | Purpose |
|------------|-----------|----------|---------|---------|
| `response_type` | VARCHAR(30) | YES | `'pnp_officer'` | Identifies response type: `'barangay_tanod'` or `'pnp_officer'` |
| `responder_name` | VARCHAR(100) | YES | NULL | Name of Barangay Tanod responder |
| `responder_role` | VARCHAR(50) | YES | NULL | Role: Tanod Captain, Tanod Member, etc. |
| `tanod_arrival_time` | TIMESTAMPTZ | YES | NULL | When Barangay Tanod arrived on scene |
| `action_taken` | TEXT | YES | NULL | Description of action taken by responder |
| `response_status` | VARCHAR(30) | YES | NULL | Tanod-specific status (see below) |

**Why These Fields:**
- `response_type`: Differentiates workflows; default ensures all existing records = PNP
- `responder_name`: Separate from `officer_name` for clarity
- `responder_role`: Adds context for Barangay Tanod hierarchy
- `tanod_arrival_time`: Parallel to PNP's `arrived_at` field
- `action_taken`: Captures outcome/resolution details
- `response_status`: Tanod workflow states (independent of `dispatch_status`)

---

### 2.3 Backward Compatibility Strategy

**Existing Records (NULL `response_type`):**
```sql
-- All existing rows have response_type = NULL
-- Default value 'pnp_officer' ensures backward compatibility
UPDATE dispatch SET response_type = 'pnp_officer' WHERE response_type IS NULL;
```

**Application Logic:**
```javascript
// Frontend treats NULL or 'pnp_officer' as PNP workflow
const isPNP = !dispatch.response_type || dispatch.response_type === 'pnp_officer';
const isTanod = dispatch.response_type === 'barangay_tanod';
```

**Status Field Usage:**
- **PNP Workflow:** Uses `dispatch_status` (existing 8 states)
- **Tanod Workflow:** Uses `response_status` (new 4 states)

---

### 2.4 New Constraint Updates

**Update `dispatch_status` constraint:**
```sql
-- Keep existing PNP statuses + add neutral ones
ALTER TABLE dispatch DROP CONSTRAINT IF EXISTS valid_dispatch_status;
ALTER TABLE dispatch ADD CONSTRAINT valid_dispatch_status CHECK (dispatch_status IN (
    -- PNP-specific statuses (preserved)
    'Pending Station Response',
    'Station Accepted',
    'Station Declined',
    'Officer Assigned',
    'Dispatched',
    'Responding',
    'On Scene',
    'Completed',
    
    -- Neutral statuses (for both types)
    'Created',
    'Assigned',
    'In Progress',
    'Resolved'
));
```

**Add `response_status` constraint:**
```sql
-- Tanod-specific statuses
ALTER TABLE dispatch ADD CONSTRAINT valid_response_status CHECK (
    response_status IS NULL OR response_status IN (
        'Pending',
        'Dispatched',
        'On Scene',
        'Completed'
    )
);
```

**Add `response_type` constraint:**
```sql
ALTER TABLE dispatch ADD CONSTRAINT valid_response_type CHECK (
    response_type IS NULL OR response_type IN ('barangay_tanod', 'pnp_officer')
);
```

---

## 3. MIGRATION SQL

**File:** `database/migrations/2026_09_30_enhance_dispatch_for_dual_response.sql`

```sql
-- ============================================================
-- LEIRS Dispatch Module Enhancement Migration
-- Adds Barangay Tanod response capability
-- Preserves all existing PNP dispatch functionality
-- ============================================================

BEGIN;

-- Step 1: Add new columns
ALTER TABLE public.dispatch
    ADD COLUMN IF NOT EXISTS response_type VARCHAR(30) DEFAULT 'pnp_officer',
    ADD COLUMN IF NOT EXISTS responder_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS responder_role VARCHAR(50),
    ADD COLUMN IF NOT EXISTS tanod_arrival_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS action_taken TEXT,
    ADD COLUMN IF NOT EXISTS response_status VARCHAR(30);

-- Step 2: Backfill existing records
UPDATE public.dispatch
SET response_type = 'pnp_officer'
WHERE response_type IS NULL;

-- Step 3: Update dispatch_status constraint (add neutral statuses)
ALTER TABLE public.dispatch DROP CONSTRAINT IF EXISTS valid_dispatch_status;
ALTER TABLE public.dispatch ADD CONSTRAINT valid_dispatch_status CHECK (dispatch_status IN (
    'Pending Station Response',
    'Station Accepted',
    'Station Declined',
    'Officer Assigned',
    'Dispatched',
    'Responding',
    'On Scene',
    'Completed',
    'Created',
    'Assigned',
    'In Progress',
    'Resolved'
));

-- Step 4: Add new constraints
ALTER TABLE public.dispatch ADD CONSTRAINT valid_response_type CHECK (
    response_type IS NULL OR response_type IN ('barangay_tanod', 'pnp_officer')
);

ALTER TABLE public.dispatch ADD CONSTRAINT valid_response_status CHECK (
    response_status IS NULL OR response_status IN (
        'Pending',
        'Dispatched',
        'On Scene',
        'Completed'
    )
);

-- Step 5: Add index for response_type filtering
CREATE INDEX IF NOT EXISTS idx_dispatch_response_type ON public.dispatch(response_type);
CREATE INDEX IF NOT EXISTS idx_dispatch_response_status ON public.dispatch(response_status);

-- Step 6: Add comment documentation
COMMENT ON COLUMN public.dispatch.response_type IS 'Type of response: barangay_tanod or pnp_officer (default)';
COMMENT ON COLUMN public.dispatch.responder_name IS 'Barangay Tanod responder name (used when response_type = barangay_tanod)';
COMMENT ON COLUMN public.dispatch.responder_role IS 'Barangay Tanod role: Tanod Captain, Tanod Member, etc.';
COMMENT ON COLUMN public.dispatch.tanod_arrival_time IS 'Timestamp when Barangay Tanod arrived on scene';
COMMENT ON COLUMN public.dispatch.action_taken IS 'Description of action taken by responder';
COMMENT ON COLUMN public.dispatch.response_status IS 'Barangay Tanod workflow status (Pending, Dispatched, On Scene, Completed)';

COMMIT;
```

**Rollback SQL:**
```sql
BEGIN;

-- Remove indexes
DROP INDEX IF EXISTS idx_dispatch_response_type;
DROP INDEX IF EXISTS idx_dispatch_response_status;

-- Remove constraints
ALTER TABLE public.dispatch DROP CONSTRAINT IF EXISTS valid_response_type;
ALTER TABLE public.dispatch DROP CONSTRAINT IF EXISTS valid_response_status;

-- Restore original dispatch_status constraint
ALTER TABLE public.dispatch DROP CONSTRAINT IF EXISTS valid_dispatch_status;
ALTER TABLE public.dispatch ADD CONSTRAINT valid_dispatch_status CHECK (dispatch_status IN (
    'Pending Station Response',
    'Station Accepted',
    'Station Declined',
    'Officer Assigned',
    'Dispatched',
    'Responding',
    'On Scene',
    'Completed'
));

-- Remove columns
ALTER TABLE public.dispatch
    DROP COLUMN IF EXISTS response_type,
    DROP COLUMN IF EXISTS responder_name,
    DROP COLUMN IF EXISTS responder_role,
    DROP COLUMN IF EXISTS tanod_arrival_time,
    DROP COLUMN IF EXISTS action_taken,
    DROP COLUMN IF EXISTS response_status;

COMMIT;
```

---

## 4. FRONTEND IMPLEMENTATION PLAN

### 4.1 React Hook Updates

#### **File:** `leirs-frontend/src/hooks/useDispatch.js`

**Changes Required:**
1. Update `createDispatch()` to accept `response_type` parameter
2. Add `response_type` to SELECT queries
3. Add validation logic for response type

**New Function:**
```javascript
/**
 * Create Barangay Tanod Dispatch
 * @param {{
 *   incident_id, responder_name, responder_role, notes?, created_by?
 * }} fields
 * @returns {{ error: string|null }}
 */
const createTanodDispatch = async (fields) => {
  if (!fields.incident_id) return { error: 'No incident selected.' }
  if (!fields.responder_name?.trim()) return { error: 'Responder name is required.' }

  setSaving(true)
  setError(null)

  const dispatchNumber = generateDispatchNumber()

  const { data, error: insertError } = await supabase
    .from('dispatch')
    .insert([{
      incident_id:     fields.incident_id,
      dispatch_number: dispatchNumber,
      response_type:   'barangay_tanod',
      responder_name:  fields.responder_name.trim(),
      responder_role:  fields.responder_role || 'Tanod Member',
      response_status: 'Pending',
      dispatch_status: 'Created', // Neutral status
      notes:           fields.notes || null,
      created_by:      fields.created_by || null,
      dispatched_at:   new Date().toISOString(),
    }])
    .select()
    .single()

  if (!insertError) {
    setDispatches((prev) => [data, ...prev])
    setSaving(false)
    return { error: null }
  }

  setSaving(false)
  const msg = insertError?.message || 'Failed to create tanod dispatch.'
  setError(msg)
  return { error: msg }
}
```

**Updated Query Selection:**
```javascript
.select(`
  id, dispatch_number, officer_name, dispatch_status, notes, created_by,
  dispatched_at, created_at, updated_at, incident_id,
  response_type, responder_name, responder_role, tanod_arrival_time,
  action_taken, response_status,
  incidents (id, incident_number, incident_type, location, priority, status)
`)
```

---

#### **File:** `leirs-frontend/src/hooks/useDispatchRequest.js`

**New Function:**
```javascript
/**
 * Create Barangay Tanod Dispatch Request
 */
const createTanodDispatchRequest = async ({
  incidentId,
  responderName,
  responderRole,
  notes,
  createdBy
}) => {
  setLoading(true);
  setError(null);

  try {
    const dispatchNumber = generateDispatchNumber();

    const { data, error: insertError } = await supabase
      .from('dispatch')
      .insert([{
        incident_id: incidentId,
        dispatch_number: dispatchNumber,
        response_type: 'barangay_tanod',
        responder_name: responderName,
        responder_role: responderRole || 'Tanod Member',
        response_status: 'Pending',
        dispatch_status: 'Created',
        notes: notes || null,
        created_by: createdBy || null,
        dispatched_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    setLoading(false);
    return { data, error: null };
  } catch (err) {
    console.error('Error creating tanod dispatch:', err);
    setError(err.message);
    setLoading(false);
    return { data: null, error: err.message };
  }
};

/**
 * Update Barangay Tanod Response Status
 */
const updateTanodResponseStatus = async (dispatchId, status, actionTaken = null, arrivalTime = null) => {
  setLoading(true);
  setError(null);

  try {
    const updates = { response_status: status };
    
    if (status === 'On Scene' && arrivalTime) {
      updates.tanod_arrival_time = arrivalTime;
    }
    
    if (status === 'Completed' && actionTaken) {
      updates.action_taken = actionTaken;
    }

    const { data, error: updateError } = await supabase
      .from('dispatch')
      .update(updates)
      .eq('id', dispatchId)
      .select()
      .single();

    if (updateError) throw updateError;

    setLoading(false);
    return { data, error: null };
  } catch (err) {
    console.error('Error updating tanod status:', err);
    setError(err.message);
    setLoading(false);
    return { data: null, error: err.message };
  }
};

return {
  loading,
  error,
  createDispatchRequest,       // Existing PNP function
  createTanodDispatchRequest,  // NEW
  updateStationResponse,
  assignOfficer,
  updateDispatchStatus,
  updateTanodResponseStatus    // NEW
};
```

---

### 4.2 UI Component Updates

#### **4.2.1 Dashboard Updates**

**File:** `leirs-frontend/src/pages/dispatch-admin/Dashboard.jsx`

**Changes:**
1. Rename "Pending Dispatch Requests" → "Pending Response Requests"
2. Add split statistics: Barangay Tanod vs PNP
3. Update fetchDashboardStats() to query by response_type

**New Stats Structure:**
```javascript
const [stats, setStats] = useState({
  pendingResponse: 0,           // All pending (both types)
  barangayTanodActive: 0,       // Tanod: Dispatched + On Scene
  pnpActive: 0,                 // PNP: Responding + On Scene
  totalBarangayTanod: 0,        // All tanod responses
  totalPNP: 0,                  // All PNP responses
  completed: 0,                 // All completed (both types)
  total: 0                      // Grand total
});
```

**Updated Stat Cards:**
```jsx
{/* Summary Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="bg-white border border-yellow-200 rounded-xl p-6">
    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
      <AlertCircle size={24} className="text-yellow-600" />
    </div>
    <p className="text-2xl font-heading font-bold text-yellow-600 mt-3">
      {loading ? '—' : stats.pendingResponse}
    </p>
    <p className="text-sm text-muted mt-1">Pending Response Requests</p>
  </div>

  <div className="bg-white border border-green-200 rounded-xl p-6">
    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
      <Users size={24} className="text-green-600" />
    </div>
    <p className="text-2xl font-heading font-bold text-green-600 mt-3">
      {loading ? '—' : stats.barangayTanodActive}
    </p>
    <p className="text-sm text-muted mt-1">Barangay Tanod Responses</p>
  </div>

  <div className="bg-white border border-blue-200 rounded-xl p-6">
    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
      <Radio size={24} className="text-blue-600" />
    </div>
    <p className="text-2xl font-heading font-bold text-blue-600 mt-3">
      {loading ? '—' : stats.pnpActive}
    </p>
    <p className="text-sm text-muted mt-1">PNP Responses</p>
  </div>

  <div className="bg-white border border-purple-200 rounded-xl p-6">
    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
      <CheckCircle size={24} className="text-purple-600" />
    </div>
    <p className="text-2xl font-heading font-bold text-purple-600 mt-3">
      {loading ? '—' : stats.completed}
    </p>
    <p className="text-sm text-muted mt-1">Completed Today</p>
  </div>
</div>
```

**Query Updates:**
```javascript
const fetchDashboardStats = async () => {
  setLoading(true);
  
  try {
    // Barangay Tanod stats
    const { count: tanodActive } = await supabase
      .from('dispatch')
      .select('*', { count: 'exact', head: true })
      .eq('response_type', 'barangay_tanod')
      .in('response_status', ['Dispatched', 'On Scene']);

    const { count: tanodTotal } = await supabase
      .from('dispatch')
      .select('*', { count: 'exact', head: true })
      .eq('response_type', 'barangay_tanod');

    // PNP stats
    const { count: pnpActive } = await supabase
      .from('dispatch')
      .select('*', { count: 'exact', head: true })
      .or('response_type.eq.pnp_officer,response_type.is.null')
      .in('dispatch_status', ['Responding', 'On Scene']);

    const { count: pnpTotal } = await supabase
      .from('dispatch')
      .select('*', { count: 'exact', head: true })
      .or('response_type.eq.pnp_officer,response_type.is.null');

    // Combined stats
    const { count: completed } = await supabase
      .from('dispatch')
      .select('*', { count: 'exact', head: true })
      .or('dispatch_status.eq.Completed,response_status.eq.Completed');

    const { count: total } = await supabase
      .from('dispatch')
      .select('*', { count: 'exact', head: true });

    setStats({
      pendingResponse: pendingCount,
      barangayTanodActive: tanodActive || 0,
      pnpActive: pnpActive || 0,
      totalBarangayTanod: tanodTotal || 0,
      totalPNP: pnpTotal || 0,
      completed: completed || 0,
      total: total || 0
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
  } finally {
    setLoading(false);
  }
};
```

---

#### **4.2.2 Active Dispatches Updates**

**File:** `leirs-frontend/src/pages/dispatch-admin/ActiveDispatches.jsx`

**Changes:**
1. Add response_type filter tabs: All | Barangay Tanod | PNP Officer
2. Conditional rendering based on response_type
3. Display different fields for Tanod vs PNP

**New Filter State:**
```javascript
const [responseTypeFilter, setResponseTypeFilter] = useState('all');
```

**Filter Tabs UI:**
```jsx
{/* Response Type Filter Tabs */}
<div className="flex gap-2 mb-4">
  <button
    onClick={() => setResponseTypeFilter('all')}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      responseTypeFilter === 'all'
        ? 'bg-primary text-white'
        : 'bg-white border border-border text-muted hover:bg-background'
    }`}
  >
    All Responses
  </button>
  <button
    onClick={() => setResponseTypeFilter('barangay_tanod')}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      responseTypeFilter === 'barangay_tanod'
        ? 'bg-green-600 text-white'
        : 'bg-white border border-border text-muted hover:bg-background'
    }`}
  >
    Barangay Tanod
  </button>
  <button
    onClick={() => setResponseTypeFilter('pnp_officer')}
    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
      responseTypeFilter === 'pnp_officer'
        ? 'bg-blue-600 text-white'
        : 'bg-white border border-border text-muted hover:bg-background'
    }`}
  >
    PNP Officer
  </button>
</div>
```

**Conditional Card Rendering:**
```jsx
{filteredDispatches.map((dispatch) => {
  const isTanod = dispatch.response_type === 'barangay_tanod';
  const isPNP = !dispatch.response_type || dispatch.response_type === 'pnp_officer';

  return (
    <div key={dispatch.id} className="bg-white border border-border rounded-xl p-6 shadow-sm">
      {/* Response Type Badge */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isTanod ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {isTanod ? '🛡️ Barangay Tanod' : '👮 PNP Officer'}
        </span>
        {/* ... other badges ... */}
      </div>

      {/* TANOD-SPECIFIC FIELDS */}
      {isTanod && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-start gap-2">
            <User size={16} className="text-green-600 mt-0.5" />
            <div>
              <p className="text-xs text-muted">Assigned Tanod</p>
              <p className="text-sm font-semibold text-text">{dispatch.responder_name}</p>
              {dispatch.responder_role && (
                <p className="text-xs text-muted">{dispatch.responder_role}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Clock size={16} className="text-muted mt-0.5" />
            <div>
              <p className="text-xs text-muted">Dispatch Time</p>
              <p className="text-sm text-text">{formatDateTime(dispatch.dispatched_at)}</p>
            </div>
          </div>

          {dispatch.tanod_arrival_time && (
            <div className="flex items-start gap-2">
              <CheckCircle size={16} className="text-green-600 mt-0.5" />
              <div>
                <p className="text-xs text-muted">Arrival Time</p>
                <p className="text-sm text-text">{formatDateTime(dispatch.tanod_arrival_time)}</p>
              </div>
            </div>
          )}

          {dispatch.action_taken && (
            <div className="md:col-span-3">
              <p className="text-xs text-muted mb-1">Action Taken</p>
              <p className="text-sm text-text">{dispatch.action_taken}</p>
            </div>
          )}
        </div>
      )}

      {/* PNP-SPECIFIC FIELDS (EXISTING) */}
      {isPNP && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* ... existing PNP fields ... */}
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-primary mt-0.5" />
            <div>
              <p className="text-xs text-muted">Police Station</p>
              <p className="text-sm font-semibold text-text">
                {dispatch.police_station?.station_name || 'N/A'}
              </p>
            </div>
          </div>
          {/* ... other PNP fields ... */}
        </div>
      )}

      {/* ACTION BUTTONS - Conditional by Type */}
      <div className="flex flex-wrap gap-2">
        {isTanod && (
          <>
            {dispatch.response_status === 'Pending' && (
              <button
                onClick={() => handleUpdateTanodStatus(dispatch.id, 'Dispatched')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Mark as Dispatched
              </button>
            )}
            {dispatch.response_status === 'Dispatched' && (
              <button
                onClick={() => handleUpdateTanodStatus(dispatch.id, 'On Scene')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Mark as On Scene
              </button>
            )}
            {dispatch.response_status === 'On Scene' && (
              <button
                onClick={() => {
                  setSelectedDispatch(dispatch);
                  setShowActionTakenModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Complete Response
              </button>
            )}
          </>
        )}

        {isPNP && (
          <>
            {/* ... existing PNP action buttons ... */}
          </>
        )}
      </div>
    </div>
  );
})}
```

---

#### **4.2.3 Pending Dispatch/Response Updates**

**File:** `leirs-frontend/src/pages/dispatch-admin/PendingDispatch.jsx`

**Changes:**
1. Rename page title: "Pending Dispatch Requests" → "Pending Response Requests"
2. Add response type selection modal
3. Route to appropriate workflow (Tanod form OR PNP station selection)

**New Modal:**
```jsx
{/* Response Type Selection Modal */}
{showResponseTypeModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl p-6 max-w-md w-full">
      <h3 className="text-lg font-semibold text-text mb-4">Select Response Type</h3>
      <p className="text-sm text-muted mb-6">
        Choose how to respond to this incident
      </p>

      <div className="space-y-3">
        <button
          onClick={() => handleResponseTypeSelect('barangay_tanod')}
          className="w-full p-4 border-2 border-border rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users size={24} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-text">Barangay Tanod</p>
              <p className="text-sm text-muted">Assign local barangay responder</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleResponseTypeSelect('pnp_officer')}
          className="w-full p-4 border-2 border-border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Radio size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-text">PNP Officer</p>
              <p className="text-sm text-muted">Select police station and dispatch</p>
            </div>
          </div>
        </button>
      </div>

      <button
        onClick={() => setShowResponseTypeModal(false)}
        className="w-full mt-4 px-4 py-2 border border-border rounded-lg hover:bg-background"
      >
        Cancel
      </button>
    </div>
  </div>
)}
```

**Handler Functions:**
```javascript
const handleResponseTypeSelect = (type) => {
  setShowResponseTypeModal(false);
  
  if (type === 'barangay_tanod') {
    navigate(`/dispatch-admin/tanod-dispatch/${selectedCase.incident_id}`);
  } else {
    navigate(`/dispatch-admin/dispatch/${selectedCase.incident_id}`); // Existing PNP flow
  }
};
```

---

#### **4.2.4 NEW: Barangay Tanod Dispatch Form**

**New File:** `leirs-frontend/src/pages/dispatch-admin/TanodDispatchForm.jsx`

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useDispatchRequest from '../../hooks/useDispatchRequest';

function TanodDispatchForm() {
  const { incidentId } = useParams();
  const navigate = useNavigate();

  const [incident, setIncident] = useState(null);
  const [caseDoc, setCaseDoc] = useState(null);
  const [responderName, setResponderName] = useState('');
  const [responderRole, setResponderRole] = useState('Tanod Member');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const { loading: submitting, error, createTanodDispatchRequest } = useDispatchRequest();

  const RESPONDER_ROLES = [
    'Tanod Captain',
    'Tanod Vice Captain',
    'Tanod Member',
    'Desk Officer',
    'Patrol Officer'
  ];

  useEffect(() => {
    fetchIncidentData();
  }, [incidentId]);

  const fetchIncidentData = async () => {
    try {
      setLoading(true);
      
      const { data: incidentData, error: incidentError } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', incidentId)
        .single();

      if (incidentError) throw incidentError;
      setIncident(incidentData);

      const { data: caseData } = await supabase
        .from('case_documentations')
        .select('*')
        .eq('incident_id', incidentId)
        .single();

      if (caseData) setCaseDoc(caseData);
    } catch (err) {
      console.error('Error fetching incident:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!responderName.trim()) {
      alert('Please enter responder name');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const result = await createTanodDispatchRequest({
      incidentId: incident.id,
      responderName: responderName.trim(),
      responderRole,
      notes: notes.trim() || null,
      createdBy: user.username || 'dispatch_admin'
    });

    if (!result.error) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/dispatch-admin/active');
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted">Loading incident data...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-text mb-2">
            Barangay Tanod Dispatched!
          </h3>
          <p className="text-muted">Redirecting to active responses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <button
        onClick={() => navigate('/dispatch-admin/pending')}
        className="flex items-center gap-2 text-muted hover:text-text"
      >
        <ArrowLeft size={20} />
        Back to Pending
      </button>

      {/* Incident Details */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-heading font-semibold text-text mb-4">
          Incident Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted">Incident Number</p>
            <p className="font-mono font-semibold text-text">
              {incident?.incident_number}
            </p>
          </div>
          {caseDoc && (
            <div>
              <p className="text-sm text-muted">Case Number</p>
              <p className="font-mono font-semibold text-primary">
                {caseDoc.case_number}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted">Type</p>
            <p className="text-text">{incident?.incident_type}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Location</p>
            <p className="text-text">{incident?.location}</p>
          </div>
        </div>
      </div>

      {/* Dispatch Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-heading font-semibold text-text">
            Barangay Tanod Assignment
          </h2>

          {/* Responder Name */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Responder Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={responderName}
                onChange={(e) => setResponderName(e.target.value)}
                placeholder="Enter full name of Barangay Tanod"
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
          </div>

          {/* Responder Role */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Responder Role
            </label>
            <select
              value={responderRole}
              onChange={(e) => setResponderRole(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {RESPONDER_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Dispatch Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions or additional information..."
              rows={4}
              className="w-full px-4 py-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || !responderName.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Dispatching...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Dispatch Barangay Tanod
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dispatch-admin/pending')}
              disabled={submitting}
              className="px-6 py-3 border border-border rounded-lg hover:bg-background transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>

      {/* Info Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-800">
            <p className="font-semibold mb-1">Barangay Tanod Response</p>
            <p>
              This incident will be assigned to a Barangay Tanod responder.
              You can track the response status and completion in Active Responses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TanodDispatchForm;
```

---

### 4.3 Routing Updates

**File:** `leirs-frontend/src/App.jsx` (or relevant router file)

**Add New Route:**
```jsx
<Route path="/dispatch-admin/tanod-dispatch/:incidentId" element={<TanodDispatchForm />} />
```

---

## 5. TIMELINE INTEGRATION

### 5.1 Case Status Monitoring Updates

**File:** `leirs-frontend/src/components/CaseTimeline.jsx`

**Add Barangay Tanod Events:**
```javascript
// Existing timeline events + NEW Tanod events

// Tanod Dispatch Created
if (event.table === 'dispatch' && event.type === 'INSERT' && event.data.response_type === 'barangay_tanod') {
  timelineItems.push({
    id: `dispatch-tanod-${event.data.id}`,
    type: 'dispatch_tanod',
    timestamp: event.data.dispatched_at || event.data.created_at,
    title: 'Barangay Tanod Dispatched',
    description: `Responder: ${event.data.responder_name} (${event.data.responder_role})`,
    icon: <Users size={20} className="text-green-600" />,
    iconBg: 'bg-green-100',
    metadata: {
      responder: event.data.responder_name,
      role: event.data.responder_role,
      dispatch_number: event.data.dispatch_number
    }
  });
}

// Tanod Status Changes
if (event.table === 'dispatch' && event.type === 'UPDATE' && event.data.response_type === 'barangay_tanod') {
  const oldStatus = event.old_data?.response_status;
  const newStatus = event.data.response_status;
  
  if (oldStatus !== newStatus) {
    let title, icon, iconBg;
    
    switch (newStatus) {
      case 'Dispatched':
        title = 'Tanod En Route';
        icon = <Clock size={20} className="text-orange-600" />;
        iconBg = 'bg-orange-100';
        break;
      case 'On Scene':
        title = 'Tanod Arrived on Scene';
        icon = <MapPin size={20} className="text-purple-600" />;
        iconBg = 'bg-purple-100';
        break;
      case 'Completed':
        title = 'Tanod Response Completed';
        icon = <CheckCircle size={20} className="text-green-600" />;
        iconBg = 'bg-green-100';
        break;
    }
    
    timelineItems.push({
      id: `dispatch-status-${event.data.id}-${newStatus}`,
      type: 'dispatch_tanod_status',
      timestamp: event.data.updated_at,
      title,
      description: `Status changed: ${oldStatus} → ${newStatus}`,
      icon,
      iconBg,
      metadata: {
        old_status: oldStatus,
        new_status: newStatus,
        responder: event.data.responder_name
      }
    });
  }
}

// Action Taken Recorded
if (event.table === 'dispatch' && event.type === 'UPDATE' && event.data.action_taken && !event.old_data?.action_taken) {
  timelineItems.push({
    id: `action-taken-${event.data.id}`,
    type: 'action_taken',
    timestamp: event.data.updated_at,
    title: 'Action Taken Recorded',
    description: event.data.action_taken,
    icon: <FileText size={20} className="text-blue-600" />,
    iconBg: 'bg-blue-100',
    metadata: {
      responder: event.data.responder_name
    }
  });
}
```

---

## 6. TESTING CHECKLIST

### 6.1 Database Testing

- [ ] Run migration successfully in Supabase SQL Editor
- [ ] Verify all new columns exist
- [ ] Verify constraints are applied correctly
- [ ] Test backward compatibility: existing PNP records still display
- [ ] Test default values: NULL response_type treated as PNP

### 6.2 PNP Workflow (Regression Testing)

- [ ] Create new PNP dispatch (station selection)
- [ ] Station accept/decline flow works
- [ ] Officer assignment works
- [ ] Status progression works (all 8 states)
- [ ] Dispatch details display correctly
- [ ] Dashboard stats show PNP dispatches

### 6.3 Barangay Tanod Workflow (New Features)

- [ ] Create new Tanod dispatch
- [ ] Responder name and role saved correctly
- [ ] Status progression works (Pending → Dispatched → On Scene → Completed)
- [ ] Action taken field saves correctly
- [ ] Arrival time records correctly
- [ ] Dashboard stats show Tanod responses

### 6.4 Mixed Data Testing

- [ ] Dashboard shows combined stats correctly
- [ ] Active Dispatches shows both types
- [ ] Filtering by response type works
- [ ] Timeline shows both PNP and Tanod events
- [ ] No data corruption when switching between types

### 6.5 UI/UX Testing

- [ ] Response type selection modal works
- [ ] Conditional rendering shows correct fields
- [ ] Status badges display correct colors
- [ ] Action buttons show for correct response type
- [ ] Forms validate required fields
- [ ] Success/error messages display correctly

---

## 7. ROLLOUT STRATEGY

### Phase 1: Database Migration (30 minutes)
1. Backup production database
2. Execute migration SQL in Supabase
3. Verify schema changes
4. Test backward compatibility with existing records

### Phase 2: Backend/Hook Deployment (1 hour)
1. Deploy updated `useDispatch.js` hook
2. Deploy updated `useDispatchRequest.js` hook
3. Test API endpoints with new fields
4. Verify queries return correct data

### Phase 3: Frontend Deployment (2 hours)
1. Deploy Dashboard updates
2. Deploy Active Dispatches updates
3. Deploy Pending Response updates
4. Deploy new Tanod Dispatch Form
5. Update routing configuration

### Phase 4: Timeline Integration (30 minutes)
1. Deploy CaseTimeline updates
2. Verify Tanod events appear correctly
3. Test real-time updates

### Phase 5: Testing & Validation (1 hour)
1. Create test Tanod dispatch
2. Create test PNP dispatch
3. Verify both workflows work independently
4. Verify dashboard statistics are accurate
5. Verify timeline shows all events

**Total Estimated Time:** 5 hours

---

## 8. RISK MITIGATION

### Risk 1: Existing PNP Records Break
**Mitigation:**
- Default value for `response_type` = 'pnp_officer'
- NULL handling in frontend: `!response_type || response_type === 'pnp_officer'`
- Backward compatibility testing before deployment

### Risk 2: Constraint Violations
**Mitigation:**
- All new fields are NULLABLE
- Constraints use `IS NULL OR` pattern
- Migration includes constraint updates before data insertion

### Risk 3: UI Confusion (Two Workflows)
**Mitigation:**
- Clear visual differentiation (colors, icons, badges)
- Response type selection modal forces deliberate choice
- Separate tabs/filters in Active Dispatches
- Contextual help text throughout UI

### Risk 4: Timeline Event Overload
**Mitigation:**
- Group related events
- Collapsible timeline sections
- Filter timeline by event type
- Limit initial display to recent events

---

## 9. FUTURE ENHANCEMENTS (Post-Implementation)

1. **Barangay Tanod Availability Management**
   - Add `barangay_tanods` table with availability status
   - Show available responders during dispatch creation

2. **Response Time Analytics**
   - Compare Tanod vs PNP response times
   - Dashboard metrics for average completion time

3. **Mobile App for Tanod Responders**
   - Real-time status updates
   - GPS tracking for arrival verification

4. **Escalation Workflow**
   - Auto-escalate Tanod → PNP if incident severity increases
   - Multi-responder coordination

5. **Barangay Performance Reports**
   - Response time trends
   - Responder efficiency metrics
   - Incident resolution rates

---

## 10. DOCUMENTATION REQUIREMENTS

### Developer Documentation
- [ ] Update API documentation with new dispatch fields
- [ ] Document response type decision tree
- [ ] Add code examples for Tanod dispatch creation
- [ ] Update database schema diagrams

### User Documentation
- [ ] Create user guide for response type selection
- [ ] Document Barangay Tanod workflow steps
- [ ] Update training materials
- [ ] Create FAQ for Dispatch Admin role

### System Administration
- [ ] Migration rollback procedure
- [ ] Troubleshooting guide for dispatch issues
- [ ] Data retention policies for dispatch records

---

## 11. SUCCESS CRITERIA

✅ **Implementation is complete when:**
1. Database migration executes without errors
2. All existing PNP dispatches display and function correctly
3. New Barangay Tanod dispatches can be created and completed
4. Dashboard shows accurate statistics for both response types
5. Timeline displays both PNP and Tanod events chronologically
6. All unit tests pass (PNP regression + Tanod new features)
7. User acceptance testing approved by Dispatch Admin users
8. Documentation updated and reviewed
9. Zero production incidents reported in first 48 hours post-deployment

---

**END OF IMPLEMENTATION PLAN**

**Next Steps:**
1. Review and approve this plan
2. Confirm database migration strategy
3. Begin Phase 1: Database Migration
4. Proceed with phased deployment

**Estimated Total Implementation Time:** 12-16 hours (including testing)
