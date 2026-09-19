const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { PDFDocument } = require('pdf-lib');

ffmpeg.setFfmpegPath(ffmpegStatic);

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2 GB
});

// Ensure directories exist
['uploads', 'output'].forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

// Helper to cleanup files
const cleanup = (...files) => {
  files.forEach(file => {
    if (file && fs.existsSync(file)) {
      try { fs.unlinkSync(file); } catch (e) { /* ignore */ }
    }
  });
};

// ========================
// IMAGE PROCESSING
// ========================
app.post('/api/process/image', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { width, height, format, quality, maintainAspectRatio } = req.body;
  const inputPath = req.file.path;
  const outFormat = format || 'jpeg';
  const outputPath = path.join(__dirname, 'output', `${req.file.filename}.${outFormat}`);

  try {
    let pipeline = sharp(inputPath);

    // Resize if width or height is provided
    if (width || height) {
      const resizeOpts = {
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        fit: maintainAspectRatio === 'true' ? 'inside' : 'fill',
        withoutEnlargement: false,
      };
      pipeline = pipeline.resize(resizeOpts);
    }

    // Format & Quality
    const q = quality ? Math.max(1, Math.min(100, parseInt(quality))) : 80;

    switch (outFormat) {
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({ quality: q, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality: q, compressionLevel: 9 });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality: q });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality: q });
        break;
      default:
        pipeline = pipeline.jpeg({ quality: q });
    }

    await pipeline.toFile(outputPath);

    const originalName = req.file.originalname;
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const downloadName = `${baseName}_compressed.${outFormat}`;

    res.download(outputPath, downloadName, () => {
      cleanup(inputPath, outputPath);
    });
  } catch (err) {
    console.error('Image processing error:', err);
    cleanup(inputPath, outputPath);
    res.status(500).json({ error: 'Failed to process image: ' + err.message });
  }
});

// ========================
// VIDEO PROCESSING
// ========================
app.post('/api/process/video', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { width, height, format, videoBitrate } = req.body;
  const inputPath = req.file.path;
  const outFormat = format || 'mp4';
  const outputPath = path.join(__dirname, 'output', `${req.file.filename}.${outFormat}`);

  let command = ffmpeg(inputPath);

  // Build video filters for resize (ffmpeg needs even numbers)
  const videoFilters = [];
  if (width || height) {
    // Ensure dimensions are even (divisible by 2), required by most codecs
    const w = width ? `trunc(${parseInt(width)}/2)*2` : '-2';
    const h = height ? `trunc(${parseInt(height)}/2)*2` : '-2';
    videoFilters.push(`scale=${w}:${h}`);
  }

  if (videoFilters.length > 0) {
    command = command.videoFilters(videoFilters);
  }

  // Compression / Bitrate
  if (videoBitrate) {
    command = command.videoBitrate(videoBitrate);
  }

  // Audio settings
  command = command.audioBitrate('128k');

  const originalName = req.file.originalname;
  const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  const downloadName = `${baseName}_compressed.${outFormat}`;

  command
    .format(outFormat)
    .on('start', (cmdline) => {
      console.log('FFmpeg started:', cmdline);
    })
    .on('progress', (progress) => {
      if (progress.percent) {
        console.log(`Processing: ${Math.round(progress.percent)}% done`);
      }
    })
    .on('end', () => {
      console.log('Video processing finished');
      res.download(outputPath, downloadName, () => {
        cleanup(inputPath, outputPath);
      });
    })
    .on('error', (err) => {
      console.error('Video processing error:', err);
      cleanup(inputPath, outputPath);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to process video: ' + err.message });
      }
    })
    .save(outputPath);
});

// ========================
// DOCUMENT PROCESSING (PDF)
// ========================
app.post('/api/process/document', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const inputPath = req.file.path;
  const outputPath = path.join(__dirname, 'output', `${req.file.filename}.pdf`);

  try {
    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    // Optimize: strip all metadata
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');

    const savedBytes = await pdfDoc.save({
      useObjectStreams: false,
    });

    fs.writeFileSync(outputPath, savedBytes);

    const originalName = req.file.originalname;
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const downloadName = `${baseName}_optimized.pdf`;

    res.download(outputPath, downloadName, () => {
      cleanup(inputPath, outputPath);
    });
  } catch (err) {
    console.error('Document processing error:', err);
    cleanup(inputPath, outputPath);
    res.status(500).json({ error: 'Failed to process document: ' + err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
