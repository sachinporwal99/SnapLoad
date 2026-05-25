// Use relative URLs so the app works on any host (local or deployed)
const API = '';
let selectedFormat = 'video';

// ── Server status ─────────────────────────────────────────────────────────────
async function checkServer() {
  try {
    const res = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(3000) });
    setServerStatus(res.ok);
  } catch {
    setServerStatus(false);
  }
}

function setServerStatus(online) {
  document.getElementById('status-dot').style.background = online ? '#00e676' : '#ff5252';
  document.getElementById('status-label').textContent = online ? 'Server online' : 'Server offline';
}

checkServer();

// ── Format selector ───────────────────────────────────────────────────────────
function selectFormat(el, fmt) {
  selectedFormat = fmt;
  document.querySelectorAll('.format-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('fetchBtn').textContent = fmt === 'audio' ? 'Fetch Audio ↗' : 'Fetch Video ↗';
}

// ── Paste ─────────────────────────────────────────────────────────────────────
async function pasteUrl() {
  try {
    document.getElementById('urlInput').value = await navigator.clipboard.readText();
  } catch {
    alert('Use Ctrl+V / Cmd+V to paste.');
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function setStatus(html) {
  document.getElementById('status-area').innerHTML = html;
}

function statusBox(type, icon, title, msg) {
  const colors = {
    warning: 'rgba(255,171,0,.12)',
    error:   'rgba(255,82,82,.12)',
    info:    'rgba(0,229,255,.1)',
  };
  return `
    <div class="status-box">
      <div class="status-icon" style="background:${colors[type]}">${icon}</div>
      <div class="status-text">
        <strong>${title}</strong>
        <span>${msg}</span>
      </div>
    </div>`;
}

function formatDur(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

function pad(n) { return String(n).padStart(2, '0'); }

function formatBytes(b) {
  if (b > 1e9) return (b / 1e9).toFixed(1) + ' GB';
  if (b > 1e6) return (b / 1e6).toFixed(0) + ' MB';
  return (b / 1e3).toFixed(0) + ' KB';
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Fetch video info ──────────────────────────────────────────────────────────
async function fetchVideo() {
  const url = document.getElementById('urlInput').value.trim();
  const btn = document.getElementById('fetchBtn');

  if (!url) {
    setStatus(statusBox('warning', '⚠️', 'No URL entered', 'Paste a video link first.'));
    return;
  }
  try { new URL(url); } catch {
    setStatus(statusBox('error', '❌', 'Invalid URL', 'Enter a valid URL starting with https://'));
    return;
  }

  btn.disabled = true;
  let prog = 0;
  setStatus(`
    <div class="status-box">
      <div class="status-icon" style="background:rgba(124,77,255,.12)"><div class="spinner"></div></div>
      <div class="status-text">
        <strong>Fetching video info…</strong>
        <span>Scanning all available quality levels via yt-dlp</span>
        <div class="progress-bar-wrap"><div class="progress-bar" id="pbar"></div></div>
      </div>
    </div>`);

  const tick = setInterval(() => {
    prog = Math.min(prog + Math.random() * 10, 82);
    const el = document.getElementById('pbar');
    if (el) el.style.width = prog + '%';
  }, 220);

  try {
    const res = await fetch(`${API}/api/info?url=${encodeURIComponent(url)}`);
    clearInterval(tick);
    const pb = document.getElementById('pbar');
    if (pb) pb.style.width = '100%';

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server error');

    await new Promise(r => setTimeout(r, 280));
    showResult(data, url);
  } catch (err) {
    clearInterval(tick);
    const msg = (err.message.includes('fetch') || err.message.includes('NetworkError'))
      ? 'Cannot reach server. Make sure it is running with: npm start'
      : err.message;
    setStatus(statusBox('error', '❌', 'Failed to fetch video info', msg));
  } finally {
    btn.disabled = false;
  }
}

// ── Render result card ────────────────────────────────────────────────────────
function showResult(info, url) {
  const thumb = info.thumbnail
    ? `<img src="${info.thumbnail}" alt="" onerror="this.parentNode.innerHTML='🎬'">`
    : '🎬';
  const dur = info.duration ? formatDur(info.duration) : null;
  const isAudio = selectedFormat === 'audio';
  const formats = isAudio ? info.audioFormats : info.videoFormats;

  const mp3Url  = `${API}/api/mp3?url=${encodeURIComponent(url)}&title=${encodeURIComponent(info.title || 'audio')}`;
  const mp3Name = `${(info.title || 'audio').replace(/[^\w\s]/g, '').trim()}.mp3`;

  let fmtHtml = '';
  if (!formats || formats.length === 0) {
    fmtHtml = '<p style="color:var(--muted);font-size:13px">No formats found. Try switching the mode above.</p>';
  } else {
    fmtHtml = '<div class="dl-grid" id="dlGrid">';
    formats.forEach((f, i) => {
      const size = f.filesize
        ? formatBytes(f.filesize)
        : (f.filesizeApprox ? '~' + formatBytes(f.filesizeApprox) : '');
      const fps = f.fps ? ` · ${f.fps}fps` : '';
      const apiUrl = f.type === 'video'
        ? `${API}/api/download?url=${encodeURIComponent(url)}&height=${f.height}&title=${encodeURIComponent(info.title || 'video')}`
        : mp3Url;
      const filename = f.type === 'video'
        ? `${(info.title || 'video').replace(/[^\w\s]/g, '').trim()}_${f.quality}.mp4`
        : mp3Name;

      fmtHtml += `
        <button class="dl-btn ${i === 0 ? 'best' : ''}" id="dlbtn_${i}"
          onclick="startDownload(this,'${encodeURIComponent(apiUrl)}','${encodeURIComponent(filename)}')">
          <div style="flex:1;min-width:0">
            <div class="dl-quality">${escHtml(f.quality)}</div>
            <div class="dl-info">${f.ext.toUpperCase()}${size ? ' · ' + size : ''}${fps}</div>
            <div class="dl-progress"><div class="dl-progress-bar" id="prog_${i}"></div></div>
          </div>
          <span class="dl-icon" id="icon_${i}">↓</span>
        </button>`;
    });
    fmtHtml += '</div>';
  }

  setStatus(`
    <div class="result-card">
      <div class="result-meta">
        <div class="thumb-wrap">${thumb}</div>
        <div class="meta-info">
          <div class="meta-title">${escHtml(info.title || 'Video')}</div>
          ${info.uploader ? `<div class="meta-sub">by ${escHtml(info.uploader)}</div>` : ''}
          <div class="meta-badges">
            ${info.platform ? `<span class="badge badge-platform">${info.platform}</span>` : ''}
            ${dur ? `<span class="badge badge-dur">${dur}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="dl-section">
        <div class="dl-section-title">
          ${isAudio ? 'Audio quality' : 'Video quality'}
          ${!isAudio ? '<span class="tag">VIDEO + AUDIO MERGED</span>' : ''}
        </div>
        ${fmtHtml}
        ${!isAudio ? '<div class="merge-notice">✅ Each download merges the best video + audio streams using ffmpeg — full quality with sound.</div>' : ''}
        <div class="dl-error-toast" id="dlErrorToast"></div>
      </div>

      ${!isAudio ? `
      <div class="dl-section">
        <div class="dl-section-title">Audio only</div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <span style="font-size:13px;color:var(--muted)">Extract just the audio track as MP3</span>
          <button class="mp3-btn" id="mp3Btn"
            onclick="startDownload(this,'${encodeURIComponent(mp3Url)}','${encodeURIComponent(mp3Name)}')">
            ⬇ Download MP3
          </button>
        </div>
      </div>` : ''}
    </div>
  `);
}

// ── Download handler ──────────────────────────────────────────────────────────
async function startDownload(btn, encodedApiUrl, encodedFilename) {
  const apiUrl   = decodeURIComponent(encodedApiUrl);
  const filename = decodeURIComponent(encodedFilename);
  const iconEl   = btn.querySelector('.dl-icon');
  const infoEl   = btn.querySelector('.dl-info');
  const progBar  = btn.querySelector('.dl-progress-bar');
  const origInfo = infoEl ? infoEl.textContent : '';

  document.querySelectorAll('.dl-btn, .mp3-btn').forEach(b => { b.disabled = true; });

  btn.classList.add('loading');
  if (iconEl) iconEl.innerHTML = '<div class="spinner"></div>';
  if (infoEl) infoEl.textContent = 'Preparing… this may take 10–30s';
  if (progBar) {
    let p = 0;
    btn._progTick = setInterval(() => {
      p = Math.min(p + Math.random() * 4, 88);
      progBar.style.width = p + '%';
    }, 400);
  }

  const errToast = document.getElementById('dlErrorToast');
  if (errToast) errToast.style.display = 'none';

  try {
    const response = await fetch(apiUrl);
    const ct = response.headers.get('Content-Type') || '';

    if (!response.ok || ct.includes('application/json')) {
      const errData = await response.json();
      throw new Error(errData.error || `Server error ${response.status}`);
    }

    const blob    = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

    clearInterval(btn._progTick);
    if (progBar) progBar.style.width = '100%';
    btn.classList.remove('loading');
    btn.classList.add('done');
    if (iconEl) iconEl.textContent = '✓';
    if (infoEl) infoEl.textContent = 'Download complete!';

    setTimeout(() => {
      btn.classList.remove('done');
      if (iconEl) iconEl.textContent = '↓';
      if (infoEl) infoEl.textContent = origInfo;
      if (progBar) progBar.style.width = '0%';
    }, 4000);

  } catch (err) {
    clearInterval(btn._progTick);
    btn.classList.remove('loading');
    btn.classList.add('failed');
    if (iconEl) iconEl.textContent = '✕';
    if (infoEl) infoEl.textContent = 'Download failed';
    if (progBar) progBar.style.width = '0%';

    if (errToast) {
      errToast.style.display = 'block';
      errToast.innerHTML = `❌ <strong>Error:</strong> ${escHtml(err.message)}`;
    }

    setTimeout(() => {
      btn.classList.remove('failed');
      if (iconEl) iconEl.textContent = '↓';
      if (infoEl) infoEl.textContent = origInfo;
      if (errToast) errToast.style.display = 'none';
    }, 6000);
  } finally {
    document.querySelectorAll('.dl-btn, .mp3-btn').forEach(b => { b.disabled = false; });
  }
}

document.getElementById('urlInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') fetchVideo();
});
