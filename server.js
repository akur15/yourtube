const express = require('express');
const axios = require('axios');
const app = express();

// Data cadangan (fallback) agar halaman SELALU berhasil terbuka di Nokia C3-00
const fallbackVideos = [
  { videoId: 'jfKfPfyJRdk', title: 'Lofi Girl - lofi hip hop radio', uploader: 'Lofi Girl', viewsText: 'Live Stream' },
  { videoId: '5qap5aO4i9A', title: 'lofi hip hop radio - beats to relax/study to', uploader: 'Lofi Girl', viewsText: 'Live Stream' },
  { videoId: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE M/V', uploader: 'officialpsy', viewsText: '5 Miliar x ditonton' },
  { videoId: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito ft. Daddy Yankee', uploader: 'Luis Fonsi', viewsText: '8 Miliar x ditonton' }
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

// Halaman Utama / Trending & Search
app.get('/', async (req, res) => {
  let videos = [];
  let pageTitle = "Trending - NokiaTube";
  const searchQuery = req.query.q;

  try {
    if (searchQuery) {
      const response = await axios.get(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(searchQuery)}&filter=videos`, { timeout: 4000 });
      videos = response.data.items || [];
      pageTitle = `Cari: ${searchQuery}`;
    } else {
      const response = await axios.get('https://pipedapi.kavin.rocks/trending?region=ID', { timeout: 4000 });
      videos = response.data || [];
    }
  } catch (err) {
    // Jika API publik gagal/diblokir, otomatis gunakan data cadangan
    videos = fallbackVideos;
  }

  let html = `<!DOCTYPE html>
  <html>
  <head><title>${pageTitle}</title><style>${baseCSS}</style></head>
  <body>
    <div class="header">
      <div style="font-weight:bold; color:#58a6ff;">NokiaTube [Obsidian Luxe]</div>
      <form action="/" method="GET">
        <input type="text" name="q" placeholder="Cari video..." style="width:170px;" value="${searchQuery || ''}" />
        <button type="submit">Cari</button>
      </form>
    </div>
    <div>
      <div style="padding: 2px 0; font-weight:bold; border-bottom: 1px solid #30363d;">${searchQuery ? 'Hasil Pencarian' : 'Video Populer'}</div>`;

  videos.slice(0, 15).forEach(v => {
    const vidId = v.videoId || (v.url ? v.url.split('v=')[1] : '');
    const title = v.title;
    const author = v.uploader || v.author || '';
    const views = v.viewsText || v.viewCountText || '';
    
    if (vidId) {
      html += `
        <div class="item">
          <a href="/watch?id=${vidId}">${title}</a>
          <div class="meta">${author} | ${views}</div>
        </div>`;
    }
  });

  html += `
    </div>
    <div class="nav"><a href="/">[ Menu Utama ]</a></div>
  </body></html>`;

  res.send(html);
});

// Halaman Tonton / Detail & Download Tautan Video
app.get('/watch', async (req, res) => {
  const vidId = req.query.id;
  if (!vidId) return res.redirect('/');

  let v = { title: "Video YouTube", uploader: "YouTube" };

  try {
    const response = await axios.get(`https://pipedapi.kavin.rocks/streams/${vidId}`, { timeout: 5000 });
    v = response.data;
  } catch (err) {
    // Lanjutkan dengan fallback link langsung jika detail gagal diambil
  }

  const streams = v.videoStreams || [];
  let streamLinksHtml = '';

  streams.forEach(f => {
    if (f.url && (f.quality === '144p' || f.quality === '240p' || f.quality === '360p')) {
      streamLinksHtml += `<div><a href="${f.url}" target="_blank">[ Putar/Unduh ${f.quality} ]</a></div>`;
    }
  });

  // Fallback tautan langsung unduh/putar MP4/3GP standar
  if (!streamLinksHtml) {
    streamLinksHtml += `<div><a href="https://invidious.privacydev.net/latest_version?id=${vidId}&itag=18" target="_blank">[ Putar/Unduh Format MP4 ]</a></div>`;
    streamLinksHtml += `<div><a href="https://invidious.privacydev.net/latest_version?id=${vidId}&itag=17" target="_blank">[ Putar/Unduh Format 3GP ]</a></div>`;
  }

  let html = `<!DOCTYPE html>
  <html>
  <head><title>${v.title || 'Tonton Video'}</title><style>${baseCSS}</style></head>
  <body>
    <div class="header"><a href="/">&lt;&lt; Kembali</a></div>
    <div class="title">${v.title || 'Video YouTube'}</div>
    <div class="meta">Channel: ${v.uploader || v.author || 'YouTube'}</div>
    
    <div style="margin: 8px 0; padding: 4px; background: #161b22; border: 1px solid #30363d;">
      <div style="font-weight:bold; color: #58a6ff; margin-bottom: 4px;">Pilihan Putar / Unduh:</div>
      ${streamLinksHtml}
    </div>

    <div class="nav"><a href="/">[ Menu Utama ]</a></div>
  </body></html>`;

  res.send(html);
});

// Ekspor aplikasi untuk Vercel Serverless
module.exports = app;
