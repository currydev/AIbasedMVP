const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// User model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    purchases: [{
      item: String,
      visible: { type: Boolean, default: true }
    }]
  });

const User = mongoose.model('User', userSchema);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Register route
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = new User({
    email,
    password: hashedPassword
  });

  try {
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// Send friend request
app.post('/api/send-friend-request', authenticateToken, async (req, res) => {
    const { friendEmail } = req.body;
    const user = await User.findById(req.user._id);
    const friend = await User.findOne({ email: friendEmail });
  
    if (!friend) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    if (friend.friendRequests.includes(user._id)) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }
  
    friend.friendRequests.push(user._id);
    await friend.save();
  
    res.json({ message: 'Friend request sent' });
  });
  
  // Accept friend request
  app.post('/api/accept-friend-request', authenticateToken, async (req, res) => {
    const { friendId } = req.body;
    const user = await User.findById(req.user._id);
  
    if (!user.friendRequests.includes(friendId)) {
      return res.status(400).json({ message: 'No friend request from this user' });
    }
  
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== friendId);
    user.friends.push(friendId);
    await user.save();
  
    const friend = await User.findById(friendId);
    friend.friends.push(user._id);
    await friend.save();
  
    res.json({ message: 'Friend request accepted' });
  });
  
  // Get friend requests
  app.get('/api/friend-requests', authenticateToken, async (req, res) => {
    const user = await User.findById(req.user._id).populate('friendRequests', 'email');
    res.json(user.friendRequests);
  });
  
  // Get friends list
  app.get('/api/friends', authenticateToken, async (req, res) => {
    const user = await User.findById(req.user._id).populate('friends', 'email');
    res.json(user.friends);
  });
// Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Email or password is incorrect' });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).json({ message: 'Email or password is incorrect' });

  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
  res.json({ token });
});

// Get friend network purchases
app.get('/api/network-purchases', authenticateToken, async (req, res) => {
  const user = await User.findById(req.user._id).populate('friends');
  const purchases = user.friends.flatMap(friend => 
    friend.purchases.filter(purchase => purchase.visible)
  );
  res.json(purchases);
});

// Toggle purchase visibility
app.patch('/api/purchases/:id/visibility', authenticateToken, async (req, res) => {
  const user = await User.findById(req.user._id);
  const purchase = user.purchases.id(req.params.id);
  if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
  purchase.visible = !purchase.visible;
  await user.save();
  res.json(purchase);
});

// Fake WooCommerce webhook endpoint
app.post('/api/woocommerce-webhook', (req, res) => {
  // In a real scenario, you'd verify the webhook signature here
  console.log('Received WooCommerce webhook:', req.body);
  // Process the order and update user purchases
  // For this example, we'll just log it
  res.sendStatus(200);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
