const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { randomUUID } = require('crypto');
const { downloadToFile } = require('../utils/ytdlp');
const { cleanTmp, safeTitle, streamFile } = require('../utils/file');

const router = Router();

router.get('/', async (req, res) => {
  const { url, title } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  const filename = `${safeTitle(title, 'audio')}.mp3`;
  const tmpBase = path.join(os.tmpdir(), `snapload_${randomUUID()}`);

  try {
    await downloadToFile(
      '--no-playlist -f bestaudio -x --audio-format mp3 --audio-quality 0',
      url,
      `${tmpBase}.%(ext)s`
    );

    const files = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith(path.basename(tmpBase)));
    if (files.length === 0) throw new Error('MP3 file not created. Ensure ffmpeg is installed.');

    const actualFile = path.join(os.tmpdir(), files[0]);
    const { size } = fs.statSync(actualFile);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', size);

    streamFile(res, req, actualFile, () => cleanTmp(actualFile));
  } catch (err) {
    console.error('[mp3 error]', err.message);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

module.exports = router;
