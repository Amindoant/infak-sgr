// ===============================================
// HALAMAN DOKUMENTASI
// ===============================================
async function loadDokumentasi() {
  const st = document.getElementById("pageStatus");
  const gallery = document.getElementById("gallery");
  SGR.status(st, "loading", "Memuat dokumentasi…");
  let data;
  try {
    data = await SGR.fetchSheet(CONFIG.SHEET.dokumentasi);
  } catch (e) {
    SGR.status(st, "error", e.message, loadDokumentasi);
    return;
  }
  SGR.status(st, "clear");
  SGR.prepDates(data);

  // Kelompokkan per tanggal + keterangan
  const groups = {};
  data.forEach((item, i) => {
    const ket = String(item.keterangan || "").trim();
    const key = (item._date ? item._date.getTime() : item.tanggal) + "_" + ket;
    if (!groups[key]) groups[key] = { date: item._date, keterangan: ket, fotos: [], videos: [], i };
    if (item.foto && item.foto.trim()) groups[key].fotos.push(SGR.imgur(item.foto));
    if (item.video && item.video.trim()) {
      const id = getYoutubeId(item.video.trim());
      if (id) groups[key].videos.push(id);
    }
  });

  const list = Object.values(groups).sort((a, b) => (b.date || 0) - (a.date || 0) || b.i - a.i);
  if (!list.length) { SGR.status(st, "empty", "Belum ada dokumentasi."); return; }
  document.getElementById("dokSub").textContent =
    `${list.length} kali dokumentasi, terbaru ${SGR.hariTgl(list[0].date)}.`;

  gallery.innerHTML = list.map(g => `
    <article class="timeline-card">
      <div class="tanggal">📅 ${SGR.hariTgl(g.date)}</div>
      <h3>${SGR.esc(g.keterangan)}</h3>
      ${g.fotos.length ? `<div class="foto-grid">${g.fotos.map(f =>
        `<img src="${SGR.esc(f)}" alt="Foto progres ${SGR.esc(SGR.tgl(g.date))}" loading="lazy" data-zoom="${SGR.esc(f)}">`).join("")}</div>` : ""}
      ${g.videos.map(id => `
        <div class="video">
          <iframe src="https://www.youtube.com/embed/${SGR.esc(id)}" title="Video dokumentasi ${SGR.esc(SGR.tgl(g.date))}"
            loading="lazy" frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>`).join("")}
    </article>`).join("");
}

function getYoutubeId(url) {
  const m = url.match(/(?:shorts\/|youtu\.be\/|watch\?v=|embed\/)([\w-]{6,})/);
  return m ? m[1] : "";
}

loadDokumentasi();
