# PHASE 1 DATABASE DEPLOYMENT INSTRUCTIONS

**Project:** LEIRS-REVISE (kyvhyhmqwcxbloiliojw)  
**Date:** 2026-09-30  
**Status:** Ready for Supabase SQL Editor Deployment

---

## DEPLOYMENT STEPS

### Step 1: Open Supabase Console

1. Go to https://app.supabase.com/projects
2. Sign in if required
3. Select project: **LEIRS-REVISE**

### Step 2: Navigate to SQL Editor

1. In the left sidebar, click **SQL Editor**
2. Click **New Query** (or use existing blank query)

### Step 3: Copy Deployment Script

1. Open file: `leirs-backend/database/PHASE_1_DEPLOYMENT_SCRIPT.sql`
2. Copy **entire contents** (all migrations + verification queries)
3. Paste into Supabase SQL Editor

### Step 4: Execute Migrations

1. In SQL Editor, click **RUN** button (or press Ctrl+Enter)
2. Wait for execution to complete (~10-30 seconds)
3. Watch the query output panel

### Step 5: Verify Results

Scroll down in the output panel and verify all 10 verification queries show:

#### Expected Results:

**VERIFICATION 1: incidents table - NEW COLUMNS**
```
✅ complainant_email | character varying(255) | yes | NULL
✅ complainant_address | text | yes | NULL
✅ respondent_address | text | yes | NULL
```

**VERIFICATION 2: incidents table - EXISTING RESPONDENT COLUMNS**
```
✅ respondent_name | text | yes | NULL
✅ respondent_contact | text | yes | NULL
```

**VERIFICATION 3: case_documentations table - NEW COLUMNS**
```
✅ current_stage | character varying(50) | yes | NULL
✅ dispatch_required | boolean | yes | false
```

**VERIFICATION 4: incidents table - INDEXES**
```
✅ idx_incidents_complainant_email | ...
✅ idx_incidents_respondent_address | ...
✅ idx_incidents_respondent_name | ... (from 2026_09_29)
```

**VERIFICATION 5: case_documentations table - INDEXES**
```
✅ idx_case_documentations_current_stage | ...
✅ idx_case_documentations_dispatch_required | ...
```

**VERIFICATION 6: INCIDENTS TABLE - RECORD COUNT**
```
✅ total_incident_records | [number > 0]
```
(Your actual incident count - should be unchanged)

**VERIFICATION 7: CASE_DOCUMENTATIONS TABLE - RECORD COUNT**
```
✅ total_case_records | [number > 0]
```
(Your actual case count - should be unchanged)

**VERIFICATION 8: CASE_DOCUMENTATIONS TABLE - DATA INTEGRITY**
```
✅ total_cases | [number]
✅ cases_with_dispatch_required_false | [same as total_cases]
✅ cases_with_current_stage_null | [same as total_cases]
```
(All existing cases should have dispatch_required=FALSE and current_stage=NULL)

**VERIFICATION 9 & 10: Complete Schema**
```
✅ incidents table: Should show all original columns + 3 new columns
✅ case_documentations table: Should show all original columns + 2 new columns
```

---

## TROUBLESHOOTING

### Error: "Column already exists"
**Cause:** Migrations may have already been run  
**Solution:** This is safe - migrations use `IF NOT EXISTS` clauses. Re-running is idempotent.

### Error: "Table not found"
**Cause:** Wrong project or table doesn't exist  
**Solution:** Verify you're in LEIRS-REVISE project and check table names

### Error: "Permission denied"
**Cause:** User doesn't have schema modification permissions  
**Solution:** Use Supabase account with admin/owner role

### Error: "Index already exists"
**Cause:** Indexes may have already been created  
**Solution:** This is safe - migrations use `IF NOT EXISTS` for indexes

---

## POST-DEPLOYMENT CHECKLIST

After successful deployment, verify:

- [ ] All 10 verification queries executed without errors
- [ ] incidents.complainant_email exists (VARCHAR(255), nullable)
- [ ] incidents.complainant_address exists (TEXT, nullable)
- [ ] incidents.respondent_name still exists (from 2026_09_29)
- [ ] incidents.respondent_contact still exists (from 2026_09_29)
- [ ] incidents.respondent_address exists (TEXT, nullable)
- [ ] case_documentations.current_stage exists (VARCHAR(50), nullable)
- [ ] case_documentations.dispatch_required exists (BOOLEAN, default FALSE)
- [ ] All 5 indexes created successfully
- [ ] Total incident count unchanged
- [ ] Total case count unchanged
- [ ] All existing cases have dispatch_required = FALSE
- [ ] All existing cases have current_stage = NULL

---

## WHAT WAS DEPLOYED

### Migration 1: 2026_09_30_add_complainant_details_to_incidents.sql
- **Adds:** complainant_email (VARCHAR(255))
- **Adds:** complainant_address (TEXT)
- **Creates:** idx_incidents_complainant_email
- **Impact:** Enables full complainant information collection at incident stage

### Migration 2: 2026_09_30_add_respondent_address_to_incidents.sql
- **Adds:** respondent_address (TEXT)
- **Creates:** idx_incidents_respondent_address
- **Note:** respondent_name and respondent_contact already exist (from 2026_09_29)
- **Impact:** Completes respondent information collection

### Migration 3: 2026_09_30_add_workflow_tracking_to_case_documentations.sql
- **Adds:** current_stage (VARCHAR(50))
- **Adds:** dispatch_required (BOOLEAN, default FALSE)
- **Creates:** idx_case_documentations_current_stage
- **Creates:** idx_case_documentations_dispatch_required
- **Impact:** Enables 13-stage workflow tracking and explicit dispatch control

---

## BACKWARD COMPATIBILITY

✅ **All existing records safe:**
- New columns are nullable or have sensible defaults
- No existing columns modified or dropped
- All new columns default to NULL/FALSE for old records
- No data migration required

✅ **All existing workflows continue:**
- Existing dispatch logic continues (still based on case_status = 'For Mediation')
- Existing incident reporting continues (new fields optional)
- Existing case creation continues (new fields unused)

✅ **RLS Policies unchanged:**
- No RLS policy modifications
- No GRANT changes needed (already done in 2026_09_29)
- Existing role-based access control continues

---

## NEXT STEPS

### After Verification Passes:

1. Report verification results to user
2. Wait for approval to proceed to Phase 2
3. Phase 2: Modify Reporting.jsx to collect new fields
4. Phase 2: Implement incident review workflow
5. Phase 2: Implement case creation with party auto-population

### Do NOT Proceed to Phase 2 Until:
- All 10 verification queries pass
- Data integrity confirmed (record counts unchanged)
- RLS policies verified (no errors in verification queries)

---

## MIGRATION FILES LOCATION

All migration files are stored in:
```
leirs-backend/database/migrations/
├── 2026_09_30_add_complainant_details_to_incidents.sql
├── 2026_09_30_add_respondent_address_to_incidents.sql
└── 2026_09_30_add_workflow_tracking_to_case_documentations.sql
```

Deployment script is at:
```
leirs-backend/database/PHASE_1_DEPLOYMENT_SCRIPT.sql
```

---

## SUPPORT

If deployment fails or verification queries show unexpected results:

1. Copy the entire SQL output
2. Check error messages in the query output panel
3. Verify project is LEIRS-REVISE (kyvhyhmqwcxbloiliojw)
4. Check that all table names are correct (incidents, case_documentations, case_parties, etc.)
5. Retry execution (safe due to `IF NOT EXISTS` clauses)

---

**Status:** Ready for Deployment ✅

Execute `PHASE_1_DEPLOYMENT_SCRIPT.sql` in Supabase SQL Editor now.
