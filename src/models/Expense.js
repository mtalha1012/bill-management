import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
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
        values: ['groceries', 'rent', 'utilities', 'entertainment', 'other'],
        message: '{VALUE} is not a valid category'
      },
      default: 'other'
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

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
