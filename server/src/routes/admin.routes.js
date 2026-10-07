import express from 'express';
import {
  getDashboard, getUsers, getUser, toggleUserStatus,
  getAllIssues, getOverdueBooks, getUnpaidFines,
} from '../controllers/admin.controller.js';
import { protect, adminOnly } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id/toggle', toggleUserStatus);
router.get('/issues', getAllIssues);
router.get('/overdue', getOverdueBooks);
router.get('/fines', getUnpaidFines);

export default router;
