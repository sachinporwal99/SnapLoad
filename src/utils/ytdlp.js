const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { FFMPEG_FLAG } = require('../config');

// Write cookies to a temporary file if YT_DLP_COOKIES env var is set
function getCookiesFlag() {
  const cookies = process.env.YT_DLP_COOKIES;
  if (!cookies) return '';

  const cookiesPath = path.join('/tmp', 'yt-dlp-cookies.txt');
  try {
    fs.writeFileSync(cookiesPath, cookies, 'utf8');
    return `--cookies ${cookiesPath}`;
  } catch (err) {
    console.error('[yt-dlp] Failed to write cookies file:', err.message);
    return '';
  }
}

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const cookiesFlag = getCookiesFlag();
    exec(
      `yt-dlp --js-runtimes node ${cookiesFlag} ${FFMPEG_FLAG} ${args}`,
      { maxBuffer: 20 * 1024 * 1024, timeout: 60_000 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message));
        resolve(stdout.trim());
      }
    );
  });
}

function downloadToFile(args, url, outPath) {
  return new Promise((resolve, reject) => {
    const cookiesFlag = getCookiesFlag();
    const cmd = `yt-dlp --js-runtimes node ${cookiesFlag} ${FFMPEG_FLAG} ${args} \"${url}\" -o \"${outPath}\"`;
    console.log('[yt-dlp]', cmd);
    exec(
      cmd,
      { maxBuffer: 50 * 1024 * 1024, timeout: 10 * 60_000 },
      (err, _stdout, stderr) => {
        if (err) {
          console.error('[yt-dlp error]', stderr.slice(-500));
          return reject(new Error(stderr.slice(-300) || err.message));
        }
        resolve();
      }
    );
  });
}

module.exports = { runYtDlp, downloadToFile };
