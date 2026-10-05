// ===============================================
// HALAMAN MATERIAL SUMBANGAN
// ===============================================
let DATA = [];

async function loadMaterial() {
  const st = document.getElementById("pageStatus");
  SGR.status(st, "loading", "Memuat data material…");
  try {
    DATA = await SGR.fetchSheet(CONFIG.SHEET.material);
  } catch (e) {
    SGR.status(st, "error", e.message, loadMaterial);
    return;
  }
  SGR.status(st, "clear");

  SGR.prepDates(DATA);
  DATA.forEach((r, i) => {
    r._i = i;
    let jumlah = r.jumlah, satuan = r.satuan;
    if (!satuan) {                                 // format lama: "25 sak" dalam satu kolom
      const m = String(jumlah || "").trim().match(/^([\d.,]+)\s*(.*)$/);
      if (m) { jumlah = m[1]; satuan = m[2]; }
    }
    r._jumlah = SGR.parseNumber(jumlah);
    r._satuan = String(satuan || "").trim();
    r._nama = String(r.nama || "").trim();
    r._donatur = String(r.keterangan || r.donatur || "").trim();
    r._cari = [r._nama, r._donatur, SGR.tgl(r._date)].join(" ").toLowerCase();
  });

  renderRekap();
  render();
}

function renderRekap() {
  const g = {};
  DATA.forEach(r => {
    const key = r._nama.toLowerCase() + "|" + r._satuan.toLowerCase();
    if (!g[key]) g[key] = { nama: r._nama, satuan: r._satuan, total: 0, donatur: new Set() };
    g[key].total += r._jumlah;
    g[key].donatur.add(r._donatur.toLowerCase());
  });
  const ent = Object.values(g).sort((a, b) => b.donatur.size - a.donatur.size || b.total - a.total);
  const nDonatur = new Set(DATA.map(r => r._donatur.toLowerCase())).size;
  setText("materialSub", `${DATA.length} kali sumbangan dari ${nDonatur} donatur. Ketuk kartu untuk melihat rinciannya.`);

  const el = document.getElementById("rekapMaterial");
  el.innerHTML = ent.map(x => `
    <button type="button" class="rekap-card" data-q="${SGR.esc(x.nama)}">
      <strong>${SGR.angka(x.total)} <small>${SGR.esc(x.satuan)}</small></strong>
      <span>${SGR.esc(x.nama)}</span>
      <em>${x.donatur.size} donatur</em>
    </button>`).join("");
  el.querySelectorAll(".rekap-card").forEach(b => b.onclick = () => {
    const input = document.getElementById("cari");
    input.value = input.value === b.dataset.q ? "" : b.dataset.q;
    render();
    document.querySelector(".table-wrapper").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function render() {
  const q = document.getElementById("cari").value.trim().toLowerCase();
  const baru = document.getElementById("urut").value === "baru";
  const rows = DATA.filter(r => !q || r._cari.includes(q))
    .sort((a, b) => ((a._date || 0) - (b._date || 0)) * (baru ? -1 : 1) || a._i - b._i);
  document.getElementById("dataMaterial").innerHTML = rows.length
    ? rows.map((r, i) => `<tr>
        <td>${i + 1}</td>
        <td class="tgl">${SGR.tgl(r._date)}</td>
        <td class="ket">${SGR.esc(r._nama)}</td>
        <td class="num">${SGR.angka(r._jumlah)} ${SGR.esc(r._satuan)}</td>
        <td>${SGR.esc(r._donatur)}</td>
      </tr>`).join("")
    : `<tr><td colspan="5" class="empty-cell">Tidak ada data yang cocok dengan pencarian.</td></tr>`;
}

function setText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t; }

document.getElementById("cari").addEventListener("input", render);
document.getElementById("urut").addEventListener("change", render);
loadMaterial();
