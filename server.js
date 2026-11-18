const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Gunakan instance Invidious publik yang stabil
const INVIDIOUS_API = 'https://invidious.privacydev.net/api/v1';

// Styling CSS Obsidian Luxe khusus layar QVGA 320x240 (Tanpa JS, murni HTML/CSS D-pad friendly)
const baseCSS = `
  body { background-color: #0d1117; color: #c9d1d9; font-family: monospace; margin: 0; padding: 4px; font-size: 11px; }
  a { color: #58a6ff; text-decoration: none; }
  a:focus, a:hover { background-color: #1f6feb; color: #fff; outline: 1px solid #f0f6fc; }
  input, button { background: #161b22; color: #c9d1d9; border: 1px solid #30363d; font-size: 11px; padding: 3px; margin: 2px 0; }
  button:focus { border-color: #58a6ff; }
  .header { background: #161b22; border-bottom: 1px solid #30363d; padding: 4px; text-align: center; }
  .title { font-weight: bold; color: #f0f6fc; font-size: 12px; margin: 2px 0; }
  .item { border-bottom: 1px solid #21262d; padding: 4px 0; }
  .meta { color: #8b949e; font-size: 9px; }
  .nav { text-align: center; margin: 6px 0; font-size: 10px; }
`;

// Halaman Utama / Trending & Search
app.get('/', async (req, res) => {
  try {
    const searchQuery = req.query.q;
    let url = `${INVIDIOUS_API}/trending?region=ID`;
    let pageTitle = "Trending - NokiaTube";

    if (searchQuery) {
      url = `${INVIDIOUS_API}/search?q=${encodeURIComponent(searchQuery)}&type=video`;
      pageTitle = `Cari: ${searchQuery}`;
    }

    const response = await axios.get(url);
    const videos = searchQuery ? response.data : response.data;

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

    videos.slice(fn => fn, 15).forEach(v => {
      const vidId = v.videoId;
      const title = v.title;
      const author = v.author;
      const views = v.viewCountText || '';
      
      html += `
        <div class="item">
          <a href="/watch?id=${vidId}">${title}</a>
          <div class="meta">${author} | ${views}</div>
        </div>`;
    });

    html += `
      </div>
      <div class="nav"><a href="/">[ Menu Utama ]</a></div>
    </body></html>`;

    res.send(html);
  } catch (err) {
    res.send(`<html><body style="background:#0d1117;color:#f85149;">Gagal memuat data dari API. Pastikan server online.<br><a href="/">Kembali</a></body></html>`);
  }
});

// Halaman Tonton / Detail & Download Tautan Video
app.get('/watch', async (req, res) => {
  try {
    const vidId = req.query.id;
    if (!vidId) return res.redirect('/');

    const response = await axios.get(`${INVIDIOUS_API}/videos/${vidId}`);
    const v = response.data;

    // Cari format video paling ringan (3GP atau MP4 resolusi rendah agar kuat diputar Nokia C3)
    const adaptiveFormats = v.formatStreams || [];
    let streamLinksHtml = '';

    adaptiveFormats.forEach(f => {
      if (f.type && (f.type.includes('3gpp') || f.type.includes('mp4'))) {
        streamLinksHtml += `<div><a href="${f.url}" target="_blank">[ Unduh/Putar ${f.quality || 'Standard'} (${f.container}) ]</a></div>`;
      }
    });

    // Fallback jika format spesifik tidak ada, ambil adaptive streams mp4 terkecil
    if (!streamLinksHtml && v.adaptiveStreams) {
      v.adaptiveStreams.forEach(f => {
        if (f.type && f.type.includes('mp4') && (f.resolution === '144p' || f.resolution === '240p')) {
          streamLinksHtml += `<div><a href="${f.url}" target="_blank">[ Putar/Simpan Resolusi ${f.resolution} ]</a></div>`;
        }
      });
    }

    let html = `<!DOCTYPE html>
    <html>
    <head><title>${v.title}</title><style>${baseCSS}</style></head>
    <body>
      <div class="header"><a href="/">&lt;&lt; Kembali ke Beranda</a></div>
      <div class="title">${v.title}</div>
      <div class="meta">Channel: ${v.author} | Dilihat: ${v.viewCount}</div>
      
      <div style="margin: 8px 0; padding: 4px; background: #161b22; border: 1px solid #30363d;">
        <div style="font-weight:bold; color: #58a6ff; margin-bottom: 4px;">Pilihan Putar / Unduh:</div>
        ${streamLinksHtml || '<div>Format video kompatibel tidak ditemukan untuk perangkat ini.</div>'}
      </div>

      <div style="font-size: 10px; color: #8b949e; margin-top: 10px;">
        <em>Tips Nokia C3:</em> Klik tautan unduh/putar di atas. Browser Opera Mini akan meneruskannya ke pemutar media bawaan (Media Player) ponsel.
      </div>

      <div class="nav" style="margin-top:15px;"><a href="/">[ Menu Utama ]</a></div>
    </body></html>`;

    res.send(html);
  } catch (err) {
    res.send(`<html><body style="background:#0d1117;color:#f85149;">Gagal memuat video.<br><a href="/">Kembali</a></body></html>`);
  }
});

app.listen(PORT, () => {
  console.log(`NokiaTube Gateway berjalan di http://localhost:${PORT}`);
});
