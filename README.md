# SnapLoad — Video Downloader

A full-stack video downloader website powered by **yt-dlp** and Node.js.
Supports YouTube, Instagram, TikTok, Twitter/X, Vimeo, Reddit, and 1000+ more sites.

---

## Requirements

- **Node.js** v16+ → https://nodejs.org
- **Python 3** + **yt-dlp** → `pip install yt-dlp`
- **ffmpeg** (for audio extraction) → https://ffmpeg.org/download.html

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Make sure yt-dlp and ffmpeg are installed

```bash
# Install yt-dlp
pip install yt-dlp

# macOS (homebrew)
brew install yt-dlp ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg
sudo pip install yt-dlp

# Windows
winget install yt-dlp
winget install Gyan.FFmpeg
```

### 3. Start the server

```bash
npm start
```

### 4. Open the website

Visit **http://localhost:3001** in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/info?url=<URL>` | Fetch video metadata and available formats |
| GET | `/api/download?url=<URL>&formatId=<ID>&title=<title>&ext=<ext>&type=<video\|audio>` | Stream download a specific format |
| GET | `/api/mp3?url=<URL>&title=<title>` | Download best audio as MP3 |

---

## Project Structure

```
snapload/
├── server.js          ← Express backend with yt-dlp integration
├── package.json
├── public/
│   └── index.html     ← Frontend UI
└── README.md
```

---

## Deploy to a Server (VPS/Cloud)

1. Copy the project to your server
2. Install Node.js, yt-dlp, ffmpeg on the server
3. Run `npm start`
4. Use **nginx** as a reverse proxy to port 3001
5. (Optional) Use **PM2** to keep the server running: `pm2 start server.js`

---

## Notes

- This tool is for **personal use only**
- Respect the Terms of Service of each platform
- Some platforms actively block downloading — yt-dlp may not always work
- Keep yt-dlp updated regularly: `pip install -U yt-dlp`

---

## Updating yt-dlp

```bash
pip install -U yt-dlp
```
