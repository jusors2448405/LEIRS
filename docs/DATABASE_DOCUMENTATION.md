# Database Documentation

## Overview

**Database:** Supabase PostgreSQL 15  
**Client:** @supabase/supabase-js v2.111.0  
**API:** PostgREST (auto-generated REST API)

## Schemas

- **public:** Application tables (RLS-protected)
- **private:** Security functions (service_role only)
- **auth:** Supabase Auth users (managed)

## Tables

### Authentication
- `auth.users` - Supabase Auth accounts
- `profiles` - User profiles & roles (RLS enabled)
- `activity_logs` - Audit trail (RLS enabled)

### Operations
- `incidents` - Incident reports
- `case_documentations` - Case files
- `dispatch` - Officer dispatch
- `police_stations` - Station locations
- `case_updates` - Case timeline
- `evidence` - Evidence records
- `evidence_custody` - Custody chain

## Key Tables

### `profiles`
User profiles linked to Supabase Auth (1:1 relationship)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | → auth.users.id (PK, FK) |
| `email` | TEXT | User email |
| `full_name` | TEXT | Display name |
| `role` | TEXT | system_admin/incident_admin/case_admin/dispatch_admin/evidence_admin/status_admin |
| `status` | TEXT | Active/Inactive |
| `last_login_at` | TIMESTAMPTZ | Last login time |

**RLS:** Enabled. System admin full access, users can view/update own profile.

### `activity_logs`
Immutable audit trail

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `action` | TEXT | USER_LOGIN, USER_CREATED, etc |
| `performed_by` | UUID | → profiles.id |
| `target_user` | UUID | → profiles.id |
| `description` | TEXT | Action description |
| `metadata` | JSONB | Additional context |
| `created_at` | TIMESTAMPTZ | Timestamp |

**RLS:** Enabled. System admin reads all, active staff can insert.

### `incidents`
Core incident reports

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `incident_number` | TEXT | INC-YYYY-MMDD-SEQ |
| `incident_type` | TEXT | Theft/Assault/etc |
| `location` | TEXT | Incident location |
| `complainant_name` | TEXT | Reporter name |
| `description` | TEXT | Incident details |
| `priority` | TEXT | Low/Medium/High/Urgent |
| `status` | TEXT | Pending/Under Investigation/Resolved/Closed |
| `reference_pin` | TEXT | 6-digit tracking PIN |

### `case_documentations`
Case files (1:1 with incidents)

| Column | Type | Description |
|--------|------|-------------|
| `incident_id` | UUID | → incidents.id (unique) |
| `case_number` | TEXT | CASE-YYYY-MMDD-SEQ |
| `case_status` | TEXT | Syncs to incidents.status |
| `case_notes` | TEXT | Investigation notes |

### `dispatch`
Officer dispatch records

| Column | Type | Description |
|--------|------|-------------|
| `incident_id` | UUID | → incidents.id |
| `dispatch_number` | TEXT | DSP-YYYY-MMDD-SEQ |
| `police_station_id` | UUID | → police_stations.id |
| `officer_name` | TEXT | Assigned officer |
| `dispatch_status` | TEXT | Dispatched/Responding/On Scene/Completed |
| `dispatched_at` | TIMESTAMPTZ | Dispatch time |

### `evidence`
Evidence records

| Column | Type | Description |
|--------|------|-------------|
| `incident_id` | UUID | → incidents.id |
| `evidence_number` | TEXT | EV-YYYY-MM-DD-SEQ |
| `evidence_type` | TEXT | Document/Image/Video/Physical/etc |
| `evidence_name` | TEXT | Evidence title |
| `status` | TEXT | Logged/In Custody/Transferred/etc |
| `current_custodian` | TEXT | Current holder |

### `evidence_custody`
Chain of custody tracking

| Column | Type | Description |
|--------|------|-------------|
| `evidence_id` | UUID | → evidence.id |
| `action_type` | TEXT | Received/Transferred/Released/etc |
| `from_user` | TEXT | Source person |
| `to_user` | TEXT | Destination person |
| `action_at` | TIMESTAMPTZ | Action timestamp |

## Relationships

```
auth.users (1) ← (1) profiles
profiles (1) → (N) activity_logs

incidents (1) → (1) case_documentations
incidents (1) → (N) dispatch
incidents (1) → (N) case_updates
incidents (1) → (N) evidence
evidence (1) → (N) evidence_custody

police_stations (1) → (N) dispatch
```

Cascade deletes: Auth user deletion removes profile. Incident deletion removes all related records.

## Security Functions

Located in `private` schema, accessible only to service_role.

### `get_user_role(user_id UUID)`
Returns role of active user or NULL if inactive.

### `is_system_admin(user_id UUID)`
Returns TRUE if user is active system administrator.

### `has_any_role(user_id UUID, required_roles TEXT[])`
Returns TRUE if user has any of specified roles and is active.

### `is_active_staff(user_id UUID)`
Returns TRUE if user has any valid role and is active.

## Row Level Security (RLS)

### Current Status
- ✅ `profiles` - Enabled
- ✅ `activity_logs` - Enabled
- Other tables - Planned

### Profiles Policies
- **SELECT:** System admin sees all, users see own
- **INSERT:** System admin only
- **UPDATE:** System admin updates all, users update own name only
- **DELETE:** System admin only

### Activity Logs Policies
- **SELECT:** System admin only
- **INSERT:** All active staff
- **UPDATE:** None (immutable)
- **DELETE:** System admin (cleanup)

## Database Functions

### Auto-Update Timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';
```
Applied to tables with `updated_at` column (not immutable tables).

### Evidence Custody Trigger
Updates `evidence.status` and `evidence.current_custodian` when custody action recorded.

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Security:** Anon key is public and protected by RLS. Service role key must never be in frontend.

## Case Status Notes

### Status Flow
- **incidents.status** syncs from **case_documentations.case_status**
- Values: Pending → Under Investigation → For Mediation → Resolved → Closed
- Display: "For Mediation" shown as "Ready for Dispatch" in UI

### Officer Assignment
- ✅ **dispatch.officer_name** - Source of truth
- ⚠️ **incidents.assigned_officer** - Deprecated (backward compatibility only)
- ⚠️ **case_documentations.assigned_officer** - Deprecated (backward compatibility only)

Get latest officer: `SELECT officer_name FROM dispatch WHERE incident_id = ? ORDER BY dispatched_at DESC LIMIT 1`

---

**Last Updated:** August 25, 2026
