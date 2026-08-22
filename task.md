# Dayflow HRMS - Task Checklist

## Phase 4: Attendance & Timesheets

### Backend
- [x] Create `attendanceController.js` (check-in, check-out, me, all, reconcile)
- [x] Create `attendanceRoutes.js` and mount in `server/src/index.js`
- [x] Create `attendanceReconciler.js` (node-cron job) and start in `server/src/index.js`

### Client Foundation
- [x] Create `MyAttendance.jsx` page (Check-in/out button, live timer, history table)
- [x] Create `AttendanceAdmin.jsx` page (All employees table, filters, reconcile trigger)

### Client Integration
- [x] Connect `MyAttendance` to `/api/attendance/check-in` and `/check-out` and `/me`
- [x] Connect `AttendanceAdmin` to `/api/attendance`
- [x] Update `App.jsx` to include `/attendance` and `/admin/attendance` (with RoleGuard)

### Verification
- [ ] Verify employee can check in and check out
- [ ] Verify admin can view all attendance records
