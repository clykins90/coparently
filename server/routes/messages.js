const express = require('express');
const router = express.Router();
const { Message, User, Conversation, ConversationMember } = require('../models');
const { filterMessage } = require('../utils/messageFilter');
const { authenticateUser } = require('../middleware/auth');

// New endpoint: Get all conversations for a user
router.get('/conversations', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id; // Get the authenticated user's ID
    
    // Find all conversations where the user is a member
    const conversations = await Conversation.findAll({
      include: [
        {
          model: User,
          through: { attributes: [] }, // Don't include join table attributes
          where: { id: userId }
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'first_name', 'last_name', 'email', 'role'],
          through: { attributes: [] } // Don't include join table attributes
        }
      ]
    });
    
    console.log(`Found ${conversations.length} conversations for user ${userId}`);
    res.json({ success: true, conversations });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ success: false, error: 'Failed to load conversations' });
  }
});

// Endpoint: Post a new message in a conversation
router.post('/conversations/:id/messages', async (req, res) => {
  console.log("New message request:", req.body);
  try {
    const conversationId = req.params.id;
    const { senderId, content, bypassAiFilter } = req.body;
    
    // Get recent conversation context (last 5 messages)
    let conversationContext = null;
    try {
      const recentMessages = await Message.findAll({
        where: { conversation_id: conversationId },
        order: [['created_at', 'DESC']],
        limit: 5,
        include: [{ model: User, as: 'sender', attributes: ['id', 'firstName'] }]
      });
      
      if (recentMessages.length > 0) {
        // Format messages for context
        conversationContext = recentMessages.reverse().map(msg => {
          const senderName = msg.sender ? msg.sender.firstName : 'User';
          return `${senderName}: ${msg.content}`;
        }).join('\n');
      }
    } catch (err) {
      console.warn('Error fetching conversation context:', err);
      // Continue without context if there's an error
    }
    
    // Filter/Rewrite the message if necessary, unless bypassed
    let filteredContent = content;
    if (!bypassAiFilter) {
      filteredContent = await filterMessage(content, conversationContext);
      if (filteredContent.status === 'blocked') {
        console.log("Message blocked:", content);
        return res.status(400).json({ error: filteredContent.message });
      }
    } else {
      console.log("AI filter bypassed for development");
    }
    
    const message = await Message.create({
      conversation_id: conversationId,
      sender_id: senderId,
      content: filteredContent
    });
    
    // Get the io instance
    const io = req.app.get('io');
    
    // Emit the new message to all clients in the conversation room
    if (io) {
      const messageWithSender = {
        ...message.toJSON(),
        sender: { id: senderId },
        // Explicitly include timestamp fields to ensure they're available to the client
        timestamp: message.created_at,
        createdAt: message.created_at
      };
      io.to(`conversation_${conversationId}`).emit('new_message', messageWithSender);
    }
    
    console.log("Message stored:", message.toJSON());
    res.json({ success: true, message });
  } catch (err) {
    console.error('Error posting message:', err);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

// Endpoint: Get messages for a conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const messages = await Message.findAll({
      where: { conversation_id: conversationId },
      order: [['created_at', 'ASC']],
      include: [{ model: User, as: 'sender', attributes: ['username', 'email'] }]
    });
    
    // Map messages to ensure timestamp fields are properly included
    const formattedMessages = messages.map(msg => {
      const msgData = msg.toJSON();
      return {
        ...msgData,
        // Explicitly include timestamp fields to ensure they're available to the client
        timestamp: msg.created_at,
        createdAt: msg.created_at
      };
    });
    
    console.log(`Returning ${messages.length} messages for conversation ${conversationId}`);
    res.json({ messages: formattedMessages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// Test endpoint for filtering messages
router.post('/test-filter', async (req, res) => {
  try {
    const { message, context } = req.body;
    console.log('TEST MESSAGE:', message);
    const filtered = await filterMessage(message, context);
    res.json({ 
      original: message, 
      filtered,
      wasModified: typeof filtered === 'string' && filtered !== message,
      wasBlocked: filtered.status === 'blocked'
    });
  } catch (err) {
    console.error('Test filter error:', err);
    res.status(500).json({ error: 'Filter test failed' });
  }
});

module.exports = router; 