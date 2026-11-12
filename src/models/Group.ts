import mongoose, { Types } from 'mongoose';

export interface IGroup {
  name: string;
  description: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new mongoose.Schema<IGroup>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a group name'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Group must have an owner']
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

const Group = mongoose.model<IGroup>('Group', groupSchema);

export default Group;
