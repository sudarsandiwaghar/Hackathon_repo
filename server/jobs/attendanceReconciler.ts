import { db, AttendanceRecord } from '../data/store.ts';

export function reconcileAttendanceForDate(dateStr: string) {
  const activeEmployees = db.employees.filter((e) => e.status !== 'Inactive');
  let insertedCount = 0;
  let updatedCount = 0;

  activeEmployees.forEach((emp) => {
    // Check if record exists
    let record = db.attendance.find((a) => a.employeeId === emp._id && a.date === dateStr);

    // Check if there is an approved leave for this date
    const approvedLeave = db.leaves.find(
      (l) => l.employeeId === emp._id && l.status === 'Approved' && dateStr >= l.startDate && dateStr <= l.endDate
    );

    if (!record) {
      if (approvedLeave) {
        db.attendance.push({
          _id: db.generateId(),
          employeeId: emp._id,
          date: dateStr,
          status: 'Leave',
          source: 'leave-sync',
          notes: `Auto-synced: ${approvedLeave.leaveType} Leave`,
        });
        insertedCount++;
      } else {
        // Mark absent
        db.attendance.push({
          _id: db.generateId(),
          employeeId: emp._id,
          date: dateStr,
          status: 'Absent',
          source: 'system',
          notes: 'Automated EOD absence marker',
        });
        insertedCount++;
      }
    } else {
      // If record exists with check-in
      if (record.checkIn && !record.checkOut) {
        // Did not check out
        record.status = 'Half-day';
        record.notes = 'Auto-flagged Half-day: Incomplete check-out log';
        updatedCount++;
      } else if (record.checkIn && record.checkOut && record.totalHours && record.totalHours < 4) {
        record.status = 'Half-day';
        updatedCount++;
      }
    }
  });

  return { date: dateStr, insertedCount, updatedCount };
}

export function runStartupCatchup() {
  const now = new Date();
  const pastDays = 7;
  const results = [];

  for (let i = 1; i <= pastDays; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends
    const dateStr = d.toISOString().split('T')[0];
    results.push(reconcileAttendanceForDate(dateStr));
  }

  return results;
}
