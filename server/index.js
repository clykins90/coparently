console.log("████████████████████████████████████████");
console.log("█ Server starting... (v2.3)            █");
console.log("████████████████████████████████████████");

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { sendPartnerInvitation } = require('./utils/mailService');

// Import Sequelize instance and models from our models folder
const {
  sequelize,
  User,
  Conversation,
  ConversationMember,
  Message
} = require('./models');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

// Initialize OpenAI with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function to filter and possibly rewrite messages
async function filterMessage(message) {
  console.log("Filtering message:", message);
  try {
    // Moderation check (for logging purposes)
    const moderation = await openai.moderations.create({ input: message });
    console.log("Moderation insight:", moderation);

    // Rewrite message if needed
    console.log("Rewriting message...");
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a communication mediator between a divorced couple.
Evaluate messages for harmful, abusive, or manipulative content.
If harmful, rewrite the message; otherwise, leave it unchanged.
Do not include the words "rewritten" or "rewrite" in the response.
If a message is too harmful, respond exactly with:
"[BLOCKED] This message cannot be sent. Please rewrite and try again."`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const rewritten = completion.choices[0].message.content;
    console.log("Original:", message);
    console.log("Rewritten:", rewritten);

    if (rewritten.startsWith('[BLOCKED]')) {
      return { status: 'blocked', message: rewritten };
    }
    return rewritten;
  } catch (err) {
    console.error('AI Filter Error:', err);
    return "[Message filtered due to error]";
  }
}

// -----------------------
// API Endpoints
// -----------------------

// Endpoint: Login
app.post('/api/login', async (req, res) => {
  console.log("Login attempt:", req.body);
  try {
    const { email, password } = req.body;
    // Demo: For now, we're using plain text password check.
    // In production, make sure to hash and compare properly.
    const user = await User.findOne({ where: { email, hashed_password: password } });
    if (user) {
      // Check for linked partner conversation (if exists)
      const partnerConversation = await Conversation.findOne({
        where: { conversation_type: 'linked_partner' },
        include: [{
          model: User,
          through: { attributes: [] },
          where: { id: user.id }
        }]
      });
      const hasPartner = !!partnerConversation;
      const isProfileComplete = 
        user.first_name && 
        user.last_name && 
        user.email;
      res.json({ 
        success: true, 
        userId: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        hasPartner: hasPartner,
        requiresProfile: !isProfileComplete
      });
    } else {
      console.warn("Invalid credentials for email:", email);
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    console.error('Error in /api/login:', err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Endpoint: Register (create a new user)
app.post('/api/register', async (req, res) => {
  console.log("Register request received:", req.body);
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.warn("Attempted registration with existing email:", email);
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    const newUser = await User.create({
      username: email, // or another logic to generate a username
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      hashed_password: password
    });
    console.log("New user registered:", newUser.toJSON());
    res.json({ success: true, user: newUser });
  } catch (err) {
    console.error("Error in /api/register:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Endpoint: Partner Linking
app.post('/api/link-partner', async (req, res) => {
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

// Endpoint: Post a new message in a conversation
app.post('/api/conversations/:id/messages', async (req, res) => {
  console.log("New message request:", req.body);
  try {
    const conversationId = req.params.id;
    const { senderId, content } = req.body;
    // Filter/Rewrite the message if necessary
    const filteredContent = await filterMessage(content);
    if (filteredContent.status === 'blocked') {
      console.log("Message blocked:", content);
      return res.status(400).json({ error: filteredContent.message });
    }
    const message = await Message.create({
      conversation_id: conversationId,
      sender_id: senderId,
      content: filteredContent
    });
    console.log("Message stored:", message.toJSON());
    res.json({ success: true, message });
  } catch (err) {
    console.error('Error posting message:', err);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

// Endpoint: Get messages for a conversation
app.get('/api/conversations/:id/messages', async (req, res) => {
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

// Endpoint: Update user profile
app.put('/api/profile', async (req, res) => {
  console.log("Profile update request received:", req.body);
  try {
    const { userId, firstName, lastName, phone } = req.body;
    const user = await User.findByPk(userId);
    if (!user) {
      console.error("Profile update failed. User not found:", userId);
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (firstName) user.first_name = firstName;
    if (lastName) user.last_name = lastName;
    if (phone) user.phone = phone;
    await user.save();
    console.log("User profile updated:", user.toJSON());
    res.json({ success: true, user });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Endpoint: Logout (simulated)
app.post('/api/logout', (req, res) => {
  console.log("Logout request received.");
  res.json({ success: true });
});

// Test endpoint for filtering messages
app.post('/api/test-filter', async (req, res) => {
  try {
    const { message } = req.body;
    console.log('TEST MESSAGE:', message);
    const filtered = await filterMessage(message);
    res.json({ original: message, filtered });
  } catch (err) {
    console.error('Test filter error:', err);
    res.status(500).json({ error: 'Filter test failed' });
  }
});

// Endpoint: Invite a partner
app.post('/api/invite-partner', async (req, res) => {
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

// Sync Sequelize models (force drop and recreate tables) and start the server
sequelize.sync({ force: true }).then(() => {
  console.log('Database tables recreated!');
  app.listen(port, () => {
    console.log(`\n=== SERVER STARTED ===`);
    console.log(`| Port: ${port}`);
    console.log(`==========================\n`);
  });
}).catch(err => {
  console.error("💥 CRITICAL DATABASE ERROR 💥", err);
  process.exit(1);
});