# Dayflow HRMS - Task Checklist

## Phase 3: Leave Management

### Backend
- [x] Create `leaveController.js` (apply for leave, get my leaves, get all leaves, review leave)
- [x] Implement write-through sync in `leaveController.review`: Upsert `Attendance` records with `status: 'Leave'` when approved.
- [x] Create `leaveRoutes.js` and mount in `server/src/index.js`
- [x] Add `Notification` creation in `leaveController.review` (approve/reject).

### Client Foundation
- [x] Create `MyLeave.jsx` page (Apply form, Leave history table, Balance cards).
- [x] Create `LeaveAdmin.jsx` page (Pending requests queue, Approve/Reject modal).

### Client Integration
- [x] Connect `MyLeave` to `/api/leave` and `/api/leave/me`
- [x] Connect `LeaveAdmin` to `/api/leave` and `/api/leave/:id/review`
- [x] Update `App.jsx` to include `/leave` and `/admin/leave` (with RoleGuard).

### Verification
- [ ] Verify employee can apply for leave.
- [ ] Verify admin can approve leave and it creates Attendance records.
- [ ] Verify admin can reject leave and it does not create Attendance records.
