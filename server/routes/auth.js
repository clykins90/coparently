const express = require('express');
const router = express.Router();
const { User, Conversation } = require('../models');
const bcrypt = require('bcrypt');

// Endpoint: Login
router.post('/login', async (req, res) => {
  console.log("Login attempt:", req.body);
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    // Check if user exists and password matches
    if (user && await bcrypt.compare(password, user.hashed_password)) {
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
router.post('/register', async (req, res) => {
  console.log("Register request received:", req.body);
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.warn("Attempted registration with existing email:", email);
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await User.create({
      username: email, // or another logic to generate a username
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      hashed_password: hashedPassword
    });
    console.log("New user registered:", newUser.toJSON());
    res.json({ success: true, user: newUser });
  } catch (err) {
    console.error("Error in /api/register:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Endpoint: Logout (simulated)
router.post('/logout', (req, res) => {
  console.log("Logout request received.");
  res.json({ success: true });
});

module.exports = router; 