# LEIRS API Documentation

**System:** LEIRS (Law Enforcement and Incident Reporting System)  
**Location:** Barangay 178, Camarin, North Caloocan City  
**Backend:** Supabase (PostgreSQL 15)  
**Frontend:** React 19 + Vite 6  
**Authentication:** Supabase Auth  
**Date:** August 25, 2026

---

## Architecture

### Data Flow
```
User → React Frontend → Supabase Client → Supabase API → PostgreSQL
```

### Authentication
- **Method:** Supabase Auth with email/password
- **Auth Table:** `auth.users` (Supabase managed)
- **Profile Table:** `public.profiles` (role-based access)
- **Activity Logs:** `public.activity_logs` (audit trail)
- **Security:** Row Level Security (RLS) enabled

### 6 Admin Roles
| Role | Module | Permissions |
|------|--------|-------------|
| `system_admin` | System Administration | User management, settings, analytics |
| `incident_admin` | Incident Reporting | Create/verify incidents |
| `case_admin` | Case Documentation | Document cases, forward to dispatch |
| `dispatch_admin` | Law Enforcement Dispatch | Assign officers, manage dispatches |
| `evidence_admin` | Evidence Management | Log evidence, custody tracking |
| `status_admin` | Case Status Monitoring | Update status, monitor progress |

---

## Core API Operations

### Authentication
```javascript
// Login
const { data, error } = await supabase.auth.signInWithPassword({ email, password })

// Get Profile
const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

// Logout
await supabase.auth.signOut()
```

### Incidents
```javascript
// Create Incident (Public Form)
const { data } = await supabase.from('incidents').insert({ 
  incident_type, description, location, reporter_name, reporter_contact 
})

// List Incidents (Admin)
const { data } = await supabase.from('incidents').select('*').order('created_at', { ascending: false })

// Verify Incident (Incident Admin)
const { data } = await supabase.from('incidents').update({ 
  status: 'Under Investigation', verified: true 
}).eq('id', incidentId)
```

### Cases
```javascript
// Create Case Documentation (Case Admin)
const { data } = await supabase.from('case_documentations').insert({ 
  incident_id, case_number, description, priority 
})

// Forward to Dispatch (Case Admin)
const { data } = await supabase.from('case_documentations').update({ 
  forwarded_to_dispatch: true 
}).eq('id', caseId)
```

### Dispatch
```javascript
// Create Dispatch (Dispatch Admin)
const { data } = await supabase.from('dispatch').insert({ 
  incident_id, police_station_id, officer_name, priority 
})

// Update Status (Dispatch Admin)
const { data } = await supabase.from('dispatch').update({ 
  status: 'On Scene' 
}).eq('id', dispatchId)
```

### Evidence
```javascript
// Log Evidence (Evidence Admin)
const { data } = await supabase.from('evidence').insert({ 
  incident_id, evidence_type, description, collected_by 
})

// Record Custody Transfer (Evidence Admin)
const { data } = await supabase.from('evidence_custody').insert({ 
  evidence_id, transferred_from, transferred_to 
})
```

### Activity Logs
```javascript
// Log Activity (All Admins)
const { data } = await supabase.from('activity_logs').insert({ 
  action, performed_by, description, metadata 
})

// View Logs (System Admin)
const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false })
```

---

## ID Formats

| Type | Format | Example |
|------|--------|---------|
| Incident | `LEIRS-{YYYY}-{MMDD}-{SEQ}` | LEIRS-2026-0825-001 |
| Case | `CASE-{YYYY}-{MMDD}-{SEQ}` | CASE-2026-0825-001 |
| Dispatch | `DSP-{YYYY}-{MMDD}-{SEQ}` | DSP-2026-0825-0001 |
| Evidence | `EV-{YYYY}-{MM}-{DD}-{SEQ}` | EV-2026-08-25-001 |
| Tracking PIN | 6-digit number | 004821 |

---

## Status Values

### Incident/Case Status
- `Pending` - New incident
- `Under Investigation` - Case created
- `For Dispatch` - Ready for officer assignment
- `Dispatched` - Officer assigned
- `On Scene` - Officer responding
- `For Mediation` - Requires barangay mediation
- `Resolved` - Case closed
- `Rejected` - Not valid

### Dispatch Status
- `Pending` - Created, not assigned
- `Dispatched` - Officer assigned
- `Responding` - En route
- `On Scene` - Arrived at location
- `Completed` - Finished

### Evidence Status
- `Collected` - Evidence obtained
- `In Custody` - Stored securely
- `Transferred` - Custody changed
- `Released` - Returned/disposed

---

## Database Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `auth.users` | Authentication | id, email, encrypted_password |
| `profiles` | User profiles | id, email, role, status |
| `incidents` | Incident reports | incident_number, type, status, location |
| `case_documentations` | Case docs | case_number, incident_id, priority |
| `dispatch` | Officer dispatch | dispatch_number, incident_id, officer_name |
| `evidence` | Evidence records | evidence_number, incident_id, type |
| `evidence_custody` | Custody chain | evidence_id, transferred_from, transferred_to |
| `case_updates` | Status updates | incident_id, update_type, notes |
| `activity_logs` | Audit trail | action, performed_by, timestamp |
| `police_stations` | Station info | name, address, coordinates |

---

## Security

### RLS Policies
- **Profiles:** Users can read own profile; system_admin can manage all
- **Activity Logs:** Only system_admin can read; all admins can insert
- **Private Functions:** `private.is_system_admin()`, `private.has_any_role()`

### Password Security
- Hashed with bcrypt in `auth.users`
- Never stored in plaintext
- 20-minute idle timeout enforced

---

## Error Handling

### Common Errors
- `401 Unauthorized` - Invalid credentials or session expired
- `403 Forbidden` - RLS policy blocking access
- `404 Not Found` - Record doesn't exist
- `PGRST116` - Expected 1 row, got 0 (common in `.single()` queries)

### Best Practices
```javascript
try {
  const { data, error } = await supabase.from('table').select()
  if (error) throw error
  // Handle data
} catch (error) {
  console.error('Error:', error.message)
  // Show user-friendly message
}
```

---

## API Reference Quick Links

- **Supabase JS Docs:** https://supabase.com/docs/reference/javascript
- **PostgreSQL 15 Docs:** https://www.postgresql.org/docs/15/
- **RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security

---

**Document Version:** 2.0  
**Last Updated:** August 25, 2026  
**Status:** Current System Documentation
