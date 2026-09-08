import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
import { AppError, asyncHandler } from '../middleware/error.js';

export const createExpense = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  const isMember = group.members.some(
    (memberId) => memberId.toString() === req.user._id.toString()
  );

  if (!isMember) {
    return next(new AppError('You do not have access to this group', 403));
  }

  const { description, amount, paidBy, splitAmong, category, date } = req.body;

  if (!description || amount === undefined || amount === null) {
    return next(new AppError('Description and amount are required', 400));
  }

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return next(new AppError('Amount must be a positive number', 400));
  }

  const payerId = paidBy || req.user._id;
  const isPayerMember = group.members.some(
    (memberId) => memberId.toString() === payerId.toString()
  );

  if (!isPayerMember) {
    return next(new AppError('Payer must be a member of the group', 400));
  }

  let recipients = splitAmong;
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    recipients = group.members.map((m) => m.toString());
  } else {
    recipients = [...new Set(recipients.map((id) => id.toString()))];
  }

  const groupMemberStrings = group.members.map((m) => m.toString());
  const allRecipientsValid = recipients.every((recipientId) =>
    groupMemberStrings.includes(recipientId)
  );

  if (!allRecipientsValid) {
    return next(
      new AppError('All members in splitAmong must belong to the group', 400)
    );
  }

  const expense = await Expense.create({
    description,
    amount: parsedAmount,
    group: group._id,
    paidBy: payerId,
    splitAmong: recipients,
    category: category || 'other',
    date: date || new Date()
  });

  await expense.populate('paidBy splitAmong', 'name email');

  res.status(201).json({
    success: true,
    data: expense
  });
});

export const getGroupExpenses = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  const isMember = group.members.some(
    (memberId) => memberId.toString() === req.user._id.toString()
  );

  if (!isMember) {
    return next(new AppError('You do not have access to this group', 403));
  }

  const expenses = await Expense.find({ group: req.params.id })
    .populate('paidBy splitAmong', 'name email')
    .sort({ date: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: expenses.length,
    data: expenses
  });
});

export const deleteExpense = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return next(new AppError('Expense not found', 404));
  }

  const group = await Group.findById(expense.group);

  const isPayer = expense.paidBy.toString() === req.user._id.toString();
  const isOwner = group && group.owner.toString() === req.user._id.toString();

  if (!isPayer && !isOwner) {
    return next(
      new AppError(
        'Not authorized to delete this expense. Only the payer or group owner can delete it',
        403
      )
    );
  }

  await expense.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Expense deleted successfully'
  });
});

export const getGroupBalances = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id).populate(
    'members',
    'name email'
  );

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  const isMember = group.members.some(
    (member) => member._id.toString() === req.user._id.toString()
  );

  if (!isMember) {
    return next(new AppError('You do not have access to this group', 403));
  }

  const expenses = await Expense.find({ group: req.params.id });

  const balancesMap = {};

  group.members.forEach((member) => {
    balancesMap[member._id.toString()] = {
      user: {
        _id: member._id,
        name: member.name,
        email: member.email
      },
      paid: 0,
      owed: 0,
      net: 0
    };
  });

  let totalExpenses = 0;

  for (const expense of expenses) {
    totalExpenses += expense.amount;
    const payerId = expense.paidBy.toString();

    if (balancesMap[payerId]) {
      balancesMap[payerId].paid += expense.amount;
    }

    if (expense.splitAmong && expense.splitAmong.length > 0) {
      const splitShare = expense.amount / expense.splitAmong.length;
      for (const recipientId of expense.splitAmong) {
        const idStr = recipientId.toString();
        if (balancesMap[idStr]) {
          balancesMap[idStr].owed += splitShare;
        }
      }
    }
  }

  const balances = Object.values(balancesMap).map((item) => {
    const paid = Math.round(item.paid * 100) / 100;
    const owed = Math.round(item.owed * 100) / 100;
    const net = Math.round((paid - owed) * 100) / 100;

    return {
      user: item.user,
      paid,
      owed,
      net
    };
  });

  const creditors = balances
    .filter((item) => item.net > 0)
    .map((item) => ({ ...item, remaining: item.net }))
    .sort((a, b) => b.remaining - a.remaining);

  const debtors = balances
    .filter((item) => item.net < 0)
    .map((item) => ({ ...item, remaining: Math.abs(item.net) }))
    .sort((a, b) => b.remaining - a.remaining);

  const settlements = [];
  let cIndex = 0;
  let dIndex = 0;

  while (cIndex < creditors.length && dIndex < debtors.length) {
    const creditor = creditors[cIndex];
    const debtor = debtors[dIndex];

    const settleAmount = Math.min(creditor.remaining, debtor.remaining);
    const roundedAmount = Math.round(settleAmount * 100) / 100;

    if (roundedAmount > 0) {
      settlements.push({
        from: debtor.user,
        to: creditor.user,
        amount: roundedAmount
      });
    }

    creditor.remaining =
      Math.round((creditor.remaining - settleAmount) * 100) / 100;
    debtor.remaining =
      Math.round((debtor.remaining - settleAmount) * 100) / 100;

    if (creditor.remaining <= 0.009) {
      cIndex += 1;
    }
    if (debtor.remaining <= 0.009) {
      dIndex += 1;
    }
  }

  res.status(200).json({
    success: true,
    data: {
      groupId: group._id,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      balances,
      settlements
    }
  });
});
