# Dayflow HRMS - Task Checklist

## Phase 2: Employee Management & Profiles

### Backend
- [x] Create `employeeController.js` (getAll, getOne, updateMe, updateAsAdmin)
- [x] Create `employeeRoutes.js` with correct auth and role guards
- [x] Mount employee routes in `server/src/index.js`

### Client Foundation
- [x] Create `AppShell` component (Sidebar + Topbar layout)
- [x] Update `App.jsx` to use `AppShell` for protected routes

### Client Pages
- [x] Create `EmployeeDirectory` page (Card grid of employees)
- [x] Create `EmployeeProfile` page (View and edit own profile)
- [x] Create admin edit modal or page (Edit any employee)
- [x] Add Avatar upload UI with direct Cloudinary or Multer upload integration

### Verification
- [ ] Verify standard user can view directory but only edit themselves
- [ ] Verify admin can edit all fields of any employee
