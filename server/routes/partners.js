const express = require('express');
const router = express.Router();
const { User, Conversation } = require('../models');
const { sendPartnerInvitation } = require('../utils/mailService');

// Endpoint: Partner Linking
router.post('/link-partner', async (req, res) => {
  console.log("Link Partner Request Received:", req.body);
  try {
    const { userId, partnerEmail } = req.body;
    console.log(`Attempting to link user ${userId} with partner email ${partnerEmail}`);

    if (!userId || !partnerEmail) {
      console.error("Missing required fields:", { userId, partnerEmail });
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    
    const partner = await User.findOne({ where: { email: partnerEmail } });
    if (!partner) {
      console.error(`Partner not found for email: ${partnerEmail}`);
      return res.status(404).json({ success: false, message: "Partner not found" });
    }
    if (Number(userId) === Number(partner.id)) {
      console.error("User attempted to link to themselves:", { userId, partnerId: partner.id });
      return res.status(400).json({ success: false, message: "Cannot link to yourself" });
    }
    
    // Check if a linked_partner conversation exists for this user
    let conversation = await Conversation.findOne({
      where: { conversation_type: 'linked_partner' },
      include: [{
        model: User,
        through: { attributes: [] },
        where: { id: userId }
      }]
    });
    if (!conversation) {
      conversation = await Conversation.create({ conversation_type: 'linked_partner' });
      await conversation.addUsers([userId, partner.id]);
    } else {
      await conversation.addUsers([userId, partner.id]);
    }
    
    console.log("Partner linked successfully.");
    res.json({ 
      success: true, 
      message: `Partner ${partnerEmail} linked successfully.`,
      conversationId: conversation.id
    });
  } catch (err) {
    console.error('Partner linking error:', err);
    res.status(500).json({ success: false, message: "Linking failed. Please try again." });
  }
});

// Endpoint: Invite a partner
router.post('/invite-partner', async (req, res) => {
  try {
    const { userId, partnerEmail } = req.body;
    
    // Get the inviting user's info
    const invitingUser = await User.findByPk(userId);
    if (!invitingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if partner already exists
    const existingPartner = await User.findOne({ where: { email: partnerEmail } });
    
    if (existingPartner) {
      // Partner exists, create conversation link
      const conversation = await Conversation.create({ conversation_type: 'linked_partner' });
      await conversation.addUsers([userId, existingPartner.id]);
      
      res.json({ 
        success: true, 
        message: 'Partner linked successfully!',
        partnerExists: true
      });
    } else {
      // Send invitation email to partner
      const invitingUserName = `${invitingUser.first_name} ${invitingUser.last_name}`;
      const emailResult = await sendPartnerInvitation(partnerEmail, invitingUserName);
      
      if (emailResult.success) {
        res.json({
          success: true,
          message: 'Invitation sent successfully',
          partnerExists: false
        });
      } else {
        throw new Error('Failed to send invitation email');
      }
    }
  } catch (err) {
    console.error('Partner invitation error:', err);
    res.status(500).json({ success: false, message: "Failed to send invitation" });
  }
});

module.exports = router; 