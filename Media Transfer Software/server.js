const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');

const app = express();
const PORT = 3443;

app.use(cors());

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${timestamp}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10000 * 1024 * 1024, // 10GB limit
    fieldSize: 50 * 1024 * 1024,  // 50MB for form fields
    files: 1 // Allow only 1 file at a time
  }
});

app.use(express.static(__dirname));

app.post('/upload', (req, res) => {
  // Handle multer upload with custom error handling
  upload.single('file')(req, res, async (err) => {
    // Handle multer-specific errors
    if (err) {
      console.error('❌ Multer error:', err);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          error: 'File too large',
          details: `File size exceeds the limit of ${Math.round(err.limit / 1024 / 1024)}MB`,
          maxSize: '1GB'
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Upload error',
        details: err.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      console.log(`📤 Receiving file: ${req.file.originalname} (${Math.round(req.file.size / 1024)}KB)`);
    

    const fileInfo = {
      originalName: req.file.originalname,
      savedAs: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
      path: req.body.path || req.file.originalname,
      uploadTime: new Date().toISOString(),
      savedPath: req.file.path
    };

    console.log('📁 File uploaded:', fileInfo);

    // Log file content preview for text files
    if (req.file.mimetype.startsWith('text/') || 
        req.file.originalname.endsWith('.json') ||
        req.file.originalname.endsWith('.js') ||
        req.file.originalname.endsWith('.html') ||
        req.file.originalname.endsWith('.css')) {
      try {
        const content = await fs.readFile(req.file.path, 'utf8');
        const preview = content.length > 500 ? content.substring(0, 500) + '...' : content;
        console.log('📄 File preview:', preview);
      } catch (readError) {
        console.log('❌ Could not read file content:', readError.message);
      }
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: fileInfo
    });

    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  });
});

// List uploaded files endpoint
app.get('/files', async (req, res) => {
  try {
    const files = await fs.readdir(uploadsDir);
    const fileDetails = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(uploadsDir, filename);
        const stats = await fs.stat(filePath);
        return {
          name: filename,
          size: stats.size,
          modified: stats.mtime,
          path: filePath
        };
      })
    );

    res.json({
      success: true,
      files: fileDetails
    });
  } catch (error) {
    console.error('❌ Error listing files:', error);
    res.status(500).json({
      success: false,
      error: 'Could not list files',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uploadsDirectory: uploadsDir
  });
});

// SSL Certificate configuration
async function startHttpsServer() {
  try {
    const httpsOptions = {
      key: await fs.readFile('./private.key', 'UTF-8'),
      cert: await fs.readFile('./public.crt', 'UTF-8')
    };

    const server = https.createServer(httpsOptions, app);
    
    server.listen(PORT, () => {
      console.log(`� HTTPS Server running at https://localhost:${PORT}`);
    });

    return server;
  } catch (error) {
    console.error('Error starting HTTPS server:', error);
    console.error('Make sure public.cert and private.key files exist in the same directory');
    process.exit(1);
  }
}

startHttpsServer();

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});
