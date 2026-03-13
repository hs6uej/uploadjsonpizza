const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Target directory - defaulting to /app/chatmenupizza/Menu JSON for Linux/Docker, 
// but allowing it to be overridden via environment variable.
const TARGET_DIR = process.env.UPLOAD_DIR || path.join('C:', 'app', 'chatmenupizza', 'Menu JSON');

// Ensure target directory exists
fs.ensureDirSync(TARGET_DIR);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Configure Multer for storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TARGET_DIR);
  },
  filename: (req, file, cb) => {
    // Preserve original filename
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.json') {
      cb(null, true);
    } else {
      cb(new Error('Only .json files are allowed!'));
    }
  }
});

// API Endpoints

// List files in the target directory
app.get('/api/files', async (req, res) => {
  try {
    const files = await fs.readdir(TARGET_DIR);
    const jsonFiles = files.filter(file => file.toLowerCase().endsWith('.json'));
    
    const fileStats = await Promise.all(jsonFiles.map(async (file) => {
      const stats = await fs.stat(path.join(TARGET_DIR, file));
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime
      };
    }));
    
    res.json(fileStats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Upload multiple JSON files
app.post('/api/upload', upload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  res.status(200).send({
    message: 'Files uploaded successfully',
    files: req.files.map(f => f.originalname)
  });
});

// Error handling for Multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Target directory: ${TARGET_DIR}`);
});
