// server/routes/usersChildren.js
const express = require('express');
const router = express.Router();
const { User, ChildParentLink, Conversation, ConversationMember } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateUser } = require('../middleware/auth');
const { sendChildUserInvitation } = require('../utils/mailService');
const crypto = require('crypto');

// GET /api/users/children/
// Fetch child user accounts for the authenticated parent
router.get('/', authenticateUser, async (req, res) => {
  try {
    const parentId = req.user.id;
    
    // Must be a parent user
    const parent = await User.findByPk(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only parent users can access this endpoint' 
      });
    }
    
    // Find all child links
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

// POST /api/users/children/
// Create a brand-new child user (direct creation)
router.post('/', authenticateUser, async (req, res) => {
  try {
    const parentId = req.user.id;
    const { firstName, lastName, email, password, relationship } = req.body;
    
    // Must be a parent user
    const parent = await User.findByPk(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only parent users can create child accounts' 
      });
    }
    
    // Check if email is already used
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already in use' 
      });
    }
    
    // Create child user
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
    
    // Link them to the parent
    const link = await ChildParentLink.create({
      child_user_id: childUser.id,
      parent_user_id: parentId,
      relationship: relationship || 'child',
      can_view_messages: true
    });
    
    // Create a parent_child conversation
    const conversation = await Conversation.create({
      conversation_type: 'parent_child',
      created_by_id: parentId
    });
    await ConversationMember.create({ user_id: parentId, conversation_id: conversation.id });
    await ConversationMember.create({ user_id: childUser.id, conversation_id: conversation.id });
    
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

// PUT /api/users/children/:childId
// Update the child-parent link (e.g., relationship, canViewMessages)
router.put('/:childId', authenticateUser, async (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId } = req.params;
    const { relationship, canViewMessages } = req.body;
    
    // Must be a parent user
    const parent = await User.findByPk(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parent users can update child links'
      });
    }
    
    const link = await ChildParentLink.findOne({
      where: { parent_user_id: parentId, child_user_id: childId }
    });
    if (!link) {
      return res.status(404).json({ success: false, message: 'Child link not found' });
    }
    
    if (relationship !== undefined) link.relationship = relationship;
    if (canViewMessages !== undefined) link.can_view_messages = canViewMessages;
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

// DELETE /api/users/children/:childId
// Remove the link from parent->child. Does NOT necessarily delete the child user entirely.
router.delete('/:childId', authenticateUser, async (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId } = req.params;
    
    // Must be parent
    const parent = await User.findByPk(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parent users can remove child links'
      });
    }
    
    const link = await ChildParentLink.findOne({
      where: { parent_user_id: parentId, child_user_id: childId }
    });
    if (!link) {
      return res.status(404).json({ success: false, message: 'Child link not found' });
    }
    
    await link.destroy();
    res.json({ success: true, message: 'Child link removed successfully' });
  } catch (err) {
    console.error('Error removing child link:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/users/children/invite
// Invite child user via email (creates a temp user record + sends email)
router.post('/invite', authenticateUser, async (req, res) => {
  try {
    const parentId = req.user.id;
    const { firstName, lastName, email, relationship } = req.body;
    
    // Must be parent
    const parent = await User.findByPk(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parent users can invite child accounts'
      });
    }
    
    // Check if email in use
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already in use' 
      });
    }
    
    // Generate a unique invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
    
    // Create a "temporary" child user with invitation fields
    const tempUser = await User.create({
      username: email,
      email,
      first_name: firstName,
      last_name: lastName,
      auth_provider: 'invitation',
      role: 'child',
      invitation_token: invitationToken,
      invitation_token_expiry: tokenExpiry,
      invitation_parent_id: parentId
    });
    
    // Mark link as pending
    await ChildParentLink.create({
      child_user_id: tempUser.id,
      parent_user_id: parentId,
      relationship: relationship || 'child',
      can_view_messages: true,
      status: 'pending'
    });
    
    // Send invitation email
    const parentName = `${parent.first_name} ${parent.last_name}`;
    const invitationResult = await sendChildUserInvitation(
      email, firstName, lastName, invitationToken, parentName
    );
    if (!invitationResult.success) {
      console.error('Failed to send invitation email:', invitationResult.error);
      // We won't delete the user from DB, but we can show an error
    }
    
    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      childUser: {
        id: tempUser.id,
        firstName: tempUser.first_name,
        lastName: tempUser.last_name,
        email: tempUser.email,
        relationship: relationship || 'child'
      }
    });
  } catch (err) {
    console.error('Error inviting child user:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;