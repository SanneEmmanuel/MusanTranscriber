// index.js
// MusanTranscriber by Dr Sanne Karibo - Main Server File

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { transcribe } = require('./transcriber');

const app = express();
const port = 3000;

// File upload middleware setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads';
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('notationFile'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const key = req.body.key || 'C';

    const result = await transcribe(filePath, key);
    fs.unlinkSync(filePath); // Clean up upload

    res.send(`<pre>${result}</pre><br><a href="/">Back</a>`);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred while transcribing.');
  }
});

app.listen(port, () => {
  console.log(`🎵 MusanTranscriber by Dr Sanne Karibo running at http://localhost:${port}`);
});
