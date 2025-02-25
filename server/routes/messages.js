const express = require('express');
const router = express.Router();
const { Message, User, Conversation } = require('../models');
const { filterMessage } = require('../utils/messageFilter');

// Endpoint: Post a new message in a conversation
router.post('/conversations/:id/messages', async (req, res) => {
  console.log("New message request:", req.body);
  try {
    const conversationId = req.params.id;
    const { senderId, content } = req.body;
    
    // Get recent conversation context (last 5 messages)
    let conversationContext = null;
    try {
      const recentMessages = await Message.findAll({
        where: { conversation_id: conversationId },
        order: [['createdAt', 'DESC']],
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
    
    // Filter/Rewrite the message if necessary
    const filteredContent = await filterMessage(content, conversationContext);
    if (filteredContent.status === 'blocked') {
      console.log("Message blocked:", content);
      return res.status(400).json({ error: filteredContent.message });
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
        sender: { id: senderId }
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
      order: [['createdAt', 'ASC']],
      include: [{ model: User, as: 'sender', attributes: ['username', 'email'] }]
    });
    console.log(`Returning ${messages.length} messages for conversation ${conversationId}`);
    res.json({ messages });
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