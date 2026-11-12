import { Types } from 'mongoose';
import Group, { IGroup } from '../models/Group.js';
import User from '../models/User.js';
import { AppError, asyncHandler } from '../middleware/error.js';
import { getAuthUser } from '../middleware/auth.js';
import {
  AddMemberBody,
  ApiResponse,
  CreateGroupBody,
  IdParams,
  PublicUser
} from '../types/api.js';

export type PopulatedGroup = Omit<IGroup, 'owner' | 'members'> & {
  _id: Types.ObjectId;
  owner: PublicUser;
  members: PublicUser[];
};

type GroupPopulate = { owner: PublicUser; members: PublicUser[] };

export const createGroup = asyncHandler<{}, ApiResponse<PopulatedGroup>, CreateGroupBody>(
  async (req, res, next) => {
    const user = getAuthUser(req);
    const { name, description } = req.body;

    if (!name) {
      return next(new AppError('Group name is required', 400));
    }

    const group = await Group.create({
      name,
      description: description || '',
      owner: user._id,
      members: [user._id]
    });

    const populated = await group.populate<GroupPopulate>('owner members', 'name email');

    res.status(201).json({
      success: true,
      data: populated
    });
  }
);

export const getUserGroups = asyncHandler<{}, ApiResponse<PopulatedGroup[]>>(
  async (req, res) => {
    const user = getAuthUser(req);
    const groups = await Group.find({ members: user._id })
      .populate<GroupPopulate>('owner members', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups
    });
  }
);

export const getGroupById = asyncHandler<IdParams, ApiResponse<PopulatedGroup>>(
  async (req, res, next) => {
    const user = getAuthUser(req);
    const group = await Group.findById(req.params.id).populate<GroupPopulate>(
      'owner members',
      'name email'
    );

    if (!group) {
      return next(new AppError('Group not found', 404));
    }

    const isMember = group.members.some(
      (member) => member._id.toString() === user._id.toString()
    );

    if (!isMember) {
      return next(new AppError('You do not have access to this group', 403));
    }

    res.status(200).json({
      success: true,
      data: group
    });
  }
);

export const addMember = asyncHandler<IdParams, ApiResponse<PopulatedGroup>, AddMemberBody>(
  async (req, res, next) => {
    const user = getAuthUser(req);
    const group = await Group.findById(req.params.id);

    if (!group) {
      return next(new AppError('Group not found', 404));
    }

    const isMember = group.members.some(
      (memberId) => memberId.toString() === user._id.toString()
    );

    if (!isMember) {
      return next(new AppError('Only group members can add new members', 403));
    }

    const { userId, email } = req.body;

    if (!userId && !email) {
      return next(new AppError('Please provide a userId or email to add', 400));
    }

    const userToAdd = email
      ? await User.findOne({ email: email.toLowerCase().trim() })
      : await User.findById(userId);

    if (!userToAdd) {
      return next(new AppError('User not found', 404));
    }

    const alreadyMember = group.members.some(
      (memberId) => memberId.toString() === userToAdd._id.toString()
    );

    if (alreadyMember) {
      return next(new AppError('User is already a member of this group', 400));
    }

    group.members.push(userToAdd._id);
    await group.save();

    const populated = await group.populate<GroupPopulate>('owner members', 'name email');

    res.status(200).json({
      success: true,
      data: populated
    });
  }
);
