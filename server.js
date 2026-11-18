const express = require('express');
const app = express();

// Daftar video siap putar yang dijamin langsung tampil tanpa kendala API
const defaultVideos = [
  { id: 'jfKfPfyJRdk', title: 'Lofi Girl - lofi hip hop radio', channel: 'Lofi Girl' },
  { id: '5qap5aO4i9A', title: 'lofi hip hop radio - beats to relax/study to', channel: 'Lofi Girl' },
  { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE M/V', channel: 'officialpsy' },
  { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito ft. Daddy Yankee', channel: 'Luis Fonsi' },
  { id: '3JZ_D3ELwOQ', title: 'Charlie Puth - Attention [Official Video]', channel: 'Charlie Puth' },
  { id: 'RgKAFK5djSk', title: 'Wiz Khalifa - See You Again ft. Charlie Puth', channel: 'Wiz Khalifa' }
];

// Styling CSS Obsidian Luxe khusus layar QVGA 320x240 (D-pad friendly)
const baseCSS = `
  body { background-color: #0d1117; color: #c9d1d9; font-family: monospace; margin: 0; padding: 4px; font-size: 11px; }
  a { color: #58a6ff; text-decoration: none; }
  a:focus, a:hover { background-color: #1f6feb; color: #fff; outline: 1px solid #f0f6fc; }
  input, button { background: #161b22; color: #c9d1d9; border: 1px solid #30363d; font-size: 11px; padding: 3px; margin: 2px 0; }
  button:focus { border-color: #58a6ff; }
  .header { background: #161b22; border-bottom: 1px solid #30363d; padding: 4px; text-align: center; }
  .item { border-bottom: 1px solid #21262d; padding: 4px 0; }
  .meta { color: #8b949e; font-size: 9px; }
  .nav { text-align: center; margin: 6px 0; font-size: 10px; }
  .title { font-weight: bold; color: #f0f6fc; font-size: 12px; margin: 2px 0; }
`;

// Halaman Utama
app.get('/', (req, res) => {
  const searchQuery = req.query.q ? req.query.q.toLowerCase() : '';
  
  // Filter pencarian sederhana dari daftar video
  let filteredVideos = defaultVideos;
  if (searchQuery) {
    filteredVideos = defaultVideos.filter(v => v.title.toLowerCase().includes(searchQuery) || v.channel.toLowerCase().includes(searchQuery));
  }

  let html = `<!DOCTYPE html>
  <html>
  <head><title>NokiaTube [Obsidian Luxe]</title><style>${baseCSS}</style></head>
  <body>
    <div class="header">
      <div style="font-weight:bold; color:#58a6ff;">NokiaTube [Obsidian Luxe]</div>
      <form action="/" method="GET">
        <input type="text" name="q" placeholder="Cari video..." style="width:170px;" value="${req.query.q || ''}" />
        <button type="submit">Cari</button>
      </form>
    </div>
    <div>
      <div style="padding: 2px 0; font-weight:bold; border-bottom: 1px solid #30363d;">${searchQuery ? 'Hasil Pencarian' : 'Video Pilihan & Musik'}</div>`;

  if (filteredVideos.length === 0) {
    html += `<div style="padding: 6px; color:#f85149;">Video tidak ditemukan.</div>`;
  } else {
    filteredVideos.forEach(v => {
      html += `
        <div class="item">
          <a href="/watch?id=${v.id}&title=${encodeURIComponent(v.title)}">${v.title}</a>
          <div class="meta">${v.channel}</div>
        </div>`;
    });
  }

  html += `
    </div>
    <div class="nav"><a href="/">[ Menu Utama ]</a></div>
  </body></html>`;

  res.send(html);
});

// Halaman Tonton / Pilihan Download
app.get('/watch', (req, res) => {
  const vidId = req.query.id;
  const vidTitle = req.query.title || 'Video YouTube';
  if (!vidId) return res.redirect('/');

  let html = `<!DOCTYPE html>
  <html>
  <head><title>${vidTitle}</title><style>${baseCSS}</style></head>
  <body>
    <div class="header"><a href="/">&lt;&lt; Kembali</a></div>
    <div class="title">${vidTitle}</div>
    
    <div style="margin: 8px 0; padding: 4px; background: #161b22; border: 1px solid #30363d;">
      <div style="font-weight:bold; color: #58a6ff; margin-bottom: 4px;">Pilihan Putar / Unduh Kompatibel:</div>
      <div><a href="https://invidious.privacydev.net/latest_version?id=${vidId}&itag=18" target="_blank">[ Putar/Unduh Format MP4 (360p) ]</a></div>
      <div style="margin-top: 4px;"><a href="https://invidious.privacydev.net/latest_version?id=${vidId}&itag=17" target="_blank">[ Putar/Unduh Format 3GP (Rendah) ]</a></div>
    </div>

    <div style="font-size: 10px; color: #8b949e; margin-top: 10px;">
      <em>Tips Nokia C3:</em> Klik tautan di atas. Opera Mini akan meneruskannya ke Media Player ponsel untuk memutar video.
    </div>

    <div class="nav" style="margin-top:15px;"><a href="/">[ Menu Utama ]</a></div>
  </body></html>`;

  res.send(html);
});

// Ekspor aplikasi untuk Vercel Serverless
module.exports = app;
