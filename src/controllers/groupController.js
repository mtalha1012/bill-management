import Group from '../models/Group.js';
import User from '../models/User.js';
import { AppError, asyncHandler } from '../middleware/error.js';

export const createGroup = asyncHandler(async (req, res, next) => {
  const { name, description } = req.body;

  if (!name) {
    return next(new AppError('Group name is required', 400));
  }

  const group = await Group.create({
    name,
    description: description || '',
    owner: req.user._id,
    members: [req.user._id]
  });

  await group.populate('owner members', 'name email');

  res.status(201).json({
    success: true,
    data: group
  });
});

export const getUserGroups = asyncHandler(async (req, res, next) => {
  const groups = await Group.find({ members: req.user._id })
    .populate('owner members', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: groups.length,
    data: groups
  });
});

export const getGroupById = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id).populate(
    'owner members',
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

  res.status(200).json({
    success: true,
    data: group
  });
});

export const addMember = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  const isMember = group.members.some(
    (memberId) => memberId.toString() === req.user._id.toString()
  );

  if (!isMember) {
    return next(new AppError('Only group members can add new members', 403));
  }

  const { userId, email } = req.body;

  if (!userId && !email) {
    return next(new AppError('Please provide a userId or email to add', 400));
  }

  let userToAdd;
  if (email) {
    userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
  } else {
    userToAdd = await User.findById(userId);
  }

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

  await group.populate('owner members', 'name email');

  res.status(200).json({
    success: true,
    data: group
  });
});
