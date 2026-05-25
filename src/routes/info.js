const { Router } = require('express');
const { runYtDlp } = require('../utils/ytdlp');

const router = Router();

router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    const raw = await runYtDlp(`--dump-json --no-playlist "${url}"`);
    const info = JSON.parse(raw);
    const formats = info.formats || [];

    // Deduplicate video formats by resolution, keep best filesize per height
    const resMap = new Map();
    formats.forEach(f => {
      if (!f.ext || f.ext === 'mhtml') return;
      if (!f.vcodec || f.vcodec === 'none') return;
      const h = f.height || 0;
      if (h < 144) return;
      const key = String(h);
      const existing = resMap.get(key);
      const sz = f.filesize || f.filesize_approx || 0;
      const esz = existing ? (existing.filesize || existing.filesizeApprox || 0) : 0;
      if (!existing || sz > esz) {
        resMap.set(key, {
          height: h,
          fps: f.fps,
          filesize: f.filesize,
          filesizeApprox: f.filesize_approx,
        });
      }
    });

    const videoFormats = [...resMap.entries()]
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .slice(0, 6)
      .map(([h, f]) => ({
        type: 'video',
        quality: `${h}p`,
        height: parseInt(h),
        ext: 'mp4',
        fps: f.fps,
        filesize: f.filesize,
        filesizeApprox: f.filesizeApprox,
      }));

    const audioFormats = formats
      .filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'))
      .sort((a, b) => (b.abr || 0) - (a.abr || 0))
      .slice(0, 3)
      .map(f => ({
        type: 'audio',
        quality: `${Math.round(f.abr || 0)}kbps`,
        ext: 'mp3',
        filesize: f.filesize,
      }));

    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration,
      uploader: info.uploader,
      platform: info.extractor_key,
      videoFormats,
      audioFormats,
    });
  } catch (err) {
    console.error('[info error]', err.message);
    res.status(500).json({ error: 'Please enter a correct video URL' });
  }
});

module.exports = router;
