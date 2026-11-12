import mongoose, { Types } from 'mongoose';

export enum ExpenseCategory {
  Groceries = 'groceries',
  Rent = 'rent',
  Utilities = 'utilities',
  Entertainment = 'entertainment',
  Other = 'other'
}

export interface IExpense {
  description: string;
  amount: number;
  group: Types.ObjectId;
  paidBy: Types.ObjectId;
  splitAmong: Types.ObjectId[];
  category: ExpenseCategory;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new mongoose.Schema<IExpense>(
  {
    description: {
      type: String,
      required: [true, 'Please provide an expense description'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an expense amount'],
      min: [0.01, 'Amount must be at least 0.01']
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Expense must belong to a group']
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Expense must specify who paid']
    },
    splitAmong: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    category: {
      type: String,
      enum: {
        values: Object.values(ExpenseCategory),
        message: '{VALUE} is not a valid category'
      },
      default: ExpenseCategory.Other
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Expense = mongoose.model<IExpense>('Expense', expenseSchema);

export default Expense;
