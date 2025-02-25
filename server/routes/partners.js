const express = require('express');
const router = express.Router();
const { User, Conversation, PartnerRequest } = require('../models');
const { sendPartnerInvitation } = require('../utils/mailService');

// Endpoint: Get partner information
router.get('/partner', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing user ID" });
    }
    
    // Find linked_partner conversation for this user
    const conversation = await Conversation.findOne({
      where: { conversation_type: 'linked_partner' },
      include: [{
        model: User,
        through: { attributes: [] },
        where: { id: userId }
      }]
    });
    
    if (!conversation) {
      return res.status(404).json({ success: false, message: "No linked partner found" });
    }
    
    // Get all users in this conversation
    const users = await conversation.getUsers();
    
    // Find the partner (not the requesting user)
    const partner = users.find(user => user.id !== parseInt(userId));
    
    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found in conversation" });
    }
    
    res.json({
      success: true,
      partnerId: partner.id,
      firstName: partner.first_name,
      lastName: partner.last_name,
      email: partner.email,
      phone: partner.phone,
      conversationId: conversation.id
    });
  } catch (err) {
    console.error('Error fetching partner:', err);
    res.status(500).json({ success: false, message: "Failed to fetch partner information" });
  }
});

// Endpoint: Check if a partner exists by email
router.get('/check-partner', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ success: false, message: "Missing email" });
    }
    
    const user = await User.findOne({ where: { email } });
    
    res.json({
      success: true,
      exists: !!user
    });
  } catch (err) {
    console.error('Error checking partner:', err);
    res.status(500).json({ success: false, message: "Failed to check partner" });
  }
});

// Endpoint: Request to link with a partner
router.post('/request-partner', async (req, res) => {
  try {
    const { userId, partnerEmail } = req.body;
    
    if (!userId || !partnerEmail) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    
    // Get the requesting user's info
    const requester = await User.findByPk(userId);
    if (!requester) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Check if user already has a partner
    const existingPartnerConversation = await Conversation.findOne({
      where: { conversation_type: 'linked_partner' },
      include: [{
        model: User,
        through: { attributes: [] },
        where: { id: userId }
      }]
    });
    
    if (existingPartnerConversation) {
      return res.status(400).json({ success: false, message: "You already have a linked partner" });
    }
    
    // Check if user already has any outgoing requests (pending or invited)
    const existingOutgoingRequests = await PartnerRequest.findAll({
      where: {
        requester_id: userId,
        status: ['pending', 'invited']
      }
    });
    
    if (existingOutgoingRequests.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "You already have a pending partner request. Please cancel it before sending a new one." 
      });
    }
    
    // Check if partner already exists
    const partner = await User.findOne({ where: { email: partnerEmail } });
    
    if (!partner) {
      // Partner doesn't exist, send invitation email
      const requesterName = `${requester.first_name} ${requester.last_name}`;
      const emailResult = await sendPartnerInvitation(partnerEmail, requesterName);
      
      if (emailResult.success) {
        // Store the invitation in the database with a special status
        await PartnerRequest.create({
          requester_id: userId,
          recipient_email: partnerEmail,  // Store email since we don't have an ID
          status: 'invited'
        });
        
        console.log(`Partner invitation created: requester_id=${userId}, recipient_email=${partnerEmail}, status=invited`);
        
        return res.json({
          success: true,
          message: 'Invitation sent successfully',
          partnerExists: false
        });
      } else {
        throw new Error('Failed to send invitation email');
      }
    }
    
    // Check if user is trying to link with themselves
    if (Number(userId) === Number(partner.id)) {
      return res.status(400).json({ success: false, message: "Cannot link to yourself" });
    }
    
    // Check if users are already linked
    const existingConversation = await Conversation.findOne({
      where: { conversation_type: 'linked_partner' },
      include: [
        { model: User, where: { id: userId } },
        { model: User, where: { id: partner.id } }
      ]
    });
    
    if (existingConversation) {
      return res.status(400).json({ success: false, message: "Already linked with this partner" });
    }
    
    // Check if there's already a pending request
    const existingRequest = await PartnerRequest.findOne({
      where: {
        requester_id: userId,
        recipient_id: partner.id,
        status: 'pending'
      }
    });
    
    if (existingRequest) {
      return res.status(400).json({ success: false, message: "Request already sent to this partner" });
    }
    
    // Check if there's a request from the partner to this user
    const reverseRequest = await PartnerRequest.findOne({
      where: {
        requester_id: partner.id,
        recipient_id: userId,
        status: 'pending'
      }
    });
    
    if (reverseRequest) {
      // Auto-accept the reverse request
      reverseRequest.status = 'accepted';
      await reverseRequest.save();
      
      // Create a linked_partner conversation
      const conversation = await Conversation.create({ conversation_type: 'linked_partner' });
      await conversation.addUsers([userId, partner.id]);
      
      return res.json({
        success: true,
        message: 'Partner linked successfully!',
        partnerExists: true,
        autoAccepted: true,
        conversationId: conversation.id
      });
    }
    
    // Create a new partner request
    await PartnerRequest.create({
      requester_id: userId,
      recipient_id: partner.id,
      status: 'pending'
    });
    
    console.log(`Partner request created: requester_id=${userId}, recipient_id=${partner.id}, status=pending`);
    
    res.json({
      success: true,
      message: 'Partner request sent successfully',
      partnerExists: true,
      requestSent: true
    });
  } catch (err) {
    console.error('Partner request error:', err);
    res.status(500).json({ success: false, message: "Failed to send partner request" });
  }
});

// Endpoint: Get pending partner requests
router.get('/pending-requests', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing user ID" });
    }
    
    const pendingRequests = await PartnerRequest.findAll({
      where: {
        recipient_id: userId,
        status: 'pending'
      },
      include: [{
        model: User,
        as: 'requester',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }]
    });
    
    res.json({
      success: true,
      requests: pendingRequests
    });
  } catch (err) {
    console.error('Error fetching pending requests:', err);
    res.status(500).json({ success: false, message: "Failed to fetch pending requests" });
  }
});

// Endpoint: Respond to a partner request
router.post('/respond-request', async (req, res) => {
  try {
    const { requestId, userId, accept } = req.body;
    
    if (!requestId || !userId || accept === undefined) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    
    // Find the request
    const request = await PartnerRequest.findOne({
      where: {
        id: requestId,
        recipient_id: userId,
        status: 'pending'
      },
      include: [{
        model: User,
        as: 'requester'
      }]
    });
    
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    
    // Update request status
    request.status = accept ? 'accepted' : 'rejected';
    await request.save();
    
    if (accept) {
      // Create a linked_partner conversation
      const conversation = await Conversation.create({ conversation_type: 'linked_partner' });
      await conversation.addUsers([userId, request.requester_id]);
      
      return res.json({
        success: true,
        message: 'Partner request accepted',
        conversationId: conversation.id
      });
    } else {
      return res.json({
        success: true,
        message: 'Partner request rejected'
      });
    }
  } catch (err) {
    console.error('Error responding to request:', err);
    res.status(500).json({ success: false, message: "Failed to respond to request" });
  }
});

// Endpoint: Unlink a partner
router.delete('/partner/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing user ID" });
    }
    
    // Find linked_partner conversation for this user
    const conversation = await Conversation.findOne({
      where: { conversation_type: 'linked_partner' },
      include: [{
        model: User,
        through: { attributes: [] },
        where: { id: userId }
      }]
    });
    
    if (!conversation) {
      return res.status(404).json({ success: false, message: "No linked partner found" });
    }
    
    // Delete the conversation (this will also remove the association)
    await conversation.destroy();
    
    res.json({
      success: true,
      message: 'Partner unlinked successfully'
    });
  } catch (err) {
    console.error('Error unlinking partner:', err);
    res.status(500).json({ success: false, message: "Failed to unlink partner" });
  }
});

// Endpoint: Get outgoing partner requests
router.get('/outgoing-requests', async (req, res) => {
  try {
    const { userId } = req.query;
    
    console.log(`Fetching outgoing requests for userId: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing user ID" });
    }
    
    // Find pending requests to existing users
    const pendingRequests = await PartnerRequest.findAll({
      where: {
        requester_id: userId,
        status: 'pending'
      },
      include: [{
        model: User,
        as: 'recipient',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }]
    });
    
    // Find invited requests (to non-existing users)
    const invitedRequests = await PartnerRequest.findAll({
      where: {
        requester_id: userId,
        status: 'invited'
      },
      attributes: ['id', 'recipient_email', 'created_at', 'updated_at', 'status']
    });
    
    // Transform invited requests to match the format of pending requests
    const formattedInvitedRequests = invitedRequests.map(request => {
      return {
        id: request.id,
        requester_id: userId,
        recipient_id: null,
        status: 'invited',
        created_at: request.created_at,
        updated_at: request.updated_at,
        recipient: {
          id: null,
          first_name: null,
          last_name: null,
          email: request.recipient_email
        }
      };
    });
    
    // Combine both types of requests
    const allRequests = [...pendingRequests, ...formattedInvitedRequests];
    
    console.log(`Found ${allRequests.length} outgoing requests for userId: ${userId}`);
    if (allRequests.length > 0) {
      console.log('Request details:', JSON.stringify(allRequests, null, 2));
    }
    
    res.json({
      success: true,
      requests: allRequests
    });
  } catch (err) {
    console.error('Error fetching outgoing requests:', err);
    res.status(500).json({ success: false, message: "Failed to fetch outgoing requests" });
  }
});

// Endpoint: Cancel a partner request
router.delete('/cancel-request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { userId } = req.query;
    
    if (!requestId || !userId) {
      return res.status(400).json({ success: false, message: "Missing required parameters" });
    }
    
    // Find the request
    const request = await PartnerRequest.findOne({
      where: {
        id: requestId,
        requester_id: userId,
        status: ['pending', 'invited'] // Can only cancel pending or invited requests
      }
    });
    
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found or cannot be canceled" });
    }
    
    // Delete the request
    await request.destroy();
    
    res.json({
      success: true,
      message: 'Request canceled successfully'
    });
  } catch (err) {
    console.error('Error canceling request:', err);
    res.status(500).json({ success: false, message: "Failed to cancel request" });
  }
});

// Legacy endpoint for backward compatibility
router.post('/invite-partner', async (req, res) => {
  try {
    const { userId, partnerEmail } = req.body;
    
    // Redirect to the new request-partner endpoint
    const response = await router.handle(req, res, {
      path: '/request-partner',
      method: 'POST'
    });
    
    return response;
  } catch (err) {
    console.error('Partner invitation error:', err);
    res.status(500).json({ success: false, message: "Failed to send invitation" });
  }
});

module.exports = router; 