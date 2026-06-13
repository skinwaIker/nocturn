import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const imgDir = path.join(__dirname, 'img');
const avatarsDir = path.join(imgDir, 'avatars');
const bannersDir = path.join(imgDir, 'banners');

[imgDir, avatarsDir, bannersDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created: ${dir}`);
  }
});

app.use('/img', express.static(imgDir));

// Multer upload middleware
const uploadMiddleware = multer({
  storage: multer.memoryStorage(), // сохраняем в памяти сначала
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  },
});

app.post('/api/upload', uploadMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('No file provided');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folder = req.body?.folder === 'avatars' ? 'avatars' : 'banners';
    const filename = req.body?.filename || req.file.originalname;
    
    const folderPath = folder === 'avatars' ? avatarsDir : bannersDir;
    const filepath = path.join(folderPath, filename);

    console.log(`\n📤 Uploading file:`);
    console.log(`   Folder: ${folder}`);
    console.log(`   Filename: ${filename}`);
    console.log(`   Size: ${req.file.size} bytes`);
    console.log(`   Saving to: ${filepath}`);

    // Сохраняем файл на диск
    fs.writeFileSync(filepath, req.file.buffer);

    const urlPath = `/img/${folder}/${filename}`;
    console.log(`✓ Success! URL: ${urlPath}\n`);
    
    res.json({ path: urlPath, success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Upload error:', msg);
    res.status(500).json({ error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`\n✓ Upload server running on http://localhost:${PORT}`);
  console.log(`✓ Image folder: ${imgDir}\n`);
});
