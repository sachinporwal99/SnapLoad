const fs = require('fs');

function cleanTmp(filePath) {
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
}

function safeTitle(title, fallback = 'video') {
  return (title || fallback).replace(/[^\w\s-]/g, '').trim().slice(0, 60) || fallback;
}

function streamFile(res, req, filePath, cleanup) {
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
  stream.on('close', cleanup);
  stream.on('error', () => { cleanup(); if (!res.headersSent) res.status(500).end(); });
  req.on('close', () => { stream.destroy(); cleanup(); });
}

module.exports = { cleanTmp, safeTitle, streamFile };
