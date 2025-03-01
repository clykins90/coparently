const express = require('express');
const router = express.Router();
const { User, ChildParentLink, Conversation, ConversationMember } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateUser } = require('../middleware/auth');

// Get all child users linked to the authenticated parent
router.get('/', authenticateUser, async (req, res) => {
  try {
    const parentId = req.user.id;
    
    // Check if the user is a parent
    const parent = await User.findByPk(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only parent users can access this endpoint' 
      });
    }
    
    // Find all child links for this parent
    const childLinks = await ChildParentLink.findAll({
      where: { parent_user_id: parentId },
      include: [{
        model: User,
        as: 'childUser',
        attributes: ['id', 'username', 'first_name', 'last_name', 'email', 'google_profile_picture']
      }]
    });
    
    const children = childLinks.map(link => ({
      id: link.childUser.id,
      username: link.childUser.username,
      firstName: link.childUser.first_name,
      lastName: link.childUser.last_name,
      email: link.childUser.email,
      profilePicture: link.childUser.google_profile_picture,
      relationship: link.relationship,
      canViewMessages: link.can_view_messages
    }));
    
    res.json({ success: true, children });
  } catch (err) {
    console.error('Error fetching child users:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create a new child user
router.post('/', authenticateUser, async (req, res) => {
  try {
    const parentId = req.user.id;
    const { firstName, lastName, email, password, relationship } = req.body;
    
    // Check if the user is a parent
    const parent = await User.findByPk(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only parent users can create child accounts' 
      });
    }
    
    // Check if email is already in use
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already in use' 
      });
    }
    
    // Create the child user
    const hashedPassword = await bcrypt.hash(password, 10);
    const childUser = await User.create({
      username: email,
      email,
      first_name: firstName,
      last_name: lastName,
      hashed_password: hashedPassword,
      auth_provider: 'local',
      role: 'child'
    });
    
    // Create the child-parent link
    const link = await ChildParentLink.create({
      child_user_id: childUser.id,
      parent_user_id: parentId,
      relationship,
      can_view_messages: true
    });
    
    // Create a conversation between the parent and child
    const conversation = await Conversation.create({
      conversation_type: 'parent_child',
      created_by_id: parentId
    });
    
    // Add both users to the conversation
    await ConversationMember.create({
      user_id: parentId,
      conversation_id: conversation.id
    });
    
    await ConversationMember.create({
      user_id: childUser.id,
      conversation_id: conversation.id
    });
    
    res.status(201).json({ 
      success: true, 
      childUser: {
        id: childUser.id,
        username: childUser.username,
        firstName: childUser.first_name,
        lastName: childUser.last_name,
        email: childUser.email
      },
      conversationId: conversation.id
    });
  } catch (err) {
    console.error('Error creating child user:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update a child-parent link
router.put('/:childId', authenticateUser, async (req, res) => {
  try {
    const parentId = req.user.id;
    const childId = req.params.childId;
    const { relationship, canViewMessages } = req.body;
    
    // Check if the user is a parent
    const parent = await User.findByPk(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only parent users can update child links' 
      });
    }
    
    // Find the link
    const link = await ChildParentLink.findOne({
      where: {
        parent_user_id: parentId,
        child_user_id: childId
      }
    });
    
    if (!link) {
      return res.status(404).json({ 
        success: false, 
        message: 'Child link not found' 
      });
    }
    
    // Update the link
    if (relationship !== undefined) {
      link.relationship = relationship;
    }
    
    if (canViewMessages !== undefined) {
      link.can_view_messages = canViewMessages;
    }
    
    await link.save();
    
    res.json({ 
      success: true, 
      message: 'Child link updated successfully',
      link: {
        childId: link.child_user_id,
        parentId: link.parent_user_id,
        relationship: link.relationship,
        canViewMessages: link.can_view_messages
      }
    });
  } catch (err) {
    console.error('Error updating child link:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Delete a child user (only the link, not the actual user)
router.delete('/:childId', authenticateUser, async (req, res) => {
  try {
    const parentId = req.user.id;
    const childId = req.params.childId;
    
    // Check if the user is a parent
    const parent = await User.findByPk(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only parent users can remove child links' 
      });
    }
    
    // Find the link
    const link = await ChildParentLink.findOne({
      where: {
        parent_user_id: parentId,
        child_user_id: childId
      }
    });
    
    if (!link) {
      return res.status(404).json({ 
        success: false, 
        message: 'Child link not found' 
      });
    }
    
    // Delete the link
    await link.destroy();
    
    res.json({ 
      success: true, 
      message: 'Child link removed successfully' 
    });
  } catch (err) {
    console.error('Error removing child link:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router; 