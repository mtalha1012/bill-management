import express, { Router } from 'express';
import { deleteExpense } from '../controllers/expenseController.js';
import { protect } from '../middleware/auth.js';
import { IdParams, MessageResponse } from '../types/api.js';

const router: Router = express.Router();

router.delete<IdParams, MessageResponse>('/:id', protect, deleteExpense);

export default router;
