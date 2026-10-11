# Sidebar Scroll Position - Testing Guide

## Quick Test Steps

### Basic Test (30 seconds)
1. Open System Admin dashboard
2. Scroll sidebar down to "Dispatch" or "Evidence" section
3. Click "Dashboard" under Dispatch
4. ✅ **Expected:** Sidebar stays scrolled at Dispatch section
5. Click "Dashboard" under Case Documentation
6. ✅ **Expected:** Sidebar stays scrolled (no jump to top)
7. Click several different module links rapidly
8. ✅ **Expected:** Scroll position preserved every time

### Edge Case Tests

#### Test 1: Scroll to Bottom
1. Scroll sidebar all the way to bottom
2. Click any navigation link
3. ✅ **Expected:** Stays at bottom

#### Test 2: Multiple Rapid Clicks
1. Scroll to middle of sidebar
2. Click 5-6 different links quickly (1 click per second)
3. ✅ **Expected:** Scroll position stable throughout

#### Test 3: Cross-Module Navigation
1. Scroll to "Evidence" section
2. Click "Dashboard" under Incident Reporting (top section)
3. ✅ **Expected:** Still scrolled to Evidence area (not top)

#### Test 4: Mobile Sidebar
1. Resize browser to mobile view
2. Open sidebar menu
3. Scroll down
4. Click a link (sidebar closes)
5. Reopen sidebar
6. ✅ **Expected:** Scroll position preserved

## Console Debug Output

Open browser console (F12) and watch for these logs:

**Good Behavior:**
```
[Sidebar] Scroll saved: 150
[Sidebar] Scroll saved: 250
[Sidebar] Scroll saved: 380
[Sidebar] Restoring scroll to: 380
[Sidebar] Scroll saved: 380
```

**Bad Behavior (if still broken):**
```
[Sidebar] Scroll saved: 380
[Sidebar] Restoring scroll to: 380
[Sidebar] Scroll saved: 0    ← Wrong! Should not reset
```

## Manual Verification

### Check 1: Nav Element Has Ref
```javascript
// In browser console:
document.querySelector('nav.overflow-y-auto')
// Should return the nav element
```

### Check 2: Scroll Position Changes
```javascript
// Before clicking link:
console.log(document.querySelector('nav.overflow-y-auto').scrollTop)
// Note the value (e.g., 380)

// After clicking link:
console.log(document.querySelector('nav.overflow-y-auto').scrollTop)
// Should be same value (380)
```

### Check 3: Scroll Event Listener
```javascript
// Check if listener is attached:
getEventListeners(document.querySelector('nav.overflow-y-auto'))
// Should show 'scroll' event listener
```

## Common Issues and Fixes

### Issue: Scroll resets to 0
**Cause:** Restoration not happening  
**Check:** Console logs - do you see "Restoring scroll to: X"?  
**Fix:** Verify `useLayoutEffect` is imported and running

### Issue: Scroll jumps/flashes
**Cause:** Using `useEffect` instead of `useLayoutEffect`  
**Check:** Source code - should be `useLayoutEffect`  
**Fix:** Import and use `useLayoutEffect`

### Issue: Inconsistent behavior
**Cause:** Restoration flag timing  
**Check:** Console logs during rapid clicks  
**Fix:** Increase flag timeout from 100ms to 150ms

### Issue: Works sometimes, fails others
**Cause:** Race condition with async loading  
**Check:** Does it fail on specific routes?  
**Fix:** Add additional `requestAnimationFrame` call

## Browser Compatibility Test

Test in multiple browsers:
- [ ] Chrome/Edge (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Performance Check

1. Open Performance tab in DevTools
2. Start recording
3. Scroll sidebar + navigate 5 times
4. Stop recording
5. Check for:
   - ✅ No layout thrashing
   - ✅ No excessive repaints
   - ✅ Smooth 60fps scrolling

## Success Criteria

✅ Scroll position preserved **100%** of the time  
✅ No visual flash or jump  
✅ Works across all roles (System Admin, other admins)  
✅ Works on desktop and mobile  
✅ Console logs show correct save/restore cycle  
✅ Performance remains smooth  

## If Test Fails

1. Check browser console for errors
2. Verify console logs show save/restore cycle
3. Check if `useLayoutEffect` is being used
4. Verify `isRestoringRef` flag is preventing loops
5. Test in different browser
6. Check if sidebar animations interfere (300ms transition)

## Report Issues

If scroll position still resets:

**Include:**
- Browser and version
- Steps to reproduce
- Console log output
- Screenshot/video of behavior
- Which test case failed

**Example Report:**
```
Browser: Chrome 120
Issue: Scroll resets on rapid clicks
Console: Shows "Restoring scroll to: 380" but then "Scroll saved: 0"
Test Case: Test 2 (Multiple Rapid Clicks)
```
