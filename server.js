const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const port = 5000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use memory storage
const upload = multer({ storage: multer.memoryStorage() });

// POST /save endpoint
app.post('/save', upload.single('image'), (req, res) => {
  const { category } = req.body;

  if (!category || !req.file) {
    return res.status(400).json({ error: 'Missing category or image file' });
  }

  // Sanitize category for safe filenames
  const safeCategory = category.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const ext = path.extname(req.file.originalname) || '.jpg';
  const timestamp = Date.now();
  const filename = `${safeCategory}_${timestamp}${ext}`;

  const uploadPath = path.join(__dirname, 'uploads', filename);

  // Save the image file
  fs.writeFile(uploadPath, req.file.buffer, (err) => {
    if (err) {
      console.error('Error saving image:', err);
      return res.status(500).json({ error: 'Failed to save image' });
    }

    const imagePath = path.resolve(uploadPath);

    // Insert into database
    const query = 'INSERT INTO food_predictions (category, image_path) VALUES (?, ?)';
    db.query(query, [category, imagePath], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database insert error' });
      }

      console.log('✅ Image and category saved');
      return res.status(200).json({ message: 'Saved successfully', filename });
    });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
