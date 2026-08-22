import express from 'express';
import { db } from '../data/store.ts';
import { authMiddleware, AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

// GET /api/notifications
router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const userNotifs = db.notifications
    .filter((n) => n.userId === user._id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  res.json(userNotifs);
});

// GET /api/notifications/unread-count
router.get('/unread-count', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const unreadCount = db.notifications.filter((n) => n.userId === user._id && !n.read).length;
  res.json({ unreadCount });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  const notif = db.notifications.find((n) => n._id === req.params.id && n.userId === user._id);

  if (!notif) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  notif.read = true;
  res.json({ message: 'Marked as read', notification: notif });
});

// PUT /api/notifications/read-all
router.put('/read-all', authMiddleware, (req: AuthRequest, res) => {
  const user = req.user!;
  db.notifications.forEach((n) => {
    if (n.userId === user._id) {
      n.read = true;
    }
  });

  res.json({ message: 'All notifications marked as read' });
});

export default router;
