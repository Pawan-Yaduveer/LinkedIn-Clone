const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const mongoose = require('mongoose');

// Create post
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(400).json({ message: 'User not found' });

    let imageUrl;
    if (req.file && req.file.buffer) {
      // store in MongoDB GridFS and capture the file id
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
      const filename = `${Date.now()}_${req.file.originalname}`;
      const uploadStream = bucket.openUploadStream(filename, { contentType: req.file.mimetype });

      await new Promise((resolve, reject) => {
        uploadStream.end(req.file.buffer, (err) => err ? reject(err) : resolve());
      });
      const fileId = uploadStream.id;
      imageUrl = `/api/files/${fileId.toString()}`;
    }

    const newPost = new Post({
      user: user._id,
      name: user.name,
      text: req.body.text || '',
      image: imageUrl
    });

    const post = await newPost.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Like/unlike
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const idx = post.likes.indexOf(req.user.id);
    if (idx === -1) post.likes.push(req.user.id);
    else post.likes.splice(idx, 1);

    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Add comment
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(400).json({ message: 'User not found' });

    const comment = { user: user._id, name: user.name, text: req.body.text };
    post.comments.unshift(comment);
    await post.save();
   
    res.json(post.comments[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Delete comment 
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const { id, commentId } = req.params;

    // Load post and locate target comment for auth check
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Authorization: author of comment or owner of post can delete
    const requester = req.user.id;
    if (comment.user.toString() !== requester && post.user.toString() !== requester) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Atomic removal using $pull avoids subdocument instance method issues
    await Post.updateOne(
      { _id: id },
      { $pull: { comments: { _id: commentId } } }
    );

    // Fetch minimal updated post data for client convenience
    const updated = await Post.findById(id).select('comments likes image user');
    return res.json({ message: 'Comment removed', post: updated });
  } catch (err) {
    console.error('Delete comment error:', err);
    return res.status(500).json({ message: 'Server error deleting comment' });
  }
});

// Edit post
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    // Update text if provided
    if (typeof req.body.text === 'string') {
      post.text = req.body.text;
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });

    // Handle image removal if requested
    const removeImage = (req.body.removeImage === 'true' || req.body.removeImage === true);
    if (removeImage && post.image && post.image.startsWith('/api/files/')) {
      try {
        const oldIdStr = post.image.split('/api/files/')[1];
        await bucket.delete(new mongoose.Types.ObjectId(oldIdStr));
      } catch (e) { console.warn('Failed to remove old post image (removeImage):', e.message); }
      post.image = undefined;
    }

    // Handle new image upload (replace if existing)
    if (req.file && req.file.buffer) {
      // delete old image first if exists
      if (post.image && post.image.startsWith('/api/files/')) {
        try {
          const oldIdStr = post.image.split('/api/files/')[1];
          await bucket.delete(new mongoose.Types.ObjectId(oldIdStr));
        } catch (e) { console.warn('Failed to remove old post image (replace):', e.message); }
      }
      const filename = `${Date.now()}_${req.file.originalname}`;
      const uploadStream = bucket.openUploadStream(filename, { contentType: req.file.mimetype });
      await new Promise((resolve, reject) => {
        uploadStream.end(req.file.buffer, (err) => err ? reject(err) : resolve());
      });
      const fileId = uploadStream.id;
      post.image = `/api/files/${fileId.toString()}`;
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Delete post 
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    // if post had an image in GridFS, delete it
    try {
      if (post.image && post.image.startsWith('/api/files/')) {
        const fileIdStr = post.image.split('/api/files/')[1];
        if (fileIdStr) {
          const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
          await bucket.delete(new mongoose.Types.ObjectId(fileIdStr));
        }
      }
    } catch (e) {
      console.warn('Failed to remove GridFS image for post:', e.message);
    }

    await post.deleteOne();
    res.json({ message: 'Post removed' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
