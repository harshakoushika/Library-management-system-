import express from 'express';
import {
  issueBook, getMyIssuedBooks, getFine,
  returnBook, markFinePaid,
} from '../controllers/issue.controller.js';
import { protect, adminOnly } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, issueBook);
router.get('/my', protect, getMyIssuedBooks);
router.get('/:id/fine', protect, getFine);

// Admin only
router.patch('/:id/return', protect, adminOnly, returnBook);
router.patch('/:id/pay-fine', protect, adminOnly, markFinePaid);

export default router;
