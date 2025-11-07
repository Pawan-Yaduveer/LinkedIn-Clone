const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Stream a file from GridFS by id
router.get('/:id', async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });

    // try to find file metadata to set headers
    const files = await bucket.find({ _id: id }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }
    const file = files[0];
    if (file.contentType) res.set('Content-Type', file.contentType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');

    const downloadStream = bucket.openDownloadStream(id);
    downloadStream.on('error', () => res.status(404).end());
    downloadStream.pipe(res);
  } catch (err) {
    console.error('File stream error:', err);
    res.status(400).json({ message: 'Invalid file id' });
  }
});

module.exports = router;
