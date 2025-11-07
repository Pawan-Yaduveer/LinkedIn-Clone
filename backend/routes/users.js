const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get public profile and user's posts
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.json({ user, posts });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get suggestions: users not already connected to requester, with mutual connection counts
router.get('/', auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select('connections');
    const myConnIds = (me.connections || []).map(c => c.toString());

    // find users who are not me and not already connected
    const candidates = await User.find({ _id: { $ne: req.user.id, $nin: myConnIds } }).select('name email avatar bio connections');

    const myConnSet = new Set(myConnIds);
    const users = candidates.map(u => {
      const uConnIds = (u.connections || []).map(c => c.toString());
      const mutual = uConnIds.filter(id => myConnSet.has(id)).length;
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        bio: u.bio,
        connections: u.connections,
        mutualCount: mutual
      };
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Connect with a user (mutual connection)
router.post('/:id/connect', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const meId = req.user.id;
    if (meId === targetId) return res.status(400).json({ message: 'Cannot connect to yourself' });

    const me = await User.findById(meId);
    const target = await User.findById(targetId);
    if (!me || !target) return res.status(404).json({ message: 'User not found' });

    // add each other to connections if not already
    const meHas = me.connections?.some(c => c.toString() === targetId);
    const targetHas = target.connections?.some(c => c.toString() === meId);

    if (!meHas) me.connections = [...(me.connections || []), target._id];
    if (!targetHas) target.connections = [...(target.connections || []), me._id];

    await me.save();
    await target.save();

    // return basic updated info for both
    res.json({ message: 'Connected', connected: true, target: { id: target._id, name: target.name, connections: target.connections.length } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Disconnect (remove mutual connection)
router.delete('/:id/connect', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const meId = req.user.id;
    if (meId === targetId) return res.status(400).json({ message: 'Cannot disconnect from yourself' });

    const me = await User.findById(meId);
    const target = await User.findById(targetId);
    if (!me || !target) return res.status(404).json({ message: 'User not found' });

    me.connections = (me.connections || []).filter(c => c.toString() !== targetId);
    target.connections = (target.connections || []).filter(c => c.toString() !== meId);

    await me.save();
    await target.save();

    res.json({ message: 'Disconnected', connected: false });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Update profile (owner only) - supports avatar upload
router.put('/:id', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (req.user.id !== req.params.id) return res.status(403).json({ message: 'Unauthorized' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.name) user.name = req.body.name;
    if (req.body.bio) user.bio = req.body.bio;
    if (req.file) user.avatar = `/uploads/${req.file.filename}`;

    await user.save();
    res.json({ user: { id: user._id, name: user.name, email: user.email, bio: user.bio, avatar: user.avatar } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Delete account (owner only) - removes user's posts and references
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) return res.status(403).json({ message: 'Unauthorized' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // delete all posts by this user
    await Post.deleteMany({ user: req.params.id });

    // remove this user from other users' connections
    await User.updateMany({ connections: req.params.id }, { $pull: { connections: req.params.id } });

    // delete avatar file if present
    try{
      if (user.avatar) {
        const fs = require('fs');
        const avatarPath = path.join(__dirname, '..', user.avatar.replace(/^\//, ''));
        if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
      }
    }catch(e){ console.warn('Failed to remove avatar file', e); }

    // finally delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
