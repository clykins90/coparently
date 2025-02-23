const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

// Dummy in-memory "database" of users
const users = [
  { 
    id: 1, 
    firstName: 'Dev',
    lastName: 'User',
    email: 'dev@example.com', 
    phone: '555-1234',
    password: 'deviscool123' 
  },
  { id: 2, email: 'user2@example.com', password: 'password2' },
  { id: 3, email: 'dev_partner@example.com', password: 'deviscool123' } // Test partner account
];

// Track linked partners (userId -> partnerId)
const linkedPartners = new Map();

// Track messages (senderId, receiverId, content)
const messages = [];

// Endpoint: Login
app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            // In a real app, you'd issue a token or create a session.
            res.json({ success: true, userId: user.id });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (err) {
        console.error('Error in /api/login:', err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Endpoint: Partner Linking
app.post('/api/link-partner', (req, res) => {
    const { userId, partnerEmail } = req.body;
    const partner = users.find(u => u.email === partnerEmail);
    
    if (!partner) {
        return res.status(404).json({ success: false, message: "Partner not found" });
    }
    
    linkedPartners.set(userId, partner.id);
    linkedPartners.set(partner.id, userId);
    
    res.json({ 
        success: true, 
        message: `Partner ${partnerEmail} linked successfully.`,
        partnerId: partner.id 
    });
});

// List of abusive words to filter (for the demo)
const abusiveWords = ["fuck", "shit", "damn", "bastard"];

// A simple filter that replaces abusive words with '***'
function filterMessage(message) {
    let filtered = message;
    abusiveWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        filtered = filtered.replace(regex, '***');
    });
    return filtered;
}

// Endpoint: Message filtering via simulated "LLM"
app.post('/api/filter', (req, res) => {
    const { message, senderId, receiverId } = req.body;
    const filteredMessage = filterMessage(message);
    messages.push({
        senderId,
        receiverId,
        content: filteredMessage,
        timestamp: new Date().toISOString()
    });
    res.json({ filteredMessage });
});

app.get('/api/messages', (req, res) => {
    const userId = parseInt(req.query.userId);
    const partnerId = linkedPartners.get(userId);
    const userMessages = messages.filter(m => 
        m.receiverId === userId || m.senderId === userId
    );
    res.json({ messages: userMessages });
});

// Endpoint: Logout (simulated)
app.post('/api/logout', (req, res) => {
  // In a real app, you'd invalidate the session/token
  res.json({ success: true });
});

// Get partner email
app.get('/api/partner', (req, res) => {
  const userId = parseInt(req.query.userId);
  const partnerId = linkedPartners.get(userId);
  const partner = users.find(u => u.id === partnerId);
  res.json({ 
    success: !!partner,
    partnerEmail: partner?.email,
    partnerId: partner?.id,
    firstName: partner?.firstName,
    lastName: partner?.lastName,
    phone: partner?.phone
  });
});

// Unlink partner
app.delete('/api/partner/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const partnerId = linkedPartners.get(userId);
  
  if (partnerId) {
    linkedPartners.delete(userId);
    linkedPartners.delete(partnerId);
  }
  
  res.json({ success: true });
});

// Add registration endpoint
app.post('/api/register', (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ success: false, message: "Email already exists" });
  }

  const newUser = {
    id: users.length + 1,
    firstName,
    lastName,
    email,
    phone,
    password
  };
  
  users.push(newUser);
  res.json({ success: true });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 