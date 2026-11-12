import express, { Router } from 'express';
import {
  createGroup,
  getUserGroups,
  getGroupById,
  addMember
} from '../controllers/groupController.js';
import {
  createExpense,
  getGroupExpenses,
  getGroupBalances
} from '../controllers/expenseController.js';
import { protect } from '../middleware/auth.js';

const router: Router = express.Router();

router.use(protect);

router.route('/').post(createGroup).get(getUserGroups);
router.route('/:id').get(getGroupById);
router.route('/:id/members').post(addMember);
router.route('/:id/expenses').post(createExpense).get(getGroupExpenses);
router.route('/:id/balances').get(getGroupBalances);

export default router;
