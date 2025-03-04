const express = require('express');
const router = express.Router();
const { Child, User, ChildUser, ChildParentLink } = require('../models');
const { authenticateUser } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Get all children for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find the user with their children
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Child,
          through: { attributes: [] },
          attributes: ['id', 'first_name', 'last_name', 'date_of_birth', 'notes', 'color']
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.Children);
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new child
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, date_of_birth, notes, color } = req.body;
    
    // Validate required fields
    if (!first_name || !last_name) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }
    
    // Create the child
    const newChild = await Child.create({
      first_name,
      last_name,
      date_of_birth,
      notes,
      color
    });
    
    // Associate the child with the user
    await newChild.addUser(userId);
    
    // Fetch the complete child with associations
    const child = await Child.findByPk(newChild.id, {
      include: [
        {
          model: User,
          through: { attributes: [] },
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });
    
    res.status(201).json(child);
  } catch (error) {
    console.error('Error creating child:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single child by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Find the child
    const child = await Child.findByPk(id, {
      include: [
        {
          model: User,
          through: { attributes: [] },
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });
    
    // Check if child exists
    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }
    
    // Check if user is associated with the child
    const isParent = child.Users.some(user => user.id === userId);
    if (!isParent) {
      return res.status(403).json({ message: 'Not authorized to view this child' });
    }
    
    res.json(child);
  } catch (error) {
    console.error('Error fetching child:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a child
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { first_name, last_name, date_of_birth, notes, color } = req.body;
    
    // Find the child
    const child = await Child.findByPk(id, {
      include: [
        {
          model: User,
          through: { attributes: [] },
          attributes: ['id']
        }
      ]
    });
    
    // Check if child exists
    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }
    
    // Check if user is associated with the child
    const isParent = child.Users.some(user => user.id === userId);
    if (!isParent) {
      return res.status(403).json({ message: 'Not authorized to update this child' });
    }
    
    // Update the child
    await child.update({
      first_name,
      last_name,
      date_of_birth,
      notes,
      color
    });
    
    // Fetch the updated child with associations
    const updatedChild = await Child.findByPk(id, {
      include: [
        {
          model: User,
          through: { attributes: [] },
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });
    
    res.json(updatedChild);
  } catch (error) {
    console.error('Error updating child:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a child
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Find the child
    const child = await Child.findByPk(id, {
      include: [
        {
          model: User,
          through: { attributes: [] },
          attributes: ['id']
        }
      ]
    });
    
    // Check if child exists
    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }
    
    // Check if user is associated with the child
    const isParent = child.Users.some(user => user.id === userId);
    if (!isParent) {
      return res.status(403).json({ message: 'Not authorized to delete this child' });
    }
    
    // Delete the child
    await child.destroy();
    
    res.json({ message: 'Child deleted successfully' });
  } catch (error) {
    console.error('Error deleting child:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a child with option to delete user account
router.delete('/:id/with-user', async (req, res) => {
  try {
    const parentId = req.user.id;
    const { id } = req.params;
    const { deleteUserAccount } = req.query;
    
    // Find the child with its associated user account
    const child = await Child.findByPk(id, {
      include: [
        {
          model: User,
          through: { attributes: [] },
          attributes: ['id']
        },
        {
          model: User,
          as: 'userAccount',
          attributes: ['id', 'role']
        }
      ]
    });
    
    // Check if child exists
    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }
    
    // Check if user is associated with the child
    const isParent = child.Users.some(user => user.id === parentId);
    if (!isParent) {
      return res.status(403).json({ message: 'Not authorized to delete this child' });
    }
    
    // If deleteUserAccount is true and child has a user account, delete the user account
    if (deleteUserAccount === 'true' && child.userAccount) {
      const childUserId = child.userAccount.id;
      
      // Only proceed if the user account is a child role
      if (child.userAccount.role === 'child') {
        // Find the link between parent and child user
        const link = await ChildParentLink.findOne({
          where: { parent_user_id: parentId, child_user_id: childUserId }
        });
        
        if (link) {
          // Delete the link
          await link.destroy();
        }
        
        // Check if this is the only parent linked to this child user
        const otherLinks = await ChildParentLink.findAll({
          where: { child_user_id: childUserId }
        });
        
        // If no other parents are linked, we can delete the user account
        if (otherLinks.length === 0) {
          const childUser = await User.findByPk(childUserId);
          if (childUser) {
            await childUser.destroy();
          }
        }
      }
    }
    
    // Delete the child profile
    await child.destroy();
    
    res.json({ message: 'Child deleted successfully' });
  } catch (error) {
    console.error('Error deleting child with user account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 