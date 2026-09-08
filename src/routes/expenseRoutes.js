import express from 'express';
import { deleteExpense } from '../controllers/expenseController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.delete('/:id', protect, deleteExpense);

export default router;
