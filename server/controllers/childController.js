const { Child, User } = require('../models');

// Get all children for a user
exports.getChildren = async (req, res) => {
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
};

// Create a new child
exports.createChild = async (req, res) => {
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
};

// Update a child
exports.updateChild = async (req, res) => {
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
};

// Delete a child
exports.deleteChild = async (req, res) => {
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
};

// Get a single child by ID
exports.getChildById = async (req, res) => {
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
}; 