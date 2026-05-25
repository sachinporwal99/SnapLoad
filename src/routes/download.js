const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { randomUUID } = require('crypto');
const { downloadToFile } = require('../utils/ytdlp');
const { cleanTmp, safeTitle, streamFile } = require('../utils/file');

const router = Router();

router.get('/', async (req, res) => {
  const { url, height, title } = req.query;
  if (!url || !height) return res.status(400).json({ error: 'Missing params: url and height required' });

  const filename = `${safeTitle(title)}_${height}p.mp4`;
  const tmpFile = path.join(os.tmpdir(), `snapload_${randomUUID()}.mp4`);
  const formatStr = `"bestvideo[height=${height}]+bestaudio/bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best"`;

  try {
    await downloadToFile(
      `--no-playlist -f ${formatStr} --merge-output-format mp4 --postprocessor-args "ffmpeg:-c:a aac -c:v copy"`,
      url,
      tmpFile
    );

    if (!fs.existsSync(tmpFile)) {
      throw new Error('Output file was not created. Ensure ffmpeg is installed.');
    }

    const { size } = fs.statSync(tmpFile);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', size);

    streamFile(res, req, tmpFile, () => cleanTmp(tmpFile));
  } catch (err) {
    cleanTmp(tmpFile);
    console.error('[download error]', err.message);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

module.exports = router;






