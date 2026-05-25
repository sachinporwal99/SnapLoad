const { exec } = require('child_process');
const { FFMPEG_FLAG } = require('../config');

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    exec(
      `yt-dlp --js-runtimes node ${FFMPEG_FLAG} ${args}`,
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
    const cmd = `yt-dlp --js-runtimes node ${FFMPEG_FLAG} ${args} "${url}" -o "${outPath}"`;
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
