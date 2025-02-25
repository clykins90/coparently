const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Endpoint: Update user profile
router.put('/profile', async (req, res) => {
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

module.exports = router; 