import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { adminOnly } from '../../middleware/auth';

const router = Router();

const uploadsDir = path.resolve(process.cwd(), 'storage', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({ storage });

router.post('/upload', adminOnly as any, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    data: {
      url: fileUrl,
      size: req.file.size,
      mimetype: req.file.mimetype,
      filename: req.file.filename
    }
  });
});

router.delete('/', adminOnly as any, async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) {
    return res.status(400).json({ error: 'Invalid url' });
  }
  try {
    const filePath = path.resolve(process.cwd(), url.replace(/^\//, ''));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;






















































































