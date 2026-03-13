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

// Configure Multer to use a temporary directory first
const TEMP_DIR = path.join(TARGET_DIR, 'temp');
fs.ensureDirSync(TEMP_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

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

// Upload multiple JSON files with Version Control
app.post('/api/upload', upload.array('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const versionsDir = path.join(TARGET_DIR, 'versions');
  await fs.ensureDir(versionsDir);

  const results = [];
  const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];

  for (const file of req.files) {
    const finalPath = path.join(TARGET_DIR, file.originalname);
    
    try {
      // Version Control: Move existing file to versions folder
      if (await fs.pathExists(finalPath)) {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        const versionedName = `${name}_${timestamp}${ext}`;
        const archivePath = path.join(versionsDir, versionedName);
        
        await fs.move(finalPath, archivePath);
        console.log(`Archived existing file: ${file.originalname} -> ${versionedName}`);
      }
      
      // Move new file from temp to final destination
      await fs.move(file.path, finalPath, { overwrite: true });
      results.push(file.originalname);
    } catch (err) {
      console.error(`Error processing file ${file.originalname}:`, err);
      // Clean up temp file if something went wrong
      await fs.remove(file.path).catch(() => {});
    }
  }

  res.status(200).send({
    message: 'Files uploaded successfully with version control',
    files: results
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
