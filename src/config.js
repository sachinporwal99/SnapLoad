const path = require('path');
const ffmpegPath = require('ffmpeg-static');

module.exports = {
  PORT: process.env.PORT || 3001,
  PUBLIC_DIR: path.join(__dirname, '..', 'public'),
  FFMPEG_FLAG: `--ffmpeg-location "${ffmpegPath}"`,
};
