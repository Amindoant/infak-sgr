// ===============================================
// HALAMAN PENGELUARAN
// ===============================================
const WARNA_KAT = {
  "Upah": "#2E7D32", "Material & Alat": "#EF8F00", "Konsumsi & Acara": "#1565C0",
  "Administrasi": "#6A1B9A", "Operasional": "#78909C"
};
let DATA = [], FILTER = null;

async function loadPengeluaran() {
  const st = document.getElementById("pageStatus");
  SGR.status(st, "loading", "Memuat data pengeluaran…");
  try {
    DATA = await SGR.fetchSheet(CONFIG.SHEET.pengeluaran);
  } catch (e) {
    SGR.status(st, "error", e.message, loadPengeluaran);
    return;
  }
  SGR.status(st, "clear");

  SGR.prepDates(DATA);
  DATA.forEach((r, i) => {
    r._i = i;
    r._jumlah = SGR.parseNumber(r.jumlah);
    r._kategori = SGR.kategoriPengeluaran(r);
    r._cari = [r.keterangan, r._kategori, SGR.tgl(r._date)].join(" ").toLowerCase();
  });

  const dates = DATA.map(r => r._date).filter(Boolean);
  if (dates.length) setText("periode", `Periode: ${SGR.tgl(new Date(Math.min(...dates)))} s/d ${SGR.tgl(new Date(Math.max(...dates)))}`);

  renderKategori();
  render();
}

function renderKategori() {
  const total = DATA.reduce((a, r) => a + r._jumlah, 0);
  const g = {};
  DATA.forEach(r => {
    if (!g[r._kategori]) g[r._kategori] = { total: 0, n: 0 };
    g[r._kategori].total += r._jumlah; g[r._kategori].n++;
  });
  const ent = Object.entries(g).sort((a, b) => b[1].total - a[1].total);
  const row = document.getElementById("kategoriRow");

  row.innerHTML = `<button type="button" class="kat-chip ${FILTER ? "" : "active"}" data-kat="">
      <span class="kat-name">Semua</span><strong>${SGR.rupiahSingkat(total)}</strong><small>${DATA.length} transaksi</small>
    </button>` +
    ent.map(([k, v]) => {
      const raw = total ? v.total / total * 100 : 0;
      const pct = Math.round(raw);
      const pctTxt = raw > 0 && raw < 1 ? "<1%" : pct + "%";
      const c = WARNA_KAT[k] || "#555";
      return `<button type="button" class="kat-chip ${FILTER === k ? "active" : ""}" data-kat="${SGR.esc(k)}" style="--kat:${c}">
        <span class="kat-name">${SGR.esc(k)}</span>
        <strong>${SGR.rupiahSingkat(v.total)}</strong>
        <small>${pctTxt} dari total, ${v.n} transaksi</small>
        <span class="kat-bar"><span style="width:${Math.max(raw, 1)}%"></span></span>
      </button>`;
    }).join("");

  row.querySelectorAll(".kat-chip").forEach(b => b.onclick = () => {
    FILTER = b.dataset.kat || null;
    renderKategori(); render();
  });
}

function render() {
  const q = document.getElementById("cari").value.trim().toLowerCase();
  const baru = document.getElementById("urut").value === "baru";
  const rows = DATA
    .filter(r => (!FILTER || r._kategori === FILTER) && (!q || r._cari.includes(q)))
    .sort((a, b) => ((a._date || 0) - (b._date || 0)) * (baru ? -1 : 1) || a._i - b._i);

  const tb = document.getElementById("dataPengeluaran");
  if (!rows.length) {
    tb.innerHTML = `<tr><td colspan="5" class="empty-cell">Tidak ada transaksi yang cocok.</td></tr>`;
  } else {
    const sub = {};
    rows.forEach(r => { const k = SGR.keyBulan(r._date); sub[k] = (sub[k] || 0) + r._jumlah; });
    let html = "", bulan = null;
    rows.forEach(r => {
      const k = SGR.keyBulan(r._date);
      if (k !== bulan) {
        bulan = k;
        html += `<tr class="month-row"><td colspan="5"><span>${SGR.namaBulan(k)}</span><span>${SGR.rupiah(sub[k])}</span></td></tr>`;
      }
      const c = WARNA_KAT[r._kategori] || "#555";
      html += `<tr>
        <td class="tgl">${SGR.tgl(r._date)}</td>
        <td class="ket">${SGR.esc(r.keterangan)}</td>
        <td><span class="badge" style="--kat:${c}">${SGR.esc(r._kategori)}</span></td>
        <td class="num">${SGR.rupiah(r._jumlah)}</td>
        <td>${SGR.thumb(r.nota, "Foto nota")}</td>
      </tr>`;
    });
    tb.innerHTML = html;
  }

  const total = rows.reduce((a, r) => a + r._jumlah, 0);
  setText("labelTotal", FILTER || q ? `Total yang ditampilkan${FILTER ? " (" + FILTER + ")" : ""}` : "Total pengeluaran");
  setText("totalPengeluaran", SGR.angka(total));
}

function setText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t; }

document.getElementById("cari").addEventListener("input", render);
document.getElementById("urut").addEventListener("change", render);
loadPengeluaran();
