// controllers/groupStudyController.js

const GroupStudy = require('../models/GroupStudy');
const User = require('../models/usersmodel');
const fs = require('fs');
const path = require('path');

// Create a new group study
exports.createGroup = async (req, res) => {
  try {
    const { group_name, description} = req.body;
    const userId=req.user._id;
    let picturePath = null;
        if (req.files && req.files.group_image) {
          const { group_image } = req.files;
          picturePath = `group_image-${Date.now()}-${group_image.name}`;
          const uploadPath = path.join(__dirname, `../public/${picturePath}`);
          console.log(group_image)
          // Create directory if it doesn't exist
          const directoryPath = path.join(__dirname, '../public/');
          if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
          }
    
          await group_image.mv(uploadPath);
        }
    
    const newGroup = new GroupStudy({
      group_name,
      description,
      created_by:userId,
      members: [userId], 
      group_image:picturePath
    });
    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a member to the group
exports.addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId=req.user._id;
    const group = await GroupStudy.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if member already exists
    if (group.members.includes(userId)) {
      return res.status(400).json({ error: 'Member already in the group' });
    }

    group.members.push(userId);
    await group.save();
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send a chat message
exports.sendChat = async (req, res) => {
  try {
    const { groupId } = req.params;
    const {  message } = req.body;
    const userId=req.user._id;

    const group = await GroupStudy.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Add the chat message
    group.chats.push({ sender:userId, message });
    await group.save();
    const updatedGroup = await GroupStudy.findById(groupId).populate('members', 'name  profile_picture')
    .populate('created_by', 'name  profile_picture')
      .populate({
        path: 'chats.sender',
        select: 'name profile_picture',
      });
    res.status(201).json(updatedGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get group details along with chats and members
exports.getGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await GroupStudy.findById(groupId).populate('created_by', 'name  profile_picture')
      .populate('members', 'name  profile_picture');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all groups a user has joined by their userId
exports.getGroupsByUserId = async (req, res) => {
  try {
    const userId  = req.user._id;
    
   
    const groups = await GroupStudy.find({ members: userId })
      .populate('created_by', 'name  profile_picture')
      .populate('members', 'name  profile_picture');

    if (groups.length === 0) {
      return res.status(404).json({ error: 'No groups found for this user' });
    }

    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all groups
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await GroupStudy.find()
      .populate('created_by', 'name profile_picture')
      .populate('members', 'name profile_picture');

    if (groups.length === 0) {
      return res.status(404).json({ error: 'No groups found' });
    }

    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};