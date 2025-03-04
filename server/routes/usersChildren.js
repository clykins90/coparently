// server/routes/usersChildren.js
const express = require('express');
const router = express.Router();
const { User, ChildParentLink, Conversation, ConversationMember } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateUser } = require('../middleware/auth');
const { sendChildUserInvitation } = require('../utils/mailService');
const crypto = require('crypto');
const { Op } = require('sequelize');

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
      relationship: relationship || 'mother',
      can_view_messages: true,
      status: 'active'
    });
    
    console.log(`Created parent-child link: parent=${parentId}, child=${childUser.id}, relationship=${relationship || 'mother'}`);
    
    // Create a parent_child conversation
    const conversation = await Conversation.create({
      conversation_type: 'linked_child'
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
    const { deleteUser } = req.query; // Add query parameter to control user deletion
    
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
    
    // Delete the link
    await link.destroy();
    
    // If deleteUser is true, check if this is the only parent linked to this child
    if (deleteUser === 'true') {
      // Check if there are other parents linked to this child
      const otherLinks = await ChildParentLink.findAll({
        where: { child_user_id: childId }
      });
      
      // If no other parents are linked, delete the user account
      if (otherLinks.length === 0) {
        const childUser = await User.findByPk(childId);
        if (childUser) {
          await childUser.destroy();
          console.log(`Deleted child user account: ${childId}`);
          return res.json({ success: true, message: 'Child link and user account removed successfully' });
        }
      }
    }
    
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
      relationship: relationship || 'mother',
      can_view_messages: true,
      status: 'active'
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
        relationship: relationship || 'mother'
      }
    });
  } catch (err) {
    console.error('Error inviting child user:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/users/children/linked-parents
// Get all parents linked to the authenticated child user
router.get('/linked-parents', authenticateUser, async (req, res) => {
  try {
    const childId = req.user.id;
    
    // Must be a child user
    const child = await User.findByPk(childId);
    if (!child || child.role !== 'child') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only child users can access this endpoint' 
      });
    }
    
    // Find all parent links
    const parentLinks = await ChildParentLink.findAll({
      where: { child_user_id: childId, status: 'active' },
      include: [{
        model: User,
        as: 'parentUser',
        attributes: ['id', 'username', 'first_name', 'last_name', 'email', 'google_profile_picture']
      }]
    });
    
    const parents = parentLinks.map(link => ({
      id: link.parentUser.id,
      username: link.parentUser.username,
      firstName: link.parentUser.first_name,
      lastName: link.parentUser.last_name,
      email: link.parentUser.email,
      profilePicture: link.parentUser.google_profile_picture,
      relationship: link.relationship
    }));
    
    res.json({ success: true, parents });
  } catch (err) {
    console.error('Error fetching linked parents:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/users/children/:childId/linked-parents
// Get all parents linked to a specific child user (for parent users)
router.get('/:childId/linked-parents', authenticateUser, async (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId } = req.params;
    
    console.log(`[DEBUG] Fetching linked parents for child ${childId}, requested by parent ${parentId}`);
    
    // Must be a parent user
    const parent = await User.findByPk(parentId);
    if (!parent || parent.role !== 'parent') {
      console.log(`[DEBUG] User ${parentId} is not a parent user`);
      return res.status(403).json({ 
        success: false, 
        message: 'Only parent users can access this endpoint' 
      });
    }
    
    // Verify the parent has access to this child
    const hasAccess = await ChildParentLink.findOne({
      where: { parent_user_id: parentId, child_user_id: childId }
    });
    
    if (!hasAccess) {
      console.log(`[DEBUG] Parent ${parentId} does not have access to child ${childId}`);
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this child'
      });
    }
    
    // Find all parent links for this child
    const parentLinks = await ChildParentLink.findAll({
      where: { child_user_id: childId, status: 'active' },
      include: [{
        model: User,
        as: 'parentUser',
        attributes: ['id', 'username', 'first_name', 'last_name', 'email', 'google_profile_picture']
      }]
    });
    
    console.log(`[DEBUG] Found ${parentLinks.length} linked parents for child ${childId}`);
    
    const parents = parentLinks.map(link => ({
      id: link.parentUser.id,
      username: link.parentUser.username,
      firstName: link.parentUser.first_name,
      lastName: link.parentUser.last_name,
      email: link.parentUser.email,
      profilePicture: link.parentUser.google_profile_picture,
      relationship: link.relationship
    }));
    
    console.log(`[DEBUG] Returning ${parents.length} parents for child ${childId}`);
    
    res.json({ success: true, parents });
  } catch (err) {
    console.error('Error fetching linked parents for child:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/users/children/linked-siblings
// Get all siblings linked to the same parents as the authenticated child user
router.get('/linked-siblings', authenticateUser, async (req, res) => {
  try {
    const childId = req.user.id;
    
    // Must be a child user
    const child = await User.findByPk(childId);
    if (!child || child.role !== 'child') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only child users can access this endpoint' 
      });
    }
    
    // Find all parent links for this child
    const parentLinks = await ChildParentLink.findAll({
      where: { child_user_id: childId, status: 'active' },
      attributes: ['parent_user_id']
    });
    
    // Get parent IDs
    const parentIds = parentLinks.map(link => link.parent_user_id);
    
    if (parentIds.length === 0) {
      return res.json({ success: true, siblings: [] });
    }
    
    // Find all children linked to these parents (excluding the current child)
    const siblingLinks = await ChildParentLink.findAll({
      where: { 
        parent_user_id: parentIds, 
        child_user_id: { [Op.ne]: childId },
        status: 'active'
      },
      include: [{
        model: User,
        as: 'childUser',
        attributes: ['id', 'username', 'first_name', 'last_name', 'email', 'google_profile_picture', 'date_of_birth']
      }]
    });
    
    // Create a unique list of siblings (a child might be linked to multiple parents)
    const siblingMap = {};
    siblingLinks.forEach(link => {
      const sibling = link.childUser;
      if (!siblingMap[sibling.id]) {
        siblingMap[sibling.id] = {
          id: sibling.id,
          username: sibling.username,
          firstName: sibling.first_name,
          lastName: sibling.last_name,
          email: sibling.email,
          profilePicture: sibling.google_profile_picture,
          dateOfBirth: sibling.date_of_birth
        };
      }
    });
    
    const siblings = Object.values(siblingMap);
    
    res.json({ success: true, siblings });
  } catch (err) {
    console.error('Error fetching linked siblings:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/users/children/:childId/link-to-parent
// Link a child to another parent (typically the partner)
router.post('/:childId/link-to-parent', authenticateUser, async (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId } = req.params;
    const { partnerEmail, relationship } = req.body;
    
    // Must be a parent user
    const parent = await User.findByPk(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only parent users can link children to other parents' 
      });
    }
    
    // Verify the parent has access to this child
    const hasAccess = await ChildParentLink.findOne({
      where: { parent_user_id: parentId, child_user_id: childId, status: 'active' }
    });
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this child'
      });
    }
    
    // Find the partner by email
    const partner = await User.findOne({ 
      where: { 
        email: partnerEmail,
        role: 'parent'
      } 
    });
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'No parent user found with that email'
      });
    }
    
    // Check if the child is already linked to this parent
    const existingLink = await ChildParentLink.findOne({
      where: { 
        child_user_id: childId,
        parent_user_id: partner.id
      }
    });
    
    if (existingLink) {
      return res.status(400).json({
        success: false,
        message: 'Child is already linked to this parent'
      });
    }
    
    // Create the link
    await ChildParentLink.create({
      child_user_id: childId,
      parent_user_id: partner.id,
      relationship: relationship || 'father',
      can_view_messages: true,
      status: 'active'
    });
    
    // Get the child user
    const child = await User.findByPk(childId);
    
    // Create a parent_child conversation if it doesn't exist
    const existingConversation = await Conversation.findOne({
      where: { conversation_type: 'linked_child' },
      include: [
        { model: User, where: { id: partner.id } },
        { model: User, where: { id: childId } }
      ]
    });
    
    if (!existingConversation) {
      const conversation = await Conversation.create({
        conversation_type: 'linked_child'
      });
      await ConversationMember.create({ user_id: partner.id, conversation_id: conversation.id });
      await ConversationMember.create({ user_id: childId, conversation_id: conversation.id });
    }
    
    res.status(201).json({ 
      success: true, 
      message: `Child ${child.first_name} ${child.last_name} has been linked to ${partner.first_name} ${partner.last_name}`,
      childId: childId,
      partnerId: partner.id,
      partnerName: `${partner.first_name} ${partner.last_name}`,
      relationship: relationship || 'father'
    });
  } catch (err) {
    console.error('Error linking child to parent:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;